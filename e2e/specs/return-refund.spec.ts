import type { Envelope, ReturnDetail } from "../support/api";
import { createCustomer, createStore, createUser, db, Role, stockOf } from "../support/db";
import { E2E } from "../support/env";
import { expect, test, TINY_PNG, vi } from "../support/fixtures";
import { expectedStoreStats } from "../support/reconcile";

const detailText = vi.order_detail;
const modalText = detailText.return_modal;

test.describe("Hoàn hàng / hoàn tiền", () => {
  test("Return_RefundFlow_FromUiRequestToCompletedRefund_MoneyReconciles", async ({
    page,
    loginAs,
    apiAs,
    mockEvidenceUpload,
  }) => {
    // Hai món khác giá, khách chỉ trả MỘT món ⇒ số tiền hoàn phải đúng phần bị trả, không phải cả đơn.
    const store = await createStore([
      { name: "Trầu Bà", price: 180_000, stock: 6 },
      { name: "Sen Đá", price: 70_000, stock: 6 },
    ]);
    const [kept, returned] = store.products;
    const customer = await createCustomer();
    const staff = await createUser(Role.Staff, "staff");
    const admin = await createUser(Role.Admin, "admin");

    const customerApi = await loginAs(page, customer);
    const ownerApi = await apiAs(store.owner);
    const staffApi = await apiAs(staff);
    const adminApi = await apiAs(admin);
    await mockEvidenceUpload(page);

    const order = await customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [
        { productItemId: kept.productItemId, quantity: 1 },
        { productItemId: returned.productItemId, quantity: 2 },
      ],
    });
    const deliveryId = order.deliveries[0].id;
    await ownerApi.advanceDelivery(deliveryId, "Delivered");
    const statsBefore = await expectedStoreStats(store.storeId);

    // ── Khách gửi yêu cầu trả hàng qua UI ──
    await page.goto(`/profile/orders/${order.id}`);
    await page.getByRole("button", { name: detailText.actions.return, exact: true }).click();
    await page.getByRole("button", { name: new RegExp(store.name) }).click(); // chọn đơn giao
    const modal = page.locator("div.fixed.inset-0").filter({ hasText: modalText.title });
    await expect(modal).toBeVisible();

    // Tick món thì UI mặc định trả TOÀN BỘ số lượng đã mua của món đó (2).
    const returnedRow = modal.locator("div.p-3", { hasText: returned.name });
    await returnedRow.getByRole("checkbox").check();
    await expect(returnedRow).toContainText("/ 2");
    await modal.getByPlaceholder(modalText.reason_placeholder).fill("Cây héo lá khi nhận (E2E).");
    await modal
      .locator('input[type="file"]')
      .setInputFiles({ name: "evidence.png", mimeType: "image/png", buffer: TINY_PNG });
    await expect(modal.getByRole("img", { name: modalText.image_alt })).toHaveCount(1);
    await modal.getByPlaceholder("NGUYEN VAN A").fill("KHACH E2E");
    await modal.getByPlaceholder("0123456789").fill("0123456789");
    await modal.getByPlaceholder("Vietcombank").fill("Ngân hàng E2E");

    const created = page.waitForResponse(
      (r) => r.url() === `${E2E.apiBaseUrl}/returns` && r.request().method() === "POST",
    );
    await modal.getByRole("button", { name: modalText.submit }).click();
    const createdBody = (await (await created).json()) as Envelope<ReturnDetail>;
    expect(createdBody.isSuccess, `tạo yêu cầu trả hàng: ${createdBody.message}`).toBeTruthy();
    await expect(page.getByText(detailText.toast.return_success)).toBeVisible();
    const ticketId = createdBody.data.id;

    // Payload UI gửi đi phải đúng món/số lượng khách đã chọn.
    const { rows: items } = await db().query<{
      order_item_id: string;
      quantity: number;
      unit_price: number;
    }>(
      `select order_item_id, quantity, unit_price from return_items where return_request_id = $1`,
      [ticketId],
    );
    const returnedLine = order.items.find((i) => i.productItemId === returned.productItemId)!;
    expect(items).toEqual([
      { order_item_id: returnedLine.id, quantity: 2, unit_price: returned.price },
    ]);
    const expectedRefund = returned.price * 2;
    expect(createdBody.data.status).toBe("Requested");
    expect(createdBody.data.refundAmount, "tiền hoàn = Σ đơn giá × SL món bị trả").toBe(
      expectedRefund,
    );

    // Đang có ticket mở ⇒ UI không cho mở ticket thứ hai cho cùng đơn giao.
    await page.reload();
    await expect(
      page.getByRole("button", { name: detailText.delivery.return_pending }).first(),
    ).toBeDisabled();

    // ── Staff duyệt, cổng báo hoàn tiền xong ──
    const refund = await staffApi.acceptAndApproveRefund(ticketId);
    expect(refund.amount, "lệnh hoàn tiền = số tiền đã chốt trên ticket").toBe(expectedRefund);
    await adminApi.completeRefund(refund.id);

    // ── Đối soát sau hoàn tiền ──
    const ticket = await customerApi.getReturn(ticketId);
    expect(ticket.status).toBe("Completed");
    expect(ticket.refund?.status).toBe("Completed");

    const { rows: liabilities } = await db().query<{
      amount: number;
      status: string;
      garden_id: string;
    }>(`select amount, status, garden_id from vendor_liabilities where ticket_id = $1`, [ticketId]);
    expect(liabilities, "hoàn tiền xong phải sinh ĐÚNG một khoản công nợ cho vườn").toHaveLength(1);
    expect(liabilities[0]).toEqual({
      amount: expectedRefund,
      status: "Pending",
      garden_id: store.storeId,
    });

    // PlantHealth: cây chết không thu hồi ⇒ không được cộng lại kho.
    expect(await stockOf(returned.productItemId)).toBe(returned.stock - 2);

    const stats = await ownerApi.storeStatistics(store.storeId);
    const statsAfter = await expectedStoreStats(store.storeId);
    expect(statsAfter.refundedTotal - statsBefore.refundedTotal).toBe(expectedRefund);
    expect(stats.outstandingLiabilityValue, "công nợ trên thống kê = Σ công nợ chưa miễn").toBe(
      statsAfter.outstandingLiabilityValue,
    );
    const refundedRow = stats.itemsByStatus.find(
      (r) => r.status === "Refunded" && r.productId === returned.productId,
    );
    expect(refundedRow, "thống kê phải có dòng Refunded cho món bị trả").toBeTruthy();
    expect(refundedRow).toMatchObject({ quantity: 2, value: expectedRefund, orderCount: 1 });
    const refundedInChart = stats.revenueSeriesByRange.year.reduce((s, b) => s + b.refunded, 0);
    expect(refundedInChart, "lớp 'hoàn tiền' của biểu đồ năm = Σ refund Completed").toBe(
      statsAfter.refundedTotal,
    );
  });

  test("Return_WindowClosed_IsRejected", async ({ apiAs }) => {
    const store = await createStore([{ name: "Ngọc Ngân", price: 95_000, stock: 3 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const customerApi = await apiAs(customer);
    const ownerApi = await apiAs(store.owner);

    const order = await customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 1 }],
    });
    const deliveryId = order.deliveries[0].id;
    await ownerApi.advanceDelivery(deliveryId, "Delivered");
    // Kéo mốc giao về 8 ngày trước — quá cửa sổ 7 ngày của ReturnWorkflow.
    await db().query(
      `update deliveries set delivered_at = now() - interval '8 days' where id = $1`,
      [deliveryId],
    );

    const res = await customerApi.rawPost("returns", {
      deliveryId,
      type: "Refund",
      reason: "PlantHealth",
      items: [{ orderItemId: order.items[0].id, quantity: 1 }],
      imageUrls: ["https://e2e-storage.invalid/evidence/late.png"],
      bankAccountName: "KHACH E2E",
      bankAccountNumber: "0123456789",
      bankName: "Ngân hàng E2E",
    });
    expect(res.ok(), "quá 7 ngày kể từ lúc giao thì không được mở yêu cầu trả hàng").toBeFalsy();
    const { rows } = await db().query(`select 1 from return_requests where delivery_id = $1`, [
      deliveryId,
    ]);
    expect(rows).toHaveLength(0);
  });

  test("Return_QuantityAboveOrdered_IsRejected", async ({ apiAs }) => {
    const store = await createStore([{ name: "Vạn Lộc", price: 110_000, stock: 4 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const customerApi = await apiAs(customer);
    const ownerApi = await apiAs(store.owner);

    const order = await customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 1 }],
    });
    await ownerApi.advanceDelivery(order.deliveries[0].id, "Delivered");

    const res = await customerApi.rawPost("returns", {
      deliveryId: order.deliveries[0].id,
      type: "Refund",
      reason: "PlantHealth",
      items: [{ orderItemId: order.items[0].id, quantity: 5 }],
      imageUrls: ["https://e2e-storage.invalid/evidence/over.png"],
      bankAccountName: "KHACH E2E",
      bankAccountNumber: "0123456789",
      bankName: "Ngân hàng E2E",
    });
    expect(
      res.ok(),
      "trả nhiều hơn số đã mua phải bị từ chối (nếu không sẽ hoàn tiền khống)",
    ).toBeFalsy();
  });
});
