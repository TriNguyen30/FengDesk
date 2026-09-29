import { createCustomer, createStore, db } from "../support/db";
import { E2E } from "../support/env";
import { expect, test } from "../support/fixtures";
import { assertLedgerConservesMoney } from "../support/reconcile";

/**
 * Nút "Đã nhận hàng" của khách. Trước đây nút gọi endpoint DEV `/api/dev/deliveries/…` — endpoint đó bị gỡ chốt
 * Development nên ai đăng nhập cũng ép được đơn bất kỳ sang Delivered. Nay đi qua
 * `POST /api/orders/{id}/confirm-received` (chỉ chủ đơn, chỉ kiện đang giao) và endpoint dev bị khoá lại.
 */
test.describe("Khách xác nhận đã nhận hàng", () => {
  test("ConfirmReceived_ShippedOrder_ViaUi_CompletesOrderAndBooksLedger", async ({
    page,
    loginAs,
    apiAs,
  }) => {
    const store = await createStore([{ name: "Ngũ Gia Bì", price: 180_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const customerApi = await loginAs(page, customer);
    const owner = await apiAs(store.owner);

    const order = await customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 1 }],
    });
    await owner.advanceDelivery(order.deliveries[0].id, "Shipped");

    await page.goto(`/profile/orders/${order.id}`);
    const confirmed = page.waitForResponse(
      (r) => r.url() === `${E2E.apiBaseUrl}/orders/${order.id}/confirm-received`,
    );
    await page.getByRole("button", { name: "Đã nhận hàng" }).click();
    expect((await confirmed).ok(), "BE phải nhận xác nhận của chủ đơn").toBeTruthy();
    await expect(page.getByText("Xác nhận đã nhận hàng thành công")).toBeVisible();

    const { rows } = await db().query<{ order_status: string; delivery_status: string }>(
      `select o.status as order_status, d.status as delivery_status
         from orders o join deliveries d on d.order_id = o.id where o.id = $1`,
      [order.id],
    );
    expect(rows[0]).toEqual({ order_status: "Completed", delivery_status: "Delivered" });
    await assertLedgerConservesMoney(order.id);
  });

  test("ConfirmReceived_NotYetShipped_IsRejected", async ({ apiAs }) => {
    const store = await createStore([{ name: "Kim Tiền", price: 90_000, stock: 2 }]);
    const customer = await createCustomer();
    const customerApi = await apiAs(customer);
    const order = await customerApi.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: store.products[0].productItemId, quantity: 1 }],
    });

    // Chưa giao (Pending) thì không xác nhận được — tránh khách tự mở cửa sổ hoàn tiền cho hàng chưa gửi.
    const res = await customerApi.rawPost(`orders/${order.id}/confirm-received`, {});
    expect(res.status(), "kiện chưa giao phải bị từ chối").toBe(409);
  });
});
