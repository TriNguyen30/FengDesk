import { readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { ApiClient } from "./api";
import { recordApiCall, recordPageVisit } from "./coverage";
import { closeDb, type SeededUser } from "./db";
import { E2E } from "./env";
import type viTranslation from "../../src/locales/vi/translation.json";

/** Nhãn tiếng Việt lấy từ CHÍNH file dịch của app — đổi câu chữ không làm gãy selector. */
const viRaw = readFileSync(
  path.resolve(import.meta.dirname, "../../src/locales/vi/translation.json"),
  "utf8",
);
// File dịch lưu kèm BOM — JSON.parse không tự bỏ.
export const vi = JSON.parse(
  viRaw.charCodeAt(0) === 0xfeff ? viRaw.slice(1) : viRaw,
) as typeof viTranslation;

/** "1.250.000 ₫" / "150.000đ" → 1250000. Tiền VND trong app không có phần lẻ. */
export function parseVnd(text: string | null): number {
  const digits = (text ?? "").replace(/[^\d]/g, "");
  if (!digits) throw new Error(`Không đọc được số tiền từ "${text}"`);
  return Number(digits);
}

export async function readVnd(locator: Locator): Promise<number> {
  return parseVnd(await locator.innerText());
}

/** Ảnh PNG 1×1 — đủ để input file nhận, không cần file thật trên đĩa. */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const FAKE_STORAGE = "https://e2e-storage.invalid";

type Fixtures = {
  /** Mở app với phiên đăng nhập của `user` (không đi qua popup đăng nhập — đó không phải thứ đang test). */
  loginAs: (page: Page, user: SeededUser) => Promise<ApiClient>;
  /** Chặn upload ảnh minh chứng: BE dev đang trỏ Supabase Storage thật, E2E không được đẩy file lên đó. */
  mockEvidenceUpload: (page: Page) => Promise<void>;
  /** Mọi ApiClient tạo trong test tự dispose ở cuối. */
  apiAs: (user: SeededUser) => Promise<ApiClient>;
};

type WorkerFixtures = {
  /** Đóng pool Postgres khi worker kết thúc. */
  dbLifecycle: void;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  // Ghi lại mọi request BE và mọi route FE mà trình duyệt đi qua — nguồn số liệu của báo cáo độ phủ.
  page: async ({ page }, provide) => {
    page.on("request", (req) => recordApiCall(req.method(), req.url()));
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) recordPageVisit(frame.url());
    });
    await provide(page);
  },

  dbLifecycle: [
    async ({}, provide) => {
      await provide();
      await closeDb();
    },
    { scope: "worker", auto: true },
  ],

  apiAs: async ({}, provide) => {
    const clients: ApiClient[] = [];
    await provide(async (user) => {
      const client = await ApiClient.login(user);
      clients.push(client);
      return client;
    });
    await Promise.all(clients.map((c) => c.dispose()));
  },

  loginAs: async ({ apiAs }, provide) => {
    await provide(async (page, user) => {
      const api = await apiAs(user);
      const { accessToken, refreshToken, user: authUser } = api.session;
      // Cùng khóa với src/utils/authStorage.ts → setSession.
      await page.addInitScript(
        ([token, refresh, u]) => {
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refresh);
          localStorage.setItem("user", JSON.stringify(u));
          if (u.role) localStorage.setItem("role", u.role);
          localStorage.setItem("app_lang", "vi");
        },
        [accessToken, refreshToken, authUser] as const,
      );
      return api;
    });
  },

  mockEvidenceUpload: async ({}, provide) => {
    await provide(async (page) => {
      await page.route(`${E2E.apiBaseUrl}/uploads`, async (route) => {
        const url = `${FAKE_STORAGE}/evidence/${crypto.randomUUID()}.png`;
        await route.fulfill({
          json: { data: url, isSuccess: true, message: "OK", errors: null, statusCode: 200 },
        });
      });
      await page.route(`${FAKE_STORAGE}/**`, (route) =>
        route.fulfill({ body: TINY_PNG, contentType: "image/png" }),
      );
    });
  },
});

export { expect };
