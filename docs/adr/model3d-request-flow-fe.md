# Model 3D — Flow tạo/hiển thị/duyệt mô hình 3D (FE, đã triển khai 31/07/2026)

> FE cho thiết kế backend ở `FengDeskAI/docs/adr/refactor-model3d-request-flow.md` (đọc trước file
> đó để hiểu rule nghiệp vụ: 1 request mở/product, Initial tự động vs Regenerate thủ công qua staff
> sàn, lỗi hết credit Meshy bị giấu khỏi owner...). File này chỉ nói phần FE: chỗ đặt UI, actor nào
> thấy gì, gọi API nào.

## 1. Tổng quan 3 mảng UI

| # | Actor | Vị trí | Mục đích |
|---|---|---|---|
| 1 | Khách (public, không cần đăng nhập) | Trang chi tiết sản phẩm `/products/:id` | Xem mô hình 3D nếu chủ shop đã bật hiển thị |
| 2 | Garden owner / garden staff (nhân viên store) | Modal sửa sản phẩm, tab "Mô hình 3D" (`/seller/:storeId` **hoặc** `/manager/products`) | Tạo yêu cầu sinh model, bật/tắt hiển thị, xem lịch sử |
| 3 | Staff sàn (`Staff`/`Manager`/`Admin`) | `/manager/model3d-queue` | Xử lý thủ công yêu cầu "tạo lại" (Regenerate): chọn ảnh, gửi Meshy, duyệt kết quả |

## 2. Actor 1 — Khách xem model 3D (public)

**File:**
- `src/components/ui/3DSection.tsx` — component `Product3DViewer` (default export) + `Model3DViewSwitcher`.
  Dùng `@react-three/fiber` (`Canvas`) + `@react-three/drei` (`useGLTF`, `OrbitControls`, `Center`).
  Tự tính bounding box (`THREE.Box3`) để scale mọi model về cùng kích thước hiển thị bất kể tỉ lệ gốc
  Meshy xuất ra. Có `Model3DErrorBoundary` (class component) bọc riêng — lỗi tải GLB hỏng/URL sai
  không làm sập cả trang sản phẩm.
- `src/features/products/hooks/useProductModel3D.ts` — React Query, gọi `GET /products/{id}/model-3d`.
  **404 = sản phẩm chưa từng có model, coi là bình thường** (`retry: false`, không toast lỗi).
  Chỉ trả `model3D` (khác `undefined`) khi `status === "Succeeded" && isEnabled && modelUrl` — mọi
  trạng thái khác (`Pending`/`Processing`/`Failed`/tắt hiển thị) đều bị ẩn khỏi khách.
- Tích hợp: `src/features/products/pages/ProductDetailPage.tsx` — bộ chuyển **"Hình ảnh / Mô hình 3D"**
  nằm bên ngoài, phía trên khung media. Nút không nằm trong vùng click-to-lightbox nên không còn
  xung đột event. Chuyển chế độ sẽ thay hẳn nội dung khung ảnh chính; khi ở chế độ 3D: tắt
  auto-swipe ảnh, tắt zoom-hover, tắt click-to-lightbox. Chọn thumbnail sẽ tự chuyển về chế độ ảnh.

**API:** `src/features/products/api/model3d.api.ts` → `model3DApi.getModel3D(productId)`.

## 3. Actor 2 — Garden owner / garden staff

`EditProductModal.tsx` (`src/features/manager/components/`) dùng chung bởi **2 nơi**:
- `/seller/:storeId` → `ShopDetailPage` → `ShopProductCatalog` (garden owner/staff xem sản phẩm của
  chính store mình).
- `/manager/products` → `ManageProductsPage` (staff sàn xem **mọi** sản phẩm — cùng modal, cùng tab).

→ Sửa 1 chỗ (thêm tab) là phủ cả 2 nơi. Quyền thật sự enforce ở **backend**
(`ResourceAuthorize(ManageProduct)` — owner/co-owner/garden-staff-accepted/admin), FE không cần gate
thêm.

**File mới:**
- `src/features/manager/components/ProductModel3DSection.tsx` — nội dung tab "Mô hình 3D":
  - **Trạng thái hiện tại**: thumbnail, badge trạng thái (`Pending`/`Processing`/`Succeeded`/`Failed`),
    progress %, nút bật/tắt hiển thị (`Eye`/`EyeOff`, chỉ actionable khi `Succeeded`).
  - **Tạo yêu cầu**: server tự quyết Initial hay Regenerate (FE mirror qua `model?.status ===
    "Succeeded"` để biết hiện picker hay không):
    - **Initial** (chưa từng có model Succeeded): mở picker — tick ảnh có sẵn (`images` prop) + upload
      ảnh mới, tối đa **4 ảnh** tổng, note nhỏ "chụp nhiều góc độ cho kết quả chính xác hơn".
    - **Regenerate** (đã có model Succeeded): không cần chọn ảnh — chỉ 1 nút "Gửi yêu cầu tạo lại",
      staff sàn tự chọn ảnh khi xử lý.
  - **Khoá tạo request mới** khi đang có 1 request "mở" (`Queued`/`Processing`/`AwaitingStaff`/
    `InProgress`) — banner hiện trạng thái request đang chờ thay vì nút tạo.
  - **Lịch sử request** — danh sách trạng thái (dùng `Model3DRequestResponse`, đã che giấu lý do lỗi
    nội bộ — owner **không bao giờ** thấy "hết credit Meshy", chỉ thấy "Đang xử lý").

**API:** `src/features/products/api/model3d.api.ts` → `requestModel3D`, `listModel3DRequests`,
`toggleModel3D` (multipart cho request, `SourceImageIds`/`NewImages` khớp
`Model3DRequestFormModel` bên BE).

**Sửa:** `EditProductModal.tsx` (thêm tab `"model-3d"`), `manager/components/index.ts` (barrel export).

## 4. Actor 3 — Staff sàn (hàng chờ Regenerate)

Route `/manager/model3d-queue` (`requireStaffOrAbove` — `Staff`/`Manager`/`Admin`), link sidebar
`ManagerLayout.tsx` (nhóm "Sản phẩm" → "Hàng chờ Model 3D").

**File mới:**
- `src/features/manager/pages/Model3DQueuePage.tsx` — danh sách, tab lọc:

  | Tab | Filter API | Ý nghĩa |
  |---|---|---|
  | Chờ xử lý (mặc định) | `status=AwaitingStaff` | Regenerate mới, chưa ai đụng vào |
  | Đang xử lý | `status=InProgress` | Đã gửi Meshy, chờ preview/accept |
  | Kẹt tự động | `status=Queued&reason=InsufficientCredits` | Request **Initial** đang kẹt vì hết credit — **chỉ để theo dõi**, không thao tác được (xem mục 4.1) |
  | Hoàn tất / Đã từ chối / Tất cả | — | Đọc lịch sử |

- `src/features/manager/components/Model3DQueueItemModal.tsx` — modal xử lý 1 item, nhánh theo
  `status`:
  1. **`AwaitingStaff`** → picker ảnh (tick ảnh sản phẩm, fetch qua `productApi.getProductById` vì
     queue item chỉ có `productId` chứ không kèm sẵn ảnh) + upload mới → nút "Bắt đầu tạo"
     (`generate`).
  2. **`InProgress`** → nút "Xem trước" (`preview` — poll trực tiếp Meshy, không lưu DB, trả URL GLB
     **tạm thời**):
     - `Running` → progress bar + nút "Kiểm tra lại" (poll tay lại, **không auto-poll interval**).
     - `Succeeded` → render model bằng `Product3DViewer` (dùng chung component với viewer công khai,
       mục 2) + 3 nút: **Chấp nhận** (`accept` — tải GLB thật, re-host Supabase Storage vĩnh viễn, ghi
       đè `ProductModel3D`), **Tạo lại** (mở lại picker → `retry`, không giới hạn số lần), **Từ chối**
       (nhập lý do → `reject`).
     - `Failed` → hiện lỗi + nút Tạo lại / Từ chối.
  3. **`Succeeded`/`Rejected`** → chỉ đọc, hiện thông tin (lý do từ chối nếu có).

**API:** `src/features/products/api/model3dQueue.api.ts` → `getQueue`, `generate`, `retry`,
`preview`, `accept`, `reject` (tất cả gọi `/api/model3d-requests/...`, base path khác hẳn
`/api/products/{id}/model-3d/...` ở mục 3).

### 4.1 Vì sao request `Initial` xuất hiện trong hàng chờ staff sàn nhưng không bấm được gì

Backend cho phép `GET /api/model3d-requests` trả cả request `Initial` đang `Queued` vì hết credit
Meshy (để staff **biết** mà đi nạp thêm credit), nhưng `generate`/`retry`/`accept`/`reject` đều
**từ chối** (400 `Model3DRequestNotActionableByStaff`) nếu `requestType !== "Regenerate"` — worker
nền (`Model3DPollingWorker`) mới là thứ xử lý Initial, tự động, không qua tay staff. FE mirror đúng
rule này: item `Initial` trong modal chỉ hiện banner thông tin (lý do kẹt + giờ thử lại), không có
nút hành động nào.

## 5. Type & API layer dùng chung

```
src/features/products/types/model3d.ts        # LƯU Ý: .ts thường, KHÔNG phải .d.ts
                                                #  (có runtime const OPEN_MODEL3D_REQUEST_STATUSES
                                                #   — từng gây lỗi Vite "Failed to resolve import"
                                                #   vì .d.ts bị coi là declaration-only, không emit JS)
src/features/products/api/model3d.api.ts       # owner/garden staff: GET/POST/PATCH /products/{id}/model-3d...
src/features/products/api/model3dQueue.api.ts  # staff sàn: /model3d-requests/...
src/features/products/hooks/useProductModel3D.ts
```

Type khớp 1–1 với DTO backend (`ProductModel3DResponse`, `Model3DRequestResponse`,
`Model3DRequestQueueItemResponse`, `Model3DPreviewResponse` — xem
`FengDeskAI.Application/Features/Catalog/DTOs/`).

## 6. Quyết định UX chưa được xác nhận rõ ràng (để ý khi test/đổi ý)

- Reject/Retry ở modal staff sàn khi `InProgress` **yêu cầu bấm "Xem trước" trước** mới hiện nút —
  không cho từ chối thẳng ngay khi chưa preview.
- Không auto-poll (cả trang hàng chờ lẫn trạng thái "Đang xử lý" trong modal) — staff phải bấm tay
  "Làm mới"/"Kiểm tra lại".
- Danh sách hàng chờ lấy tối đa 100 item/lần, chưa có phân trang thật.
- Viewer 3D không tải HDRI từ CDN ngoài. Môi trường studio được tạo nội bộ bằng
  `@react-three/drei` (`Environment` + `Lightformer`), kết hợp key/fill/rim light và bóng tiếp xúc.
- Ảnh sản phẩm được dùng làm background phóng lớn, blur và giảm bão hoà. Viewer lấy mẫu độ sáng
  của ảnh/model để tự chọn mức sáng và vùng tương phản phía sau sản phẩm; nếu storage chặn
  đọc pixel qua CORS thì tự rơi về mức trung tính.

## 7. Chưa làm / có thể mở rộng sau

- Thông báo real-time cho staff sàn khi có request `AwaitingStaff` mới (hiện phải tự vào trang xem).
- Phân trang thật cho `Model3DQueuePage`.
