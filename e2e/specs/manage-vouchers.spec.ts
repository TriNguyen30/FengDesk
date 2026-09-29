import { randomBytes } from "node:crypto";
import { createUser, db, Role } from "../support/db";
import { E2E } from "../support/env";
import { expect, test } from "../support/fixtures";

/** Trang quản trị mã giảm giá (/manager/vouchers) — Manager tạo, bật/tắt; Staff không có quyền. */
test.describe("Quản trị mã giảm giá", () => {
  test("ManageVouchers_ManagerCreatesAndDisablesCode_PersistedAndHiddenFromCustomers", async ({
    page,
    loginAs,
    request,
  }) => {
    const manager = await createUser(Role.Manager, "manager");
    await loginAs(page, manager);
    const code = `E2E${randomBytes(3).toString("hex").toUpperCase()}`;

    await page.goto("/manager/vouchers");
    await page.getByRole("button", { name: "Tạo mã" }).first().click();
    const dialog = page.locator("form", { hasText: "Tiền hàng tối thiểu" });
    await dialog.getByPlaceholder("VD: FREESHIP300").fill(code.toLowerCase());
    await dialog
      .locator("label", { hasText: "Tên hiển thị" })
      .locator("input")
      .fill("Freeship 300k E2E");
    await dialog
      .locator("label", { hasText: "Tiền hàng tối thiểu" })
      .locator("input")
      .fill("300000");
    await dialog.locator("label", { hasText: "Tổng lượt dùng" }).locator("input").fill("50");
    await dialog.getByRole("button", { name: "Tạo mã" }).click();
    await expect(page.getByText(`Đã tạo mã ${code}`)).toBeVisible();

    const row = page.locator("tr", { hasText: code });
    await expect(row).toContainText("Đang áp dụng");
    await expect(row).toContainText("0 / 50");
    const { rows } = await db().query(
      `select min_order_subtotal, usage_limit, is_active, funded_by from vouchers where code = $1`,
      [code],
    );
    expect(rows[0]).toEqual({
      min_order_subtotal: 300000,
      usage_limit: 50,
      is_active: true,
      funded_by: "Platform",
    });

    await row.getByRole("button", { name: "Tắt" }).click();
    await expect(row).toContainText("Đã tắt");
    const { rows: after } = await db().query(`select is_active from vouchers where code = $1`, [
      code,
    ]);
    expect(after[0].is_active).toBe(false);
    // Mã tắt thì không còn trong danh sách khách thấy.
    const available = await request.get(`${E2E.apiBaseUrl}/vouchers/available`);
    const codes = ((await available.json()) as { data: Array<{ code: string }> }).data.map(
      (v) => v.code,
    );
    expect(codes).not.toContain(code);
  });

  test("ManageVouchers_Staff_SeesPermissionMessage", async ({ page, loginAs }) => {
    const staff = await createUser(Role.Staff, "staff");
    await loginAs(page, staff);

    await page.goto("/manager/vouchers");
    await expect(
      page.getByText("Chỉ Quản lý hoặc Quản trị viên được quản lý mã giảm giá."),
    ).toBeVisible();
  });
});
