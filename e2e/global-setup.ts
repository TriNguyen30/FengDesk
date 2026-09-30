import { rmSync } from "node:fs";
import { request } from "@playwright/test";
import { COVERAGE_DIR } from "./support/coverage";
import { closeDb, createUser, db, ensureShippableWard, Role } from "./support/db";
import { assertSafeDatabase, E2E } from "./support/env";

/**
 * Chạy SAU khi webServer đã lên (BE đã migrate + seed dữ liệu tham chiếu).
 *
 * Việc quan trọng nhất ở đây: xác nhận BE đang nghe ở cổng E2E thật sự dùng CÙNG DB với test. Với
 * `reuseExistingServer`, một BE khác (vd đang debug trong IDE, trỏ DB dev) chiếm sẵn cổng sẽ được
 * dùng lại — test seed vào DB E2E nhưng gọi API vào DB khác, mọi ca đỏ với lỗi rất khó hiểu.
 * Cách kiểm: tạo user thẳng trong DB E2E rồi đăng nhập qua API.
 */
export default async function globalSetup() {
  assertSafeDatabase();
  // Số liệu độ phủ chỉ phản ánh lần chạy này.
  rmSync(COVERAGE_DIR, { recursive: true, force: true });

  const { rows } = await db().query<{ n: number }>(`select count(*)::int as n from wards`);
  if (rows[0].n === 0)
    throw new Error("DB E2E chưa có dữ liệu địa lý — lệnh seed của BE chưa chạy thành công.");
  await ensureShippableWard();

  const probe = await createUser(Role.Customer, "probe");
  const api = await request.newContext({ baseURL: `${E2E.apiBaseUrl}/` });
  const res = await api.post("Auth/login", {
    data: { email: probe.email, password: probe.password },
  });
  await api.dispose();
  await closeDb();

  if (!res.ok()) {
    throw new Error(
      `BE ở ${E2E.apiOrigin} không đăng nhập được user vừa tạo trong DB E2E (${res.status()}). ` +
        `Nhiều khả năng một BE khác đang chiếm cổng ${E2E.apiPort} với DB khác — tắt nó rồi chạy lại.`,
    );
  }
}
