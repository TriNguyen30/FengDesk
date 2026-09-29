import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { E2E } from "./env";

/**
 * Ghi lại endpoint BE và trang FE mà E2E thực sự chạm tới — `coverage-report.ts` (globalTeardown) đem so
 * với swagger của BE và router của FE để ra con số độ phủ. Mỗi worker ghi một file jsonl riêng: nhiều
 * worker cùng append một file trên Windows dễ xen kẽ dòng.
 */
export const COVERAGE_DIR = path.resolve(import.meta.dirname, "../.results/coverage");

const file = () => path.join(COVERAGE_DIR, `hits-${process.pid}.jsonl`);
let ready = false;

function write(entry: { kind: "api" | "page"; method?: string; path: string }) {
  if (!ready) {
    mkdirSync(COVERAGE_DIR, { recursive: true });
    ready = true;
  }
  appendFileSync(file(), JSON.stringify(entry) + "\n");
}

/** Gọi API tới BE của E2E (từ trình duyệt hoặc từ ApiClient). URL ngoài BE bị bỏ qua. */
export function recordApiCall(method: string, url: string) {
  if (!url.startsWith(E2E.apiBaseUrl)) return;
  const pathOnly = new URL(url).pathname; // bỏ query string
  write({ kind: "api", method: method.toUpperCase(), path: pathOnly });
}

/** Trang FE vừa được điều hướng tới (SPA đổi route cũng tính). */
export function recordPageVisit(url: string) {
  if (!url.startsWith(E2E.webBaseUrl)) return;
  write({ kind: "page", path: new URL(url).pathname });
}
