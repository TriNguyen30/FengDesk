import { createCustomer, createStore, createUser, db, Role } from "../support/db";
import { expect, test } from "../support/fixtures";

/**
 * Xoá sản phẩm (chốt 29/09/2026): người bán xoá = xoá mềm (IsDeleted), Manager xoá = xoá vĩnh viễn. Đơn cũ luôn
 * hiển thị đủ tên/biến thể/ảnh/giá nhờ BE chụp lúc đặt; còn đơn chưa đóng (đang giao / trong khoảng đổi trả / đang
 * trả hàng) thì BE chặn và hộp thoại đề xuất "Ngừng bán".
 */
test.describe("Xoá sản phẩm", () => {
  test("DeleteProduct_SellerNeverOrdered_SoftDeleted", async ({ page, loginAs }) => {
    const store = await createStore([{ name: "Sen Đá", price: 50_000, stock: 3 }]);
    const [product] = store.products;
    await loginAs(page, store.owner);

    await page.goto(`/stores/${store.storeId}`);
    await page.getByRole("button", { name: `Xóa ${product.name}` }).click();
    await page.getByTestId("delete-product-dialog").getByRole("button", { name: "Xác nhận xóa" }).click();

    await expect(page.getByText(`Đã xóa sản phẩm ${product.name}`)).toBeVisible();
    const { rows } = await db().query<{ product: boolean; item: boolean }>(
      `select p.is_deleted as product, pi.is_deleted as item
         from products p join product_items pi on pi.product_id = p.id where p.id = $1`,
      [product.productId],
    );
    expect(rows[0], "xoá mềm cả sản phẩm lẫn biến thể — không xoá hẳn").toEqual({ product: true, item: true });
  });

  test("DeleteProduct_OpenOrder_OffersDeactivateInstead", async ({ page, loginAs, apiAs }) => {
    const store = await createStore([{ name: "Kim Ngân", price: 120_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    await (await apiAs(customer)).checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 1 }],
    });
    await loginAs(page, store.owner);

    await page.goto(`/stores/${store.storeId}`);
    await page.getByRole("button", { name: `Xóa ${product.name}` }).click();
    const dialog = page.getByTestId("delete-product-dialog");
    await dialog.getByRole("button", { name: "Xác nhận xóa" }).click();

    await expect(dialog).toContainText("đơn chưa hoàn tất");
    await dialog.getByRole("button", { name: "Ngừng bán" }).click();
    await expect(page.getByText(`Đã ngừng bán ${product.name}`)).toBeVisible();
    const { rows } = await db().query<{ is_deleted: boolean; is_active: boolean }>(
      `select is_deleted, is_active from products where id = $1`,
      [product.productId],
    );
    expect(rows[0]).toEqual({ is_deleted: false, is_active: false });
  });

  test("DeleteProduct_ManagerPermanent_ClosedOrderStillShowsLine", async ({ page, loginAs, apiAs }) => {
    const store = await createStore([{ name: "Lưỡi Hổ", price: 90_000, stock: 5 }]);
    const [product] = store.products;
    const customer = await createCustomer();
    const order = await (await apiAs(customer)).checkout({
      shippingAddressId: customer.addressId,
      paymentMethod: "COD",
      items: [{ productItemId: product.productItemId, quantity: 2 }],
    });
    await (await apiAs(store.owner)).advanceDelivery(order.deliveries[0].id, "Delivered");
    // Đẩy mốc giao về quá khoảng đổi trả ⇒ đơn đã đóng, được phép xoá.
    await db().query(`update deliveries set delivered_at = now() - interval '30 days' where id = $1`, [
      order.deliveries[0].id,
    ]);

    const manager = await createUser(Role.Manager, "manager");
    await loginAs(page, manager);
    await page.goto("/manager/products");
    await page.getByPlaceholder("Tìm tên sản phẩm...").fill(product.name);
    const row = page.locator("tr", { hasText: product.name });
    await row.getByTitle("Xóa vĩnh viễn").click();
    await page.getByTestId("delete-product-dialog").getByRole("button", { name: "Xác nhận xóa" }).click();
    await expect(page.getByText(`Đã xóa vĩnh viễn ${product.name}`)).toBeVisible();

    const { rows } = await db().query(`select 1 from products where id = $1`, [product.productId]);
    expect(rows, "xoá cứng: dòng sản phẩm không còn").toHaveLength(0);

    // Khách mở lại đơn: vẫn đủ tên, số lượng, giá — chỉ báo là sản phẩm không còn bán.
    await page.context().clearCookies();
    await loginAs(page, customer);
    await page.goto(`/profile/orders/${order.id}`);
    const line = page.getByTestId("order-line");
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(product.name);
    await expect(line).toContainText("x2");
    await expect(line).toContainText("Sản phẩm không còn bán");
  });
});
