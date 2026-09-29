import type { Page } from "@playwright/test";
import type { ApiClient, StoreStatistics } from "../support/api";
import {
  createCustomer,
  createStore,
  createUser,
  Role,
  type SeededCustomer,
  type SeededStore,
  type SeededUser,
} from "../support/db";
import { expect, parseVnd, readVnd, test } from "../support/fixtures";
import {
  assertLedgerConservesMoney,
  expectedSellerEarnings,
  expectedStoreStats,
  sumBuckets,
} from "../support/reconcile";

/**
 * Đối soát thống kê cửa hàng theo 3 tầng: DB (tính lại độc lập) ⇄ API `/statistics` ⇄ UI tab "Thống kê".
 *
 * Bộ dữ liệu dựng cho MỘT vườn mới, phủ đủ các nhánh mà định nghĩa số liệu phân biệt:
 *
 * | Đơn | Thanh toán | Hàng       | Trạng thái cuối                  | Rơi vào                              |
 * |-----|------------|------------|----------------------------------|--------------------------------------|
 * | O1  | COD        | A×2        | Delivered                        | doanh thu                            |
 * | O2  | COD        | B×1        | Delivered → RMA hoàn tiền xong   | doanh thu + hoàn tiền + công nợ      |
 * | O3  | COD        | A×1        | Confirmed                        | đang xử lý + tiền chưa thu (COD)     |
 * | O4  | PayOS      | B×2        | chưa thanh toán (chưa delivery)  | chờ thanh toán                       |
 * | O5  | COD        | B×1        | khách hủy                        | không tính tiền                      |
 * | O6  | COD        | A×1 + B×1  | Pending                          | đang xử lý + tiền chưa thu (COD)     |
 */
const PRICE_A = 120_000;
const PRICE_B = 80_000;

interface Dataset {
  store: SeededStore;
  customer: SeededCustomer;
  /** Đơn đã có tiền ghi sổ (giao xong / hoàn tiền) — dùng kiểm bảo toàn tiền. */
  settledOrderIds: string[];
}

async function buildDataset(apiAs: (u: SeededUser) => Promise<ApiClient>): Promise<Dataset> {
  const store = await createStore([
    { name: "Kim Tiền A", price: PRICE_A, stock: 50 },
    { name: "Lưỡi Hổ B", price: PRICE_B, stock: 50 },
  ]);
  const [a, b] = store.products;
  const customer = await createCustomer();
  const customerApi = await apiAs(customer);
  const owner = await apiAs(store.owner);
  const staff = await apiAs(await createUser(Role.Staff, "staff"));
  const admin = await apiAs(await createUser(Role.Admin, "admin"));

  const order = (paymentMethod: "COD" | "PayOS", items: Array<[typeof a, number]>) =>
    customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod,
      items: items.map(([p, quantity]) => ({ productItemId: p.productItemId, quantity })),
    });

  const o1 = await order("COD", [[a, 2]]);
  await owner.advanceDelivery(o1.deliveries[0].id, "Delivered");

  const o2 = await order("COD", [[b, 1]]);
  await owner.advanceDelivery(o2.deliveries[0].id, "Delivered");
  const ticket = await customerApi.createReturn({
    deliveryId: o2.deliveries[0].id,
    items: [{ orderItemId: o2.items[0].id, quantity: 1 }],
  });
  const refund = await staff.acceptAndApproveRefund(ticket.id);
  await admin.completeRefund(refund.id);

  const o3 = await order("COD", [[a, 1]]);
  await owner.advanceDelivery(o3.deliveries[0].id, "Confirmed");

  await order("PayOS", [[b, 2]]);

  const o5 = await order("COD", [[b, 1]]);
  await customerApi.post(`orders/${o5.id}/cancel`, undefined, "hủy O5");

  await order("COD", [
    [a, 1],
    [b, 1],
  ]);

  return { store, customer, settledOrderIds: [o1.id, o2.id] };
}

test.describe("Thống kê cửa hàng (vendor)", () => {
  // Cùng một bộ dữ liệu cho cả nhóm ⇒ chạy tuần tự trong một worker (không "serial": một ca đỏ
  // không được làm các ca đối soát khác bị bỏ qua).
  test.describe.configure({ mode: "default" });

  let data: Dataset;
  let stats: StoreStatistics;

  test.beforeEach(async ({ apiAs }) => {
    data ??= await buildDataset(apiAs);
    // Mỗi test đọc lại bằng client của chính nó (client cũ đã dispose khi test trước kết thúc).
    stats = await (await apiAs(data.store.owner)).storeStatistics(data.store.storeId);
  });

  test("Statistics_Api_MatchesIndependentDatabaseComputation", async () => {
    const expected = await expectedStoreStats(data.store.storeId);

    expect.soft(stats.totalRevenue, "totalRevenue").toBe(expected.totalRevenue);
    expect.soft(stats.totalShippingFee, "totalShippingFee").toBe(expected.totalShippingFee);
    expect.soft(stats.totalDeliveries, "totalDeliveries").toBe(expected.totalDeliveries);
    expect
      .soft(stats.deliveriesByStatus, "deliveriesByStatus")
      .toEqual(expected.deliveriesByStatus);
    expect.soft(stats.activeDeliveries, "activeDeliveries").toBe(expected.activeDeliveries);
    expect
      .soft(stats.activeDeliveriesValue, "activeDeliveriesValue")
      .toBe(expected.activeDeliveriesValue);
    expect
      .soft(stats.awaitingPaymentOrders, "awaitingPaymentOrders")
      .toBe(expected.awaitingPaymentOrders);
    expect
      .soft(stats.awaitingPaymentValue, "awaitingPaymentValue")
      .toBe(expected.awaitingPaymentValue);
    expect
      .soft(stats.outstandingLiabilityValue, "outstandingLiabilityValue")
      .toBe(expected.outstandingLiabilityValue);
    expect.soft(stats.productCount, "productCount").toBe(expected.productCount);
    expect.soft(stats.staffCount, "staffCount").toBe(expected.staffCount);
    // Tiền đã giao chia hết vào hai rổ đối soát — không được rơi rớt hay đếm hai lần.
    expect
      .soft(
        stats.availableForPayoutValue + stats.pendingClearanceValue,
        "available + pendingClearance",
      )
      .toBe(expected.totalRevenue);

    const completedRows = stats.itemsByStatus.filter((r) => r.status === "Completed");
    for (const row of completedRows) {
      expect
        .soft(row.value, `dòng Completed của ${row.productName}`)
        .toBe(expected.completedValueByProduct[row.productId]);
    }
    const refunded = stats.itemsByStatus
      .filter((r) => r.status === "Refunded")
      .reduce((s, r) => s + r.value, 0);
    expect
      .soft(refunded, "Σ dòng Refunded = Σ giá trị hàng bị trả đã hoàn")
      .toBe(expected.refundedItemsValue);
  });

  test("Statistics_Api_MatchesHandComputedDataset", async () => {
    // Oracle thứ hai, tính tay từ bảng dữ liệu ở đầu file — bắt cả trường hợp SQL oracle và BE cùng sai.
    const [a, b] = data.store.products;
    expect.soft(stats.totalRevenue, "O1 (A×2) + O2 (B×1)").toBe(2 * PRICE_A + PRICE_B);
    expect
      .soft(stats.totalDeliveries, "O1, O2, O3, O5, O6 — O4 chưa trả nên chưa có delivery")
      .toBe(5);
    expect
      .soft(stats.deliveriesByStatus)
      .toEqual({ Delivered: 2, Confirmed: 1, Pending: 1, Cancelled: 1 });
    expect.soft(stats.activeDeliveries, "O3 + O6").toBe(2);
    expect.soft(stats.activeDeliveriesValue, "O3 + O6").toBe(PRICE_A + (PRICE_A + PRICE_B));
    expect
      .soft(stats.awaitingPaymentOrders, "chỉ O4 (COD không phải 'đơn chờ thanh toán')")
      .toBe(1);
    expect
      .soft(stats.awaitingPaymentValue, "O4 + COD đang chạy (O3, O6)")
      .toBe(2 * PRICE_B + PRICE_A + (PRICE_A + PRICE_B));
    expect.soft(stats.outstandingLiabilityValue, "công nợ từ RMA của O2").toBe(PRICE_B);
    expect.soft(stats.productCount).toBe(2);

    const row = (productId: string, status: string) =>
      stats.itemsByStatus.find((r) => r.productId === productId && r.status === status);
    expect
      .soft(row(a.productId, "Completed"), "A đã giao")
      .toMatchObject({ quantity: 2, value: 2 * PRICE_A, orderCount: 1 });
    expect
      .soft(row(b.productId, "Completed"), "B đã giao")
      .toMatchObject({ quantity: 1, value: PRICE_B, orderCount: 1 });
    expect
      .soft(row(b.productId, "Refunded"), "B bị hoàn")
      .toMatchObject({ quantity: 1, value: PRICE_B, orderCount: 1 });
    expect
      .soft(row(a.productId, "Ordered"), "A trong O3 + O6 (COD)")
      .toMatchObject({ quantity: 2, value: 2 * PRICE_A, orderCount: 2 });
    // B: O4 (PayOS chưa trả, 2 cái) và O6 (COD, 1 cái) cùng lớp Ordered.
    const bOrdered = stats.itemsByStatus.filter(
      (r) => r.productId === b.productId && r.status === "Ordered",
    );
    expect
      .soft(
        bOrdered.reduce((s, r) => s + r.quantity, 0),
        "B ở lớp Ordered",
      )
      .toBe(3);
    expect
      .soft(
        stats.itemsByStatus.some((r) => r.status === "Paid"),
        "không có đơn PayOS đã trả",
      )
      .toBeFalsy();
  });

  /**
   * Tài liệu: itemsByStatus "gộp theo (SẢN PHẨM × TRẠNG THÁI)". FE dùng `${productId}-${status}` làm
   * React key — trùng cặp thì React có thể nuốt/nhân đôi dòng, và chủ vườn thấy cùng một món hai lần.
   * Bộ dữ liệu có B vừa nằm trong đơn PayOS chưa trả (O4) vừa trong đơn COD đang giao (O6) — cả hai đều
   * là lớp "Ordered".
   */
  test("Statistics_ItemsByStatus_OneRowPerProductAndStatus", async () => {
    const keys = stats.itemsByStatus.map((r) => `${r.productName} × ${r.status}`);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(duplicates, "mỗi cặp (sản phẩm, trạng thái) chỉ được một dòng").toEqual([]);
  });

  /**
   * Phí sàn 8% (docs/adr/platform-fee-ledger.md). O1 giao xong: vườn nhận 240 000 − 19 200. O2 giao xong rồi
   * hoàn toàn bộ: +80 000 − 6 400 − 80 000 + 6 400 = 0. Thực nhận = 220 800, phí sàn giữ lại = 19 200.
   */
  test("Statistics_SellerEarnings_MatchCommissionPolicyAndLedger", async () => {
    const expected = await expectedSellerEarnings(data.store.storeId);
    expect
      .soft(stats.ledgerBalance, "API ledgerBalance = tính lại từ bảng nghiệp vụ")
      .toBe(expected.ledgerBalance);
    expect
      .soft(stats.platformCommission, "API platformCommission = tính lại")
      .toBe(expected.platformCommission);

    const commissionA = Math.round(2 * PRICE_A * 0.08);
    expect
      .soft(stats.ledgerBalance, "tính tay: O1 − phí sàn, O2 hoàn trọn về 0")
      .toBe(2 * PRICE_A - commissionA);
    expect.soft(stats.platformCommission, "tính tay").toBe(commissionA);
    // Giao hôm nay ⇒ toàn bộ còn trong khoảng giữ 7 ngày.
    expect.soft(stats.ledgerAvailable).toBe(0);
    expect.soft(stats.ledgerPending).toBe(stats.ledgerBalance);
  });

  test("Statistics_Ledger_EveryOrderConservesMoney", async () => {
    for (const orderId of data.settledOrderIds) await assertLedgerConservesMoney(orderId);
  });

  test("Statistics_RevenueChart_EveryRangeSumsToHeadlineNumbers", async ({ apiAs }) => {
    const expected = await expectedStoreStats(data.store.storeId);
    const owner = await apiAs(data.store.owner);

    // Mọi sự kiện của bộ dữ liệu vừa xảy ra ⇒ nằm trong MỌI mốc (7 ngày, tháng, quý, năm nay).
    for (const range of ["week", "month", "quarter", "year"] as const) {
      const buckets = stats.revenueSeriesByRange[range];
      expect
        .soft(sumBuckets(buckets, "completed"), `${range}: Σ completed = totalRevenue`)
        .toBe(stats.totalRevenue);
      expect
        .soft(
          sumBuckets(buckets, "awaitingPayment"),
          `${range}: Σ awaitingPayment = awaitingPaymentValue`,
        )
        .toBe(stats.awaitingPaymentValue);
      expect
        .soft(sumBuckets(buckets, "inProgress"), `${range}: Σ inProgress (PayOS đã trả đang giao)`)
        .toBe(0);
      expect
        .soft(sumBuckets(buckets, "refunded"), `${range}: Σ refunded = Σ refund Completed`)
        .toBe(expected.refundedTotal);

      // Tài liệu cam kết: bốn mốc trong bundle trùng khít với cái `?range=` trả ra.
      const single = await owner.storeStatistics(data.store.storeId, range);
      expect.soft(single.revenueSeries, `bundle[${range}] = ?range=${range}`).toEqual(buckets);
    }
  });

  test("Statistics_OwnerUi_ShowsSameNumbersAsApi", async ({ page, loginAs }) => {
    await loginAs(page, data.store.owner);
    await page.goto(`/stores/${data.store.storeId}`);
    const statsLoaded = page.waitForResponse((r) =>
      r.url().includes(`/stores/${data.store.storeId}/statistics`),
    );
    await page.getByRole("tab", { name: "Thống kê" }).click();
    await statsLoaded;

    const card = (label: string) =>
      page.locator("div.rounded-2xl", { has: page.getByText(label, { exact: true }) });
    const cardValue = (label: string) => card(label).locator("p").first();
    const cardSub = (label: string) => card(label).locator("p").nth(1);

    expect(await readVnd(cardValue("Doanh thu (đã giao)"))).toBe(stats.totalRevenue);
    const deliveredCount =
      (stats.deliveriesByStatus.Delivered ?? 0) + (stats.deliveriesByStatus.Completed ?? 0);
    // Dòng phụ: "<n> đơn · Thực nhận sau phí sàn: <số dư sổ cái>".
    const revenueSub = await cardSub("Doanh thu (đã giao)").innerText();
    expect(revenueSub.startsWith(`${deliveredCount} đơn`), revenueSub).toBeTruthy();
    expect(
      parseVnd(revenueSub.split(":").pop()!),
      "thực nhận trên UI = ledgerBalance của API",
    ).toBe(stats.ledgerBalance);

    await expect(cardValue("Tổng đơn giao")).toHaveText(String(stats.totalDeliveries));
    expect(await readVnd(cardSub("Tổng đơn giao"))).toBe(stats.totalShippingFee);

    await expect(cardValue("Đang xử lý")).toHaveText(String(stats.activeDeliveries));
    expect(await readVnd(cardSub("Đang xử lý"))).toBe(stats.activeDeliveriesValue);

    await expect(cardValue("Nhân viên")).toHaveText(String(stats.staffCount));

    await expectStatusBreakdown(page, stats);
  });
});

/** Khối "Đơn giao theo trạng thái": mỗi dòng phải đúng số đếm của API. */
async function expectStatusBreakdown(page: Page, stats: StoreStatistics) {
  const labels: Record<string, string> = {
    Pending: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Delivered: "Đã giao",
    Cancelled: "Đã hủy",
  };
  const panel = page.locator("div.rounded-2xl", { hasText: "Đơn giao theo trạng thái" });
  for (const [status, label] of Object.entries(labels)) {
    const line = panel.locator("li", { has: page.getByText(label, { exact: true }) });
    await expect(line.locator("span").last(), `dòng "${label}"`).toHaveText(
      String(stats.deliveriesByStatus[status] ?? 0),
    );
  }
}
