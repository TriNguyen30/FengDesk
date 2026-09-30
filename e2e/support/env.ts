import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Cấu hình E2E, đọc MỘT lần cho cả playwright.config lẫn test.
 *
 * Thứ tự: biến môi trường thật (CI) → file `e2e/.env.e2e` (gitignore, mỗi máy một file).
 * `process.loadEnvFile` không ghi đè biến đã có, nên biến môi trường luôn thắng.
 */
const envFile = path.resolve(import.meta.dirname, "../.env.e2e");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const apiPort = Number(process.env.E2E_API_PORT ?? 5299);
const webPort = Number(process.env.E2E_WEB_PORT ?? 5199);

export const E2E = {
  databaseUrl: process.env.E2E_DATABASE_URL ?? "",
  apiPort,
  webPort,
  apiOrigin: `http://localhost:${apiPort}`,
  apiBaseUrl: `http://localhost:${apiPort}/api`,
  webBaseUrl: `http://localhost:${webPort}`,
  backendDir: path.resolve(
    import.meta.dirname,
    "../..",
    process.env.E2E_BACKEND_DIR ?? "../FengDeskAI",
  ),
  /** Chrome hệ thống mặc định — không phụ thuộc bản Chromium tải riêng của Playwright. */
  browserChannel: process.env.E2E_BROWSER_CHANNEL ?? "chrome",
} as const;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Chốt chặn: E2E tạo đơn, trừ kho, hoàn tiền THẬT trong DB. Chạy nhầm vào Supabase production là
 * sinh đơn rác trên hệ thống thật. Chỉ chấp nhận Postgres cục bộ VÀ tên DB có chữ "e2e" — tránh cả
 * trường hợp trỏ nhầm vào DB dev cục bộ (`sep490_fengdeskai_dev`) đang có dữ liệu làm việc.
 */
export function assertSafeDatabase(url: string = E2E.databaseUrl): URL {
  if (!url) {
    throw new Error(
      "Thiếu E2E_DATABASE_URL. Copy e2e/.env.e2e.example → e2e/.env.e2e rồi điền mật khẩu Postgres cục bộ.",
    );
  }
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(`E2E chỉ chạy trên Postgres cục bộ — host "${parsed.hostname}" bị từ chối.`);
  }
  if (!database.toLowerCase().includes("e2e")) {
    throw new Error(
      `Tên DB phải chứa "e2e" để không đè lên DB làm việc — "${database}" bị từ chối.`,
    );
  }
  return parsed;
}

/** URL Postgres → connection string Npgsql cho backend .NET. */
export function toNpgsqlConnectionString(url: string = E2E.databaseUrl): string {
  const u = assertSafeDatabase(url);
  return [
    `Host=${u.hostname}`,
    `Port=${u.port || 5432}`,
    `Database=${u.pathname.replace(/^\//, "")}`,
    `Username=${decodeURIComponent(u.username)}`,
    `Password=${decodeURIComponent(u.password)}`,
  ].join(";");
}
