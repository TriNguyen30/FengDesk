import { createCustomer, createStore, db, stockOf } from "../support/db";
import { E2E } from "../support/env";
import { expect, test, vi } from "../support/fixtures";

const detailText = vi.order_detail;

test.describe("Hủy đơn hàng", () => {
  test("Cancel_PendingCodOrder_ViaUi_RestoresStockAndCancelsDeliveries", async ({
    page,
    loginAs,
    apiAs,
  }) => {
    const store = await createStore([{ name: "Kim Ngân", price: 200_000, stock: 8 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    await loginAs(page, customer);
    const api = await apiAs(customer);

    const order = await api.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 3 }],
    });
    expect(await stockOf(product.productItemId)).toBe(5);

    await page.goto(`/profile/orders/${order.id}`);
    await page.getByRole("button", { name: detailText.actions.cancel, exact: true }).click();
    const cancelled = page.waitForResponse(
      (r) => r.url() === `${E2E.apiBaseUrl}/orders/${order.id}/cancel`,
    );
    await page.getByRole("button", { name: detailText.cancel_modal.confirm }).click();
    expect((await cancelled).ok(), "BE phải chấp nhận hủy đơn Pending").toBeTruthy();
    await expect(page.getByText(detailText.toast.cancel_success)).toBeVisible();

    expect(await stockOf(product.productItemId), "hủy đơn phải trả lại đủ kho").toBe(product.stock);
    const { rows } = await db().query<{ order_status: string; delivery_statuses: string[] }>(
      `select o.status as order_status, array_agg(d.status) as delivery_statuses
         from orders o left join deliveries d on d.order_id = o.id
        where o.id = $1 group by o.status`,
      [order.id],
    );
    expect(rows[0].order_status).toBe("Cancelled");
    // Delivery còn "Pending" sau khi hủy sẽ bị đếm vào "Đang xử lý" ở thống kê của vườn.
    expect(
      rows[0].delivery_statuses.every((s) => s === "Cancelled"),
      `delivery sau hủy: ${rows[0].delivery_statuses}`,
    ).toBeTruthy();
  });

  /**
   * Nút "Hủy" trên UI hiện theo luật riêng của FE (ẩn khi Shipping/Cancelled/Completed/Expired),
   * còn BE chỉ cho hủy khi đơn Pending. Vendor xác nhận giao xong thì đơn COD sang Processing: nút vẫn
   * hiện nhưng bấm vào là lỗi. Nút đã hiện thì BE phải chấp nhận.
   */
  test("Cancel_ButtonVisibility_MatchesBackendRule", async ({ page, loginAs, apiAs }) => {
    const store = await createStore([{ name: "Phát Tài", price: 120_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    await loginAs(page, customer);
    const api = await apiAs(customer);
    const owner = await apiAs(store.owner);

    const order = await api.checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 1 }],
    });
    await owner.advanceDelivery(order.deliveries[0].id, "Confirmed");
    const afterConfirm = await api.getOrder(order.id);

    await page.goto(`/profile/orders/${order.id}`);
    await expect(page.getByText(detailText.product.total, { exact: true })).toBeVisible();
    const cancelButton = page.getByRole("button", { name: detailText.actions.cancel, exact: true });

    const backendAllowsCancel = afterConfirm.status === "Pending";
    await expect(
      cancelButton,
      `đơn đang ${afterConfirm.status}: BE ${backendAllowsCancel ? "cho" : "KHÔNG cho"} hủy nên nút Hủy phải ${backendAllowsCancel ? "hiện" : "ẩn"}`,
    ).toHaveCount(backendAllowsCancel ? 1 : 0);
  });
});
