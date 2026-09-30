import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { COVERAGE_DIR } from "./support/coverage";
import { E2E } from "./support/env";

/**
 * globalTeardown: đối chiếu thứ E2E đã chạm (support/coverage.ts) với
 * - toàn bộ endpoint BE — đọc `swagger.json` của chính BE đang chạy, nên thêm endpoint là tự vào mẫu số;
 * - toàn bộ route FE — đọc `src/app/router.tsx`.
 * Ghi `e2e/.results/coverage/summary.md` + in bảng tóm tắt ra console.
 *
 * Đây là độ phủ BỀ MẶT (endpoint/trang có được gọi tới không), không phải độ phủ dòng code: một endpoint
 * được gọi một lần vẫn tính là "đã phủ" dù mới đi một nhánh.
 */

interface Hit {
  kind: "api" | "page";
  method?: string;
  path: string;
}

interface Endpoint {
  method: string;
  path: string;
  tag: string;
  pattern: RegExp;
}

/** Nhóm nghiệp vụ mua bán — thứ bộ E2E này nhắm tới; phần còn lại (AI, catalog, admin…) in riêng. */
const COMMERCE_TAGS = new Set([
  "Cart",
  "Orders",
  "Payments",
  "Returns",
  "Refunds",
  "VendorLiabilities",
  "Shipping",
  "Stores",
  "Addresses",
  "DevDeliveries",
  "DevRefunds",
]);

export default async function coverageReport() {
  if (!existsSync(COVERAGE_DIR)) return;
  const hits = readHits();
  const endpoints = await loadEndpoints();
  if (!endpoints) return;

  const apiHits = hits.filter((h) => h.kind === "api");
  const covered = new Set<Endpoint>();
  for (const hit of apiHits) {
    const match = endpoints.find((e) => e.method === hit.method && e.pattern.test(hit.path));
    if (match) covered.add(match);
  }

  const routes = loadFrontendRoutes();
  const visited = new Set(hits.filter((h) => h.kind === "page").map((h) => h.path));
  const coveredRoutes = routes.filter((r) => [...visited].some((v) => r.pattern.test(v)));

  const byTag = new Map<string, { total: number; covered: Endpoint[]; missing: Endpoint[] }>();
  for (const e of endpoints) {
    const row = byTag.get(e.tag) ?? { total: 0, covered: [], missing: [] };
    row.total++;
    (covered.has(e) ? row.covered : row.missing).push(e);
    byTag.set(e.tag, row);
  }

  const pct = (a: number, b: number) => (b === 0 ? "—" : `${Math.round((a / b) * 100)}%`);
  const commerce = [...byTag].filter(([tag]) => COMMERCE_TAGS.has(tag));
  const commerceTotal = commerce.reduce((s, [, r]) => s + r.total, 0);
  const commerceCovered = commerce.reduce((s, [, r]) => s + r.covered.length, 0);

  const lines: string[] = [
    "# Độ phủ E2E",
    "",
    `| Phạm vi | Đã phủ | Tổng | % |`,
    `|---|---|---|---|`,
    `| Endpoint BE — nhóm mua bán | ${commerceCovered} | ${commerceTotal} | ${pct(commerceCovered, commerceTotal)} |`,
    `| Endpoint BE — toàn hệ thống | ${covered.size} | ${endpoints.length} | ${pct(covered.size, endpoints.length)} |`,
    `| Trang FE | ${coveredRoutes.length} | ${routes.length} | ${pct(coveredRoutes.length, routes.length)} |`,
    "",
    "## Theo controller",
    "",
    "| Controller | Đã phủ | Tổng | % |",
    "|---|---|---|---|",
    ...[...byTag]
      .sort(
        ([a], [b]) =>
          Number(COMMERCE_TAGS.has(b)) - Number(COMMERCE_TAGS.has(a)) || a.localeCompare(b),
      )
      .map(
        ([tag, r]) =>
          `| ${COMMERCE_TAGS.has(tag) ? "**" + tag + "**" : tag} | ${r.covered.length} | ${r.total} | ${pct(r.covered.length, r.total)} |`,
      ),
    "",
    "## Endpoint mua bán CHƯA phủ",
    "",
    ...commerce.flatMap(([, r]) => r.missing.map((e) => `- \`${e.method} ${e.path}\``)),
    "",
    "## Trang FE",
    "",
    ...routes.map((r) => `- [${coveredRoutes.includes(r) ? "x" : " "}] \`${r.path}\``),
    "",
  ];

  const out = path.join(COVERAGE_DIR, "summary.md");
  writeFileSync(out, lines.join("\n"), "utf8");
  console.log(
    `\n${lines.slice(2, 8).join("\n")}\nChi tiết: ${path.relative(process.cwd(), out)}\n`,
  );
}

function readHits(): Hit[] {
  return readdirSync(COVERAGE_DIR)
    .filter((f) => f.startsWith("hits-") && f.endsWith(".jsonl"))
    .flatMap((f) => readFileSync(path.join(COVERAGE_DIR, f), "utf8").split("\n"))
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Hit);
}

async function loadEndpoints(): Promise<Endpoint[] | undefined> {
  try {
    const res = await fetch(`${E2E.apiOrigin}/swagger/v1/swagger.json`);
    const doc = (await res.json()) as {
      paths: Record<string, Record<string, { tags?: string[] }>>;
    };
    return Object.entries(doc.paths).flatMap(([p, ops]) =>
      Object.entries(ops).map(([method, op]) => ({
        method: method.toUpperCase(),
        path: p,
        tag: op.tags?.[0] ?? "(none)",
        pattern: templateToRegex(p),
      })),
    );
  } catch (error) {
    console.warn(`[coverage] Không đọc được swagger của BE — bỏ qua báo cáo độ phủ: ${error}`);
    return undefined;
  }
}

/** `/api/orders/{id}/cancel` → khớp `/api/orders/<bất kỳ>/cancel`, không phân biệt hoa thường. */
function templateToRegex(template: string): RegExp {
  const escaped = template
    .split(/\{[^}]+\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]+");
  return new RegExp(`^${escaped}/?$`, "i");
}

/**
 * Dựng danh sách route đầy đủ từ router.tsx bằng cách lần theo lồng nhau của thẻ <Route>. Bỏ route chỉ
 * để chuyển hướng (<Navigate>), route layout (có route con) và "*" — chúng không phải trang có nội dung riêng.
 */
function loadFrontendRoutes(): Array<{ path: string; pattern: RegExp }> {
  const source = readFileSync(path.resolve(import.meta.dirname, "../src/app/router.tsx"), "utf8");
  const stack: string[] = [];
  // route → có route con không. Route có con là layout (ProfileLayout, ManagerLayout…) — không tính là trang.
  const found = new Map<string, boolean>();

  for (const tag of scanRouteTags(source)) {
    if (tag.closing) {
      stack.pop();
      continue;
    }
    const { attrs, selfClosing } = tag;
    const own = /\bpath="([^"]*)"/.exec(attrs)?.[1];
    const parent = stack.at(-1) ?? "";
    if (found.has(parent)) found.set(parent, true);
    const full = own === undefined ? parent : joinRoute(parent, own);
    const isRedirect = /element=\{\s*<Navigate/.test(attrs);
    if (own !== undefined && own !== "*" && !isRedirect) found.set(full, found.get(full) ?? false);
    if (!selfClosing) stack.push(full);
  }
  const routes = [...found].filter(([, hasChildren]) => !hasChildren).map(([p]) => p);

  return routes.sort().map((p) => ({
    path: p,
    pattern: new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}/?$`),
  }));
}

/**
 * Tách thẻ `<Route …>` / `<Route … />` / `</Route>`. Không dùng regex tới dấu `>` đầu tiên: thuộc tính
 * `element={<ProtectedRoute>…</ProtectedRoute>}` chứa `>` bên trong — phải đếm độ sâu `{}` mới biết thẻ
 * thật sự đóng ở đâu.
 */
function* scanRouteTags(source: string) {
  const opener = /<Route\b|<\/Route>/g;
  for (let m = opener.exec(source); m; m = opener.exec(source)) {
    if (m[0] === "</Route>") {
      yield { closing: true as const };
      continue;
    }
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) break;
    }
    const selfClosing = source[i - 1] === "/";
    yield { closing: false as const, attrs: source.slice(m.index + m[0].length, i), selfClosing };
    opener.lastIndex = i + 1;
  }
}

function joinRoute(parent: string, child: string) {
  if (child.startsWith("/")) return child;
  return `${parent.replace(/\/$/, "")}/${child}`;
}
