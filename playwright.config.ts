import { defineConfig, devices } from "@playwright/test";
import { E2E, toNpgsqlConnectionString } from "./e2e/support/env";

/**
 * E2E: FE (Vite) + BE (.NET) chạy cục bộ trên một DB Postgres riêng cho E2E.
 * Hướng dẫn & lý do từng biến môi trường: e2e/README.md.
 */

// Chặn ngay khi nạp config — trước khi dotnet kịp migrate vào một DB không đúng.
const connectionString = toNpgsqlConnectionString();

/** Cổng "chết" — dịch vụ ngoài nào lỡ bị gọi sẽ lỗi ngay thay vì chạm tài khoản thật. */
const UNREACHABLE = "http://127.0.0.1:9";

const backendEnv: Record<string, string> = {
  ASPNETCORE_ENVIRONMENT: "Development", // cần cho /api/dev/refunds/* (hoàn tiền giả lập)
  ASPNETCORE_URLS: E2E.apiOrigin,
  ConnectionStrings__DefaultConnection: connectionString,
  Cors__AllowedOrigins__0: E2E.webBaseUrl,

  Shipping__Provider: "Mock", // phí ship rơi về ShippingFeeCalculator — deterministic
  Seeding__AutoGeoSync: "false",
  CarrierShopSync__IsActive: "false",
  // Worker nền sửa dữ liệu GIỮA lúc test đối soát → tắt; test tự đẩy trạng thái qua API.
  OrderExpiration__IsActive: "false",
  ReturnSla__IsActive: "false",
  AiOrderDraft__IsActive: "false",
  Speech__Enabled: "false",
  AiRecommendationSettings__UseMock: "true",

  PayOSSettings__BaseUrl: UNREACHABLE,
  SupabaseStorage__Url: UNREACHABLE,
};

// Release: bản Debug thường đang bị IDE/`dotnet run` của dev khoá file — build chung thư mục đó sẽ hỏng.
const backendCommand = [
  "dotnet run -c Release --project src/FengDeskAI.WebAPI --no-launch-profile -- seed",
  "dotnet run -c Release --project src/FengDeskAI.WebAPI --no-launch-profile --no-build",
].join(" && ");

export default defineConfig({
  testDir: "./e2e/specs",
  outputDir: "./e2e/.results",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/coverage-report.ts",
  // Mỗi test tự dựng cửa hàng/khách riêng nên chạy song song được; giữ ít worker vì BE là một tiến trình.
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "./e2e/.report", open: "never" }]],
  use: {
    baseURL: E2E.webBaseUrl,
    channel: E2E.browserChannel,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"], channel: E2E.browserChannel } },
  ],
  webServer: [
    {
      command: backendCommand,
      cwd: E2E.backendDir,
      url: `${E2E.apiOrigin}/swagger/index.html`,
      env: backendEnv,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: `pnpm exec vite --port ${E2E.webPort} --strictPort`,
      url: E2E.webBaseUrl,
      // Vite không ghi đè biến đã có trong process.env → FE gọi đúng BE của E2E thay vì giá trị trong .env.
      env: { VITE_API_BASE_URL: E2E.apiBaseUrl },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
