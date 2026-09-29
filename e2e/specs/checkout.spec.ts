import type { Page, Response } from "@playwright/test";
import type { Envelope, OrderDetail } from "../support/api";
import { createCustomer, createStore, db, stockOf, type SeededProduct } from "../support/db";
import { E2E } from "../support/env";
import { expect, parseVnd, readVnd, test, vi } from "../support/fixtures";
import { assertOrderMoneyInvariants } from "../support/reconcile";

const cartText = vi.cart_page;
const checkoutText = vi.checkout_page;
const detailText = vi.order_detail;

/** Trang sản phẩm → "Thêm giỏ hàng", chờ BE xác nhận đã thêm. */
async function addToCartFromProductPage(page: Page, product: SeededProduct) {
  await page.goto(`/products/${product.productId}`);
  await expect(page.getByText(product.name).first()).toBeVisible();
  const added = page.waitForResponse(
    (r) => r.url().endsWith("/cart/items") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: vi.product_detail.actions.add_to_cart }).click();
  expect((await added).ok(), "BE phải nhận thêm vào giỏ").toBeTruthy();
}

/** Giỏ → tick đúng món → sang trang thanh toán. */
async function goToCheckout(page: Page, productNames: string[]) {
  await page.goto("/cart");
  for (const name of productNames) {
    await page.locator("li", { hasText: name }).getByRole("checkbox").check();
  }
  // Hook preview trả phí 0 khi CHƯA có dữ liệu (và cả khi lỗi) ⇒ phải chờ đúng response rồi mới đọc.
  const preview = page.waitForResponse((r) => r.url().endsWith("/orders/shipping-fee-preview"));
  await page.getByRole("button", { name: cartText.actions.checkout }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  const res = await preview;
  expect(res.ok(), `xem trước phí ship lỗi ${res.status()} — UI sẽ hiển thị phí 0`).toBeTruthy();
}

/** Đọc các con số ở khối tóm tắt đơn của trang thanh toán — sau khi phí ship đã tính xong. */
async function readCheckoutSummary(page: Page) {
  const summary = page.locator("aside").filter({ hasText: checkoutText.summary.total });
  const row = (label: RegExp | string) =>
    summary.locator("div.flex.justify-between", { hasText: label }).locator("span").last();

  // Phí ship tính lại mỗi khi địa chỉ mặc định nạp xong ⇒ đọc lặp tới khi khối tóm tắt tự nhất quán.
  const discountRow = page.getByTestId("shipping-discount-row");
  let snapshot = { subtotal: 0, shippingText: "", shipping: 0, discount: 0, total: 0 };
  await expect(async () => {
    const shippingText = (await row(checkoutText.summary.shipping_fee).innerText()).trim();
    snapshot = {
      subtotal: await readVnd(row(/^Tạm tính/)),
      shippingText,
      shipping: parseVnd(shippingText),
      discount: (await discountRow.count()) ? await readVnd(discountRow.locator("span").last()) : 0,
      total: await readVnd(row(checkoutText.summary.total)),
    };
    expect(snapshot.total, "trên chính trang thanh toán: tổng = tạm tính + phí ship − giảm").toBe(
      snapshot.subtotal + snapshot.shipping - snapshot.discount,
    );
  }).toPass({ timeout: 15_000 });
  return snapshot;
}

async function placeCodOrder(page: Page): Promise<OrderDetail> {
  await page.getByLabel("Thanh toán khi nhận hàng (COD)").check();
  const created = page.waitForResponse(
    (r: Response) => r.url() === `${E2E.apiBaseUrl}/orders` && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: checkoutText.actions.place_order }).click();
  const res = await created;
  const body = (await res.json()) as Envelope<OrderDetail>;
  expect(res.ok() && body.isSuccess, `đặt hàng phải thành công: ${body.message}`).toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/profile/orders/${body.data.id}$`));
  return body.data;
}

test.describe("Đặt hàng COD qua UI", () => {
  test("Checkout_CodOrder_UiTotalsMatchApiAndDatabase", async ({ page, loginAs }) => {
    const store = await createStore([{ name: "Cây Kim Tiền", price: 150_000, stock: 10 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const api = await loginAs(page, customer);

    await addToCartFromProductPage(page, product);
    await goToCheckout(page, [product.name]);
    const shown = await readCheckoutSummary(page);
    expect(shown.subtotal, "tạm tính trên UI = giá × số lượng").toBe(product.price);

    const order = await placeCodOrder(page);

    // 1. Con số khách THẤY lúc bấm "Đặt hàng" phải đúng bằng con số BE ghi nợ.
    expect(order.subtotal, "subtotal BE = tạm tính UI").toBe(shown.subtotal);
    expect(order.totalAmount, "tổng tiền BE = tổng cộng UI lúc đặt").toBe(shown.total);

    // 2. Bất biến tiền trong DB.
    const persisted = await assertOrderMoneyInvariants(order.id);
    expect(persisted.total_amount).toBe(order.totalAmount);
    expect(
      persisted.deliveries,
      "COD tạo delivery ngay khi đặt, mỗi vườn một delivery",
    ).toHaveLength(1);

    // 3. Tác dụng phụ: trừ kho, xoá khỏi giỏ, trạng thái khởi đầu.
    expect(await stockOf(product.productItemId), "kho phải trừ đúng số lượng đặt").toBe(
      product.stock - 1,
    );
    const cart = await api.get<{ items: Array<{ productItemId: string }> }>("cart");
    expect(cart.items.map((i) => i.productItemId)).not.toContain(product.productItemId);
    const { rows } = await db().query(`select status, payment_method from orders where id = $1`, [
      order.id,
    ]);
    expect(rows[0]).toEqual({ status: "Pending", payment_method: "COD" });

    // 4. Trang chi tiết đơn hiển thị đúng số đã lưu.
    await expect(page.getByText(detailText.product.total, { exact: true })).toBeVisible();
    const detailRow = (label: string) =>
      page.locator("div.flex.justify-between", { hasText: label }).locator("span").last();
    expect(await readVnd(detailRow(detailText.product.subtotal))).toBe(persisted.subtotal);
    expect(await readVnd(detailRow(detailText.product.shipping_fee))).toBe(
      persisted.total_shipping_fee,
    );
    expect(await readVnd(detailRow(detailText.product.total))).toBe(persisted.total_amount);
  });

  /**
   * Trước đây trang thanh toán TỰ cho phí ship = 0 khi tạm tính ≥ 500.000đ mà BE không có luật đó ⇒ khách
   * thấy 650 000, bị ghi nợ 665 000. Nay FREESHIP500 là voucher thật ở BE (tự áp): số UI hiện, số BE tính và
   * số lưu DB phải là một; khoản giảm ≤ phí ship và ≤ 8% tiền hàng (voucher sàn tài trợ trừ vào phí sàn).
   */
  test("Checkout_SubtotalOver500k_FreeShipVoucherAppliedAndChargedAsDisplayed", async ({
    page,
    loginAs,
  }) => {
    const store = await createStore([{ name: "Tùng La Hán", price: 650_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    await loginAs(page, customer);

    await addToCartFromProductPage(page, product);
    await goToCheckout(page, [product.name]);
    const shown = await readCheckoutSummary(page);
    expect(shown.discount, "FREESHIP500 phải tự áp và miễn trọn phí ship").toBe(shown.shipping);
    await expect(page.getByTestId("shipping-discount-row")).toContainText("FREESHIP500");

    const order = await placeCodOrder(page);
    expect(order.totalAmount, "BE ghi nợ đúng số khách thấy").toBe(shown.total);
    expect(order.shippingDiscount).toBe(shown.discount);
    await assertOrderMoneyInvariants(order.id);
  });

  test("Checkout_BelowThresholdWithCode_ShowsReasonAndBlocksOrder", async ({ page, loginAs }) => {
    const store = await createStore([{ name: "Cau Tiểu Trâm", price: 120_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    await loginAs(page, customer);

    await addToCartFromProductPage(page, product);
    await goToCheckout(page, [product.name]);

    // Trang còn render lại khi giỏ nạp xong — gõ trước lúc đó là mất chữ. Đợi tóm tắt ổn định rồi mới nhập.
    await readCheckoutSummary(page);
    const codeInput = page.getByPlaceholder(checkoutText.voucher.placeholder);
    await codeInput.fill("freeship500");
    await expect(codeInput).toHaveValue("FREESHIP500");
    const preview = page.waitForResponse((r) => r.url().endsWith("/orders/shipping-fee-preview"));
    await page.getByRole("button", { name: checkoutText.voucher.apply }).click();
    await preview;

    // Mã khách tự nhập mà không đủ điều kiện: nói rõ lý do, không cho đặt với giá khác số đã thấy.
    await expect(page.getByRole("alert")).toContainText("500.000");
    await expect(
      page.getByRole("button", { name: checkoutText.actions.place_order }),
    ).toBeDisabled();
    const shown = await readCheckoutSummary(page);
    expect(shown.discount).toBe(0);

    // Bỏ mã ⇒ đặt được bình thường, không có khoản giảm.
    await page.getByRole("button", { name: checkoutText.voucher.remove }).click();
    await expect(
      page.getByRole("button", { name: checkoutText.actions.place_order }),
    ).toBeEnabled();
    const order = await placeCodOrder(page);
    expect(order.shippingDiscount ?? 0).toBe(0);
  });

  test("Checkout_StockExceeded_IsRejectedWithoutSideEffects", async ({ loginAs, page }) => {
    const store = await createStore([{ name: "Lưỡi Hổ", price: 90_000, stock: 2 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const api = await loginAs(page, customer);

    const res = await api.rawPost("orders", {
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 3 }],
    });
    expect(res.ok(), "đặt vượt tồn kho phải bị từ chối").toBeFalsy();
    expect(await stockOf(product.productItemId), "bị từ chối thì không được trừ kho").toBe(2);
    const { rows } = await db().query(
      `select count(*)::int as n from orders where customer_id = $1`,
      [customer.id],
    );
    expect(rows[0].n, "bị từ chối thì không được sinh đơn").toBe(0);
  });
});
