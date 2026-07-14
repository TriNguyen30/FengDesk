# TASK (for Claude Code) — ElementVector Fit UI (FE)

> Dựng component hiển thị **vector ngũ hành của không gian** (phòng đang thiếu/thừa hành gì),
> tách từ thiết kế "Độ phù hợp phong thủy với không gian của bạn" (TURN 5), đặt ở **trang Workspace** (panel full + mini trên từng workspace card).
> Phụ thuộc backend: endpoint `GET /api/workspace/{id}/element-analysis` (xem task backend BE `docs/ard/task-workspace-element-analysis.md`).

> **Phạm vi task này = Phase 1** (vị trí #1 Trang Workspace: panel full + #2 mini vector trên từng workspace card).
> Component `ElementVectorFit` bên dưới chính là bản lắp cho Phase 1. Bức tranh đầy đủ 6 vị trí xem mục 0.

> ⚠️ **Lưu ý tên gọi:** `src/components/ui/WorkspaceSwitcher.tsx` là switcher **"Đổi khu"** (shop/seller/admin theo quyền) — **KHÔNG** phải bộ chọn workspace-profile phong thủy. Đừng gắn vector vào đó. App hiện **chưa có** bộ chọn "workspace profile đang active"; đó là việc của **Phase 2** (tiền đề cho vị trí #3). Ở Phase 1 chỉ đặt trong trang ProfileWorkspace.

> 🎨 **Tham chiếu thiết kế (nguồn visual chuẩn):** [`ElementVector-Fit-UI.html`](./ElementVector-Fit-UI.html) — mở bằng trình duyệt để xem đúng layout/màu/spacing của TURN 5 (mục "Độ phù hợp phong thủy với không gian của bạn"). Bám file này khi dựng markup; bảng màu ở mục 4 trích từ đây. 
> Lưu ý: file này chỉ là bản dựng sẵn dùng để tham khảo layout và cho người dùng thấy cái nhìn trực quan, ta sẽ cần thay đổi cho phù phù hợp trong quá trình thực hiện

## 0. Phân rã TURN 5 theo 6 vị trí (bức tranh tổng)

Mục "Độ phù hợp phong thủy với không gian của bạn" (TURN 5) là **một cụm gộp**. Phần trên (ảnh/giá/nút mua) chỉ là product item xem trước, **không thuộc component**. Tách cụm thành các **atom tái dùng**, đặt ở `src/features/recommendation/components/element-vector/`:

| Atom | Vai trò |
|------|---------|
| `ScoreBadge` | Vòng `%` + tier (chỉ dùng khi là *fit sản phẩm × phòng*) |
| `ElementBars` | Dãy thanh 5 hành — prop `mode: "space" \| "fit" \| "aggregate"` (còn dùng ở compact/mini và ở fit sản phẩm, vị trí #1 full đã thay bằng `ElementTags` + `ElementRadarChart`) |
| `ElementRadarChart` | Radar 5 trục ngũ hành — nét đứt không fill = `adjustedIdeal` (mức lý tưởng), nét liền fill 25% + dot màu hành = `current` (hiện tại). Domain mặc định 50%, tự giãn theo giá trị lớn nhất nếu có hành vượt 50% (xem `ElementRadarChart.tsx`) |
| `ElementTags` | Dải chip 5 hành thay cho bars ở vị trí #1: dot màu + tên hành + trạng thái `↑ cần bù` / `↓ thừa` / `ổn` suy từ `gapStatus(gap)` |
| `SpaceInsightList` | Danh sách gợi ý (icon + tiêu đề + mô tả) suy **thuần từ dữ liệu `element-analysis`** (không có bản mệnh/hướng đặt — data đó chỉ có ở fit sản phẩm × phòng) — dùng `InfoRow` chung với `InfoCardTrio` |
| `InfoRow` | Icon tròn + tiêu đề + mô tả — 1 dòng dùng chung cho `InfoCardTrio` (fit sản phẩm) và `SpaceInsightList` (không gian thuần) |
| `InfoCardTrio` | 3 thẻ: Không gian · Hợp bản mệnh · Hướng đặt — **chỉ dùng ở fit sản phẩm × phòng** (vị trí #3), có `menhLine`/`placementHint` từ `ProductFitResponse` mà `element-analysis` không có |
| `SpaceTabs` | Dải tab chọn phòng (mỗi tab có `%`) + "＋ Thêm không gian" |
| `EmptyState` | "Bạn chưa có không gian nào" |
| `SummaryLine` | Câu kết "hành X trội — hợp phòng đang thiếu X" (dùng ở fit sản phẩm, vị trí #3) |
| `FitBadge` | Chip `%` siêu gọn |

**Cắt phần nào → dùng ở đâu:**

| # Vị trí | Lắp atom | Cắt bỏ | Data | `ElementBars.mode` |
|---|---|---|---|---|
| 1 ⭐ Trang Workspace | `ElementTags` + `SpaceInsightList` + `ElementRadarChart` (grid 2 cột: trái = tags+list, phải = radar) | ScoreBadge, InfoCardTrio, SpaceTabs, `ElementBars` (bars ngang đã bỏ — tốn diện tích) | `element-analysis` | — |
| 2 Workspace card (list ProfileWorkspace) | `ElementBars` mini **hoặc** `SummaryLine` gọn | phần còn lại | `element-analysis` | `space` (mini) |
| 2b (Phase 2) Bộ chọn "phòng đang active" | `SummaryLine` compact + `FitBadge` | — | element-analysis | space (mini) |
| 3 Chi tiết sản phẩm | **TOÀN BỘ**: ScoreBadge + ElementBars + InfoCardTrio + SpaceTabs + EmptyState + SummaryLine | — | fit sản phẩm × phòng | `fit` |
| 4 Kết quả gợi ý (card) | `ScoreBadge` + `SummaryLine` + hướng đặt | Radar, SpaceTabs | `RecommendationResponse.items` | `fit` |
| 5 Card listing/search | `FitBadge` (chỉ `%`) | phần còn lại | fit rút gọn | — |
| 6 Giỏ hàng | `ElementBars` + `SummaryLine` | ScoreBadge per-item, tabs | tổng vector giỏ vs phòng | `aggregate` |

**Nguyên tắc:** build atom dùng chung một lần, mỗi vị trí **compose** đúng mảnh cần — không copy cả cụm. `ElementBars` là lõi tái dùng nhờ prop `mode`.

**Thứ tự triển khai (theo data sẵn có):**
- **Phase 1 (task này):** #1 + #2 — dùng endpoint `element-analysis` (đã có task BE).
- **Phase 2:** #3 + #4 — cần endpoint *fit sản phẩm × phòng* (chưa có) / `RecommendationResponse`.
- **Phase 3:** #5 + #6 — `FitBadge` + tổng hợp giỏ.

## Convention repo (bắt buộc theo)

- Feature-based: `src/features/users/{api,hooks,components,pages,types}`.
- API: hàm trong `*.api.ts` gọi `fetchHttpClient` (`@/lib/httpClient`), trả `response.data.data` kiểu `ApiResponse<T>`.
- Data fetching: React Query (`useQuery`) trong `hooks/`.
- Style: Tailwind (class inline). Alias `@/` = `src`.
- Định danh code tiếng Anh; text hiển thị tiếng Việt.

## 1. Types — `src/features/users/types/workspace.d.ts` (thêm)

```ts
export interface ElementAnalysisRow {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  ideal: number;
  adjustedIdeal: number;
  current: number;
  gap: number; // + = thiếu (cần bù), − = thừa
}

export interface WorkspaceElementAnalysis {
  workspaceProfileId: string;
  dominantNeed: string; // hành gap dương lớn nhất
  elements: ElementAnalysisRow[];
}
```

## 2. API — `src/features/users/api/workspace.api.ts` (thêm)

```ts
import type { WorkspaceElementAnalysis } from "../types/workspace";

export const getWorkspaceElementAnalysis = async (
  id: string,
): Promise<WorkspaceElementAnalysis> => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceElementAnalysis>>(
    `/workspace/${id}/element-analysis`,
  );
  return response.data.data;
};
```

## 3. Hook — `src/features/users/hooks/useWorkspace.ts` (thêm)

```ts
import { getWorkspaceElementAnalysis } from "../api/workspace.api";

export function useWorkspaceElementAnalysis(id?: string) {
  const query = useQuery({
    queryKey: ["workspace", id, "element-analysis"],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getWorkspaceElementAnalysis(id);
    },
    enabled: !!id,
  });
  return { analysis: query.data ?? null, status: query.status, query };
}
```

## 4. Component chính — `src/features/recommendation/components/element-vector/ElementVectorFit.tsx` (mới)

> Đặt ở feature `recommendation` (nơi chứa các atom dùng chung, xem mục 0), trang Workspace **import** vào.
> Phase 1 có thể gộp bars + summary trong `ElementVectorFit`; khi làm Phase 2/3 thì tách dần thành các atom riêng.

Component **trình bày thuần** (nhận data qua props, không tự fetch) để tái dùng.

```ts
interface ElementVectorFitProps {
  analysis: WorkspaceElementAnalysis;
  variant?: "full" | "compact"; // full: trang Workspace · compact: dropdown switcher
}
```

**Yêu cầu hiển thị (bản `full`) — cập nhật sau refactor bỏ 5 thanh bar ngang:**
- Tiêu đề: "Ngũ hành không gian của bạn".
- Layout **grid 2 cột** (`grid-cols-1 lg:grid-cols-2`, stack dọc trên mobile):
  - **Cột trái** — `ElementTags` (dải chip 5 hành, thứ tự Kim, Moc, Thuy, Hoa, Tho): dot màu hành + tên hành + trạng thái suy từ `gapStatus(gap)`:
    - `gap > 0.05` (deficit) → "↑ cần bù", nền tan `#f6ead8`.
    - `gap < −0.05` (surplus) → "↓ thừa", nền tan `#f6ead8` (cùng tông với deficit — cả hai đều là "cần chú ý", khác với "ổn").
    - còn lại (balanced) → "ổn", nền trắng viền `#e5e7eb`.
    Bên dưới là `SpaceInsightList` (3 dòng icon+tiêu đề+mô tả, suy **thuần từ dữ liệu sẵn có** — không bịa bản mệnh/hướng đặt):
    1. "Hợp với không gian này" — liệt kê các hành đang thiếu (deficit).
    2. "Đang dư trong phòng" — chỉ hiện khi có hành surplus.
    3. "Ưu tiên bổ sung" — hành `dominantNeed`.
  - **Cột phải** — `ElementRadarChart`: 5 trục theo `ELEMENT_ORDER`; nét đứt không fill (`adjustedIdeal`) = mức lý tưởng của phòng; nét liền fill 25% + dot màu hành (`current`) = trạng thái hiện tại. Domain trục bán kính mặc định `[0, 0.5]`, tự giãn lên `max(0.5, giá trị lớn nhất trong dữ liệu)` nếu có hành vượt 50% (vd hành nào current/ideal = 72% → domain giãn tới 0.72). **Lưu ý recharts**: phải set `type="number"` và `allowDecimals` trên `PolarRadiusAxis`, mặc định `allowDecimals: false` sẽ "nice" domain phân số lên `[0,1]` và làm sai lệch scale vẽ.

**Bản `compact`:** không đổi — 1 dòng mini bars 5 hành (`ElementBars size="mini"`) + text "Thiếu {dominantNeed}". Không tiêu đề.

**Map & màu (lấy từ thiết kế TURN 5):**

```ts
const ELEMENT_VI = { Kim: "Kim", Moc: "Mộc", Thuy: "Thủy", Hoa: "Hỏa", Tho: "Thổ" };
const ELEMENT_COLOR = {
  Moc:  "#7d8f69", // sage (brand)
  Thuy: "#3b82f6", // blue
  Hoa:  "#ef4444", // red
  Tho:  "#c4a86a", // earth gold
  Kim:  "#9ca3af", // metal gray
};
// nền/viền/chữ phụ: bg #fafbf9, border #e5e7eb, text #111827, muted #6b7280, thừa #fdecea
```

Chuẩn hóa bề rộng thanh: `width = value * 100%` (value đã ∈ [0,1]). `current` dùng `current`, nền dùng `adjustedIdeal`.

## 5. Đặt vào UI

**a) Trang Workspace** — `src/features/users/pages/ProfileWorkspace.tsx`:
Khi có workspace đang chọn/mặc định, render:
```tsx
const { analysis } = useWorkspaceElementAnalysis(selectedWorkspaceId);
{analysis && <ElementVectorFit analysis={analysis} variant="full" />}
```
Đặt trong panel chi tiết workspace (cạnh thông tin phòng), có skeleton khi `status === "pending"`.

**b) Mini vector trên workspace card** — trong danh sách ở `src/features/users/pages/ProfileWorkspace.tsx`:
Mỗi card workspace (khi user có nhiều phòng) render `<ElementVectorFit analysis={...} variant="compact" />` để so nhanh giữa các phòng. Chỉ hiện khi có `analysis`.

> ❌ KHÔNG dùng `src/components/ui/WorkspaceSwitcher.tsx` (đó là switcher đổi khu shop/seller/admin, không liên quan). Bộ chọn "phòng đang active" (2b) để Phase 2.

## 6. Acceptance
- Không có workspace đang chọn → không render (không lỗi).
- `status pending` → skeleton; `error` → ẩn gọn (không chặn trang).
- Giá trị hiển thị (tag/tooltip) làm tròn hợp lý; radar không tràn khung ở mọi kích thước viewport (đã test mobile/desktop qua `preview_resize`).
- `pnpm type-check` + `pnpm lint` sạch.

## 7. Ngoài phạm vi
- Component **fit sản phẩm × phòng** (per-product, ở trang chi tiết sản phẩm) — task riêng, cần endpoint fit sản phẩm.
- Trang kết quả gợi ý `/recommendations`.
- Form nhập màu/vật liệu phòng (cần API workspace lộ `workspace_profile_inputs` trước).

## Phụ thuộc
⚠️ Làm **sau** khi endpoint backend `GET /api/workspace/{id}/element-analysis` đã có (response shape ở mục 1). Nếu chưa có, mock tạm bằng data mẫu để dựng UI, nhưng đừng merge khi API thật chưa sẵn.
```
