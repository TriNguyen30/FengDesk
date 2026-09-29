# E2E (Playwright)

Chạy **FE thật (Vite) + BE thật (.NET)** trên một **Postgres cục bộ riêng cho E2E**, lái trình duyệt qua
các luồng tiền: đặt hàng, hủy đơn, hoàn hàng/hoàn tiền, và **đối soát thống kê vendor** giữa ba tầng
DB ⇄ API ⇄ UI.

Khác bộ `FengDeskAI.ApiTests` (xUnit, in-process, kiểm BE): bộ này kiểm **FE và BE có nói cùng một con
số không** — thứ API test không nhìn thấy được.

## Cấu hình một lần

1. Tạo DB rỗng (tên **bắt buộc chứa `e2e`**):
   ```bash
   createdb -h localhost -U postgres fengdeskai_e2e
   ```
2. `cp e2e/.env.e2e.example e2e/.env.e2e` rồi sửa mật khẩu Postgres. File đã gitignore.
3. Repo BE phải nằm cạnh repo FE (`../FengDeskAI`) — hoặc đặt `E2E_BACKEND_DIR`.
4. Trình duyệt: mặc định dùng **Chrome đã cài trên máy** (`channel: chrome`). Muốn dùng Chromium riêng
   của Playwright: `pnpm exec playwright install chromium` rồi đặt `E2E_BROWSER_CHANNEL=` (trống).

## Chạy

```bash
pnpm test:e2e               # toàn bộ
pnpm test:e2e checkout      # lọc theo tên file
pnpm test:e2e:ui            # chế độ UI, xem từng bước
pnpm test:e2e:report        # mở báo cáo HTML lần chạy trước (trace/video của ca đỏ)
```

Playwright tự bật hai server (`webServer` trong `playwright.config.ts`):

| Server | Cổng   | Ghi chú                                                                                             |
| ------ | ------ | --------------------------------------------------------------------------------------------------- |
| BE     | `5299` | `dotnet run -c Release -- seed` (migrate + seed tham chiếu) rồi chạy API, `ASPNETCORE_ENVIRONMENT=Development`. Release để không đụng bản Debug đang bị IDE khoá |
| FE     | `5199` | Vite với `VITE_API_BASE_URL` trỏ BE của E2E (ghi đè `.env`)                                         |

Lần đầu mất 1–2 phút để build BE. Đang có server chạy sẵn ở hai cổng đó thì Playwright **dùng lại** —
`global-setup.ts` sẽ kiểm tra BE đó có dùng đúng DB E2E không và dừng kèm hướng dẫn nếu không.

## Chốt chặn an toàn

- `e2e/support/env.ts` từ chối mọi DB không phải `localhost` **hoặc** tên không chứa `e2e` — tránh cả
  Supabase production lẫn DB dev cục bộ đang có dữ liệu làm việc.
- BE chạy với `Shipping__Provider=Mock`, `PayOSSettings__BaseUrl` và `SupabaseStorage__Url` trỏ vào cổng
  chết: lỡ có luồng gọi ra PayOS/Storage thì lỗi ngay chứ không chạm tài khoản thật.
- Upload ảnh minh chứng bị chặn ngay trên trình duyệt (`mockEvidenceUpload`) — không đẩy file lên Storage.
- Worker nền sửa dữ liệu (`OrderExpiration`, `ReturnSla`, …) bị tắt để số liệu đứng yên khi đối soát.

## Cách dựng dữ liệu

Mỗi test tự tạo **cửa hàng + sản phẩm + khách mới** (`e2e/support/db.ts`, ghi thẳng Postgres, mật khẩu
sinh ngẫu nhiên) nên các test độc lập và chạy song song được, không cần dọn DB.

- **Dữ liệu nền** (user, cửa hàng, địa chỉ) → ghi thẳng DB: dựng qua API thì mỗi test bán hàng thành
  test đăng ký OTP + tạo cửa hàng.
- **Luồng đang kiểm** → luôn đi qua UI hoặc API thật: giỏ → đặt → vendor đẩy trạng thái giao → RMA.
- Hoàn tiền "thành công" dùng `POST /api/dev/refunds/{id}/success` (chỉ có ở Development).

## Đối soát — nguồn sự thật

`e2e/support/reconcile.ts` tính lại số liệu **từ bảng gốc theo định nghĩa trong tài liệu**
(`FengDeskAI/docs/api-documents/15-stores.md`, `09-orders.md`, `11-returns.md`), cố ý **không** chép
logic C#. Nếu chép, BE sai thì oracle cũng sai theo và test vẫn xanh.

`vendor-statistics.spec.ts` có thêm oracle thứ hai: con số **tính tay** từ bảng dữ liệu ở đầu file.

## Độ phủ

Cuối mỗi lần chạy, `coverage-report.ts` so các endpoint/trang mà test đã chạm (ghi bởi `support/coverage.ts`)
với `swagger.json` của BE và `src/app/router.tsx`, rồi in bảng tóm tắt và ghi chi tiết (kèm danh sách
endpoint mua bán **chưa** phủ) vào `e2e/.results/coverage/summary.md`. Đây là độ phủ bề mặt — endpoint được
gọi ít nhất một lần — không phải độ phủ dòng code.

## Đang phủ

| Spec                        | Nội dung                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkout.spec.ts`          | Đặt COD qua UI: tổng trên trang thanh toán = tổng BE ghi nợ = DB; bất biến tiền đơn/delivery (gồm khoản giảm voucher ≤ phí ship và ≤ phí sàn); trừ kho; xoá khỏi giỏ; trang chi tiết đơn hiển thị đúng. Đơn ≥ 500k: FREESHIP500 tự áp, UI = BE. Nhập mã khi chưa đủ ngưỡng: thấy lý do, không đặt được, bỏ mã thì đặt bình thường. Đặt vượt tồn kho bị từ chối, không tác dụng phụ               |
| `cancel.spec.ts`            | Hủy đơn Pending qua UI: hoàn kho, delivery hủy theo. Nút "Hủy" chỉ hiện khi BE cho hủy                                                                                                                                                                                                                                                                                                           |
| `return-refund.spec.ts`     | Khách gửi yêu cầu trả hàng qua modal UI (trả 1 trong 2 món) → staff duyệt → hoàn tiền xong: tiền hoàn đúng phần bị trả, công nợ vendor, không hoàn kho với PlantHealth, thống kê cập nhật. Quá 7 ngày / trả vượt số lượng bị từ chối                                                                                                                                                             |
| `vendor-statistics.spec.ts` | 6 đơn phủ mọi nhánh (giao xong, hoàn tiền, COD đang giao, PayOS chưa trả, hủy). API = DB, API = số tính tay, biểu đồ 4 mốc cộng lại khớp số tổng, bundle = `?range=`, thẻ số liệu & bảng trạng thái trên UI = API. Phí sàn & sổ cái: `ledgerBalance`/`platformCommission` = tính lại từ bảng nghiệp vụ = tính tay; bảo toàn tiền từng đơn qua sổ cái; thẻ doanh thu hiện "thực nhận sau phí sàn" |
| `seller-pricing.spec.ts`    | Ô giá chia đôi: nhập giá niêm yết ⇒ đơn giá + phí sàn khớp từng đồng với tỉ lệ BE công bố; nhập đơn giá ⇒ giá niêm yết nhỏ nhất đủ số đó; ô tiền có dấu phẩy, bỏ số 0 thừa và chữ |
| `confirm-received.spec.ts`  | Khách bấm "Đã nhận hàng" (endpoint thật, không còn gọi endpoint dev): đơn Completed, sổ cái bảo toàn tiền; hàng chưa giao bị từ chối                                                                                                                                                                                                                                                             |
| `manage-vouchers.spec.ts`   | Manager tạo mã qua UI → lưu đúng DB, bật/tắt; mã tắt không còn ở `/vouchers/available`; Staff thấy thông báo không có quyền                                                                                                                                                                                                                                                                      |
| `delete-product.spec.ts`    | Người bán xoá = xoá mềm sản phẩm + biến thể; còn đơn chưa đóng ⇒ 409, hộp thoại đề xuất Ngừng bán; Manager xoá vĩnh viễn ở /manager/products rồi khách mở lại đơn cũ vẫn đủ tên/số lượng, có nhãn "Sản phẩm không còn bán" |

## Chưa phủ

- PayOS đã thanh toán (cần giả lập webhook có chữ ký) → lớp `Paid`/`inProgress` của thống kê chưa có dữ liệu.
- Đổi hàng (Exchange), luồng gửi trả hàng (`ship-back` / `confirm-received`).
- Dashboard admin (cộng thống kê từng cửa hàng ở client).
