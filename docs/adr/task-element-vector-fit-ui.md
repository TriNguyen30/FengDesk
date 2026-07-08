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
| `ElementBars` | Dãy thanh 5 hành — prop `mode: "space" \| "fit" \| "aggregate"` |
| `ElementRadar` | Radar ngũ hành (thu/mở) |
| `InfoCardTrio` | 3 thẻ: Không gian · Hợp bản mệnh · Hướng đặt |
| `SpaceTabs` | Dải tab chọn phòng (mỗi tab có `%`) + "＋ Thêm không gian" |
| `EmptyState` | "Bạn chưa có không gian nào" |
| `SummaryLine` | Câu kết "hành X trội — hợp phòng đang thiếu X" |
| `FitBadge` | Chip `%` siêu gọn |

**Cắt phần nào → dùng ở đâu:**

| # Vị trí | Lắp atom | Cắt bỏ | Data | `ElementBars.mode` |
|---|---|---|---|---|
| 1 ⭐ Trang Workspace | `ElementBars` + `ElementRadar`(tùy) + `SummaryLine` | ScoreBadge, InfoCardTrio, SpaceTabs | `element-analysis` | `space` |
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

**Yêu cầu hiển thị (bản `full`):**
- Tiêu đề: "Ngũ hành không gian của bạn".
- Với mỗi hành (thứ tự Kim, Moc, Thuy, Hoa, Tho): tên hành (VI) + **thanh đôi** `ideal` (mờ, nền) và `current` (đậm, màu hành) để so sánh; nhãn `gap`:
  - `gap > 0.05` → chip "Thiếu" (màu hành, nhấn).
  - `gap < −0.05` → chip "Thừa" (đỏ nhạt).
  - còn lại → "Cân bằng" (xám).
- Dòng kết luận: "Phòng đang cần bổ sung **{dominantNeed VI}**".

**Bản `compact`:** 1 dòng — mini bars 5 hành + text "Thiếu {dominantNeed}". Không tiêu đề.

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
- Tổng bars không tràn, số làm tròn 2 chữ số khi hiện tooltip.
- `pnpm type-check` + `pnpm lint` sạch.

## 7. Ngoài phạm vi
- Component **fit sản phẩm × phòng** (per-product, ở trang chi tiết sản phẩm) — task riêng, cần endpoint fit sản phẩm.
- Trang kết quả gợi ý `/recommendations`.
- Form nhập màu/vật liệu phòng (cần API workspace lộ `workspace_profile_inputs` trước).

## Phụ thuộc
⚠️ Làm **sau** khi endpoint backend `GET /api/workspace/{id}/element-analysis` đã có (response shape ở mục 1). Nếu chưa có, mock tạm bằng data mẫu để dựng UI, nhưng đừng merge khi API thật chưa sẵn.
```
