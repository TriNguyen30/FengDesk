# ADR — Thanh cuộn tự ẩn, mờ dần

**Trạng thái:** đã áp dụng
**Ngày:** 2026-09-24 (chỉnh thông số + mở rộng phạm vi 25/09)

## 1. Bối cảnh

Thanh cuộn của app luôn hiện: `index.css` đặt `*::-webkit-scrollbar-thumb { background-color: var(--color-primary) }`
nên mọi khung cuộn đều có một vạch xanh đứng im cạnh nội dung, kể cả khi người dùng không cuộn.
Yêu cầu: đứng yên thì ẩn, cuộn thì hiện, và **chuyển tiếp phải mờ dần** chứ không nhảy.

Trước đó `StatsPendingItems` đã tự làm riêng một bản: đổi qua lại `[scrollbar-width:thin]` ↔
`[scrollbar-width:none]` theo state. Cách này có hai lỗi — không mờ dần được, và mỗi lần đổi là
nội dung co giãn 10px vì gutter biến mất theo.

## 2. Đo trước, quyết sau

Câu hỏi chặn mọi phương án: **scrollbar native có animate được không?** Đã đo trực tiếp trên Chrome
(đọc `getComputedStyle(el, '::-webkit-scrollbar-thumb')` tại nhiều mốc thời gian trong lúc chuyển):

| Cách | Kết quả |
|---|---|
| `transition` đặt trên `::-webkit-scrollbar-thumb` | **bị bỏ qua** — giá trị nhảy tức thì, không có bước trung gian |
| `transition` trên biến `@property` mà pseudo-element đọc qua `var()` | **đóng băng** pseudo-element: đổi class cũng không repaint |
| `@keyframes`, cả trên biến lẫn trên pseudo-element | y hệt, không chạy |
| đổi biến **không** kèm animation | repaint ngay ✅ |

⇒ Native **chỉ làm được ẩn/hiện tức thì**. Muốn mờ dần thì buộc phải có một phần tử thật để animate
`opacity`. Ghi lại bảng này vì cả ba cách hỏng đều trông rất hợp lý trên giấy — không đo thì sẽ có
người làm lại đúng vòng đó.

## 3. Quyết định — hai cơ chế

### (1) `scroll-fade` — overlay thumb, có fade thật

`src/utils/scrollFade.ts` ẩn hẳn thanh cuộn native rồi gắn thêm một `<div>` `position: absolute`
vào **chính container**. Không bọc thêm lớp DOM nào — đây là lý do nó dán được vào cả bảng, flex,
grid mà không phải sửa cấu trúc từng chỗ, chỉ cần thêm class `scroll-fade`.

Con `<div>` nằm trong vùng cuộn nên mặc định nó trôi theo nội dung; bù bằng cách cộng
`scrollTop`/`scrollLeft` vào `transform` để nó đứng yên so với khung nhìn:

```
y = scrollTop + progress × (clientHeight − thumbLength)
x = scrollLeft + clientWidth − thumbSize − gap
```

Hệ quả có chủ ý: mép dưới của thumb luôn bằng `scrollTop + clientHeight ≤ scrollHeight`, nên nó
**không bao giờ nới thêm vùng cuộn** (không đẻ ra thanh cuộn ngang ma).

Riêng **gốc trang** (`<html>`) đi nhánh khác: thumb `position: fixed` treo vào `<body>` vì khung
nhìn của nó chính là viewport, nên không phải cộng `scrollTop`. Sự kiện `scroll` của trang bắn ở
`document` chứ không ở `documentElement` nên phải nghe riêng, và **bỏ hover-để-hiện** — con trỏ ở
bất kỳ đâu trên trang cũng tính là hover `<html>`, giữ hover thì thanh cuộn trang không bao giờ ẩn.

### Thông số (chốt 25/09)

| | |
|---|---|
| Bề dày phần nhìn thấy | **2px** (vùng bấm 10px, do `::before` nới vào phía trong) |
| `opacity` | **0 ↔ 1** — hiện là hiện hẳn |
| Hiện ra | 120ms |
| Mờ đi | **500ms**, bắt đầu **ngay tại điểm dừng** |
| Bám vị trí | `transform` 180ms `cubic-bezier(.22,1,.36,1)` |

Ba điểm dễ bị sửa ngược, ghi lại lý do:

- **Hiện là `opacity: 1`, không pha loãng.** Thanh chỉ còn 2px; hạ alpha nữa thì nó đọc như vết bẩn
  chứ không phải thanh cuộn. Cảm giác "nhẹ" phải đến từ việc nó *biến mất khi không cuộn*, không
  phải từ việc nó mờ.
- **`transform` CÓ tween** (bản đầu cố ý không có). 180ms ease-out khiến thumb bám hơi trễ sau nội
  dung, nhờ vậy khi cuộn dừng nó *tween* nốt quãng còn thiếu thay vì khựng cái đứng im. Đừng nâng
  quá ~200ms: dài hơn là thanh lết theo sau con lăn.
- **Điểm dừng lấy từ `scrollend`**, không phải hẹn giờ. Trước đây chờ 0,9s im lặng mới ẩn; giờ ẩn
  đúng lúc cuộn dừng. Trình duyệt không có `scrollend` thì mới rơi về khoảng lặng 120ms — đặt số này
  quá nhỏ sẽ nháy giữa các khung hình của một cú cuộn đang chạy.

Kéo thanh để cuộn vẫn dùng được — nếu chỉ vẽ trang trí thì mất một thao tác người dùng quen tay. Vì
phần nhìn thấy chỉ 2px, vùng bấm được `::before` nới rộng ra **phía trong** container (trái/trên);
nới ra phía ngoài sẽ cộng vào `scrollWidth`/`scrollHeight` và đẻ ra thanh cuộn ma.

Lần vẽ đầu chạy **đồng bộ**, không qua `rAF`: trang đang ẩn (tab nền) thì `rAF` bị đóng băng, thumb
sẽ không tồn tại cho tới lúc trang hiện lại. Các lượt sau mới gom qua `rAF`.

Tự gắn qua `MutationObserver` trong `initScrollFade()` (gọi ở `main.tsx`), nên modal/dropdown xuất
hiện sau vẫn được gắn mà không phải import gì trong component.

### (1b) Chỉ hiện khi CUỘN (25/09)

Bản đầu còn hiện thanh cuộn khi rê chuột vào vùng cuộn. Bỏ: rê chuột ngang qua một trang nhiều khung
cuộn là thanh nhấp nháy liên tục ở chỗ người dùng không hề định cuộn.

Hover chỉ còn tác dụng **trên chính thanh cuộn** — để khi nó đã hiện mà con trỏ đang đặt lên thì nó
đừng mờ mất trước khi kịp bấm kéo.

### (2) Phần còn lại — native, ẩn/hiện tức thì

Sau khi đã gắn `scroll-fade` cho **mọi** khung cuộn trong `src/`, nhánh này chỉ còn lo phần tạo
động không mang class. Thumb để `transparent`, chỉ hiện khi có `data-scrolling="true"` (listener
`scroll` ở pha capture gắn/gỡ).

**Gutter giữ nguyên 10px ở cả hai trạng thái, chỉ màu thumb đổi** (viền trong suốt 4px mỗi bên ⇒ phần
thấy được cũng 2px, khớp với overlay). Đây là điểm dễ làm sai nhất: bật/tắt `scrollbar-width` thì nội
dung co giãn 10px mỗi lần cuộn — đúng lỗi của bản tự chế cũ.

## 4. Phạm vi

**Mọi thanh cuộn**, không trừ chỗ nào:

- gốc trang (`<html>`) — gắn tự động trong `initScrollFade()`, không cần class;
- 58 khung cuộn trong `src/`: layout admin/manager, modal, bảng (`overflow-x-auto`), dropdown,
  sidebar, danh sách chat, bảng thống kê, carousel ảnh sản phẩm, tab đơn hàng, CategoryBar…

Bản đầu (24/09) cố ý chừa những chỗ đã tự giấu thanh cuộn (`scrollbar-none`, `hide-scrollbar`) vì coi
đó là ý đồ thiết kế; 25/09 chốt lại là áp cho tất cả. **Vẫn giữ nguyên các class giấu cũ** ở đó — nếu
JS không chạy thì chúng ẩn y như trước chứ không lòi ra thanh cuộn mặc định.

Kiểm tra còn sót: `grep -rn "overflow-\(x\|y\)-auto\|overflow-auto\|overflow-y-scroll" src/ | grep -v scroll-fade`
phải ra rỗng.

## 5. Đánh đổi đã biết

- **Thumb là con của container.** React không biết tới node này. An toàn vì luôn `appendChild` vào
  cuối (React chèn node của nó *trước* đó), nhưng nếu sau này có chỗ đọc `children`/`lastElementChild`
  của một khung cuộn thì phải nhớ.
- **Container thành `relative`** nếu nó không tự khai position. Rule đặt ở `@layer base` chứ không
  phải inline style, để utility của Tailwind vẫn thắng — nếu đặt inline thì `md:absolute`
  (ScoreWaterfall) sẽ bị đè chết. Đổi lại: phần tử vốn `static` mà bên trong có con định vị tuyệt đối
  theo một tổ tiên xa hơn thì sẽ lệch.
- **Chỗ (2) không có fade.** Không phải lựa chọn — trình duyệt không cho (xem §2). Muốn fade thì thêm
  class `scroll-fade`.
- **`MutationObserver` theo dõi toàn bộ `document`** để bắt container mới. Callback chỉ duyệt
  `addedNodes`, và mọi lần vẽ đều gom qua `rAF`.

## 6. Kiểm thử

Đo trên trình duyệt thật (không có test tự động cho phần này):

1. Container `.scroll-fade` → `data-scroll-fade="on"`, thanh native `scrollbar-width: none`, có đúng
   một `.fd-scroll-thumb--y`.
2. Công thức vị trí: với `clientHeight 158 / scrollHeight 1020`, `scrollTop` 0 / 430 / 860 cho
   `translateY` 0 / 494,85 / 989,70 — khớp tính tay.
3. `document.getAnimations()` có `CSSTransition:opacity` ⇒ fade chạy thật (native thì không bao giờ
   tạo ra CSSTransition nào).
4. Thông số đo lại sau khi chỉnh: bề dày `2px`; `opacity` ẩn `0` / hiện `1`; `transitionDuration`
   `0.5s, 0.18s` ở trạng thái ẩn và `0.12s, 0.18s` ở trạng thái hiện.
5. Điểm dừng: đang cuộn → `data-visible="true"`; đứng yên 400ms mà chưa có `scrollend` → **vẫn
   hiện** (không tự tắt sớm); ngay sau `scrollend` → `false`, bắt đầu mờ 0,5s.
6. Vùng bấm `::before` = `top/bottom -4px, left -8px, right 0`, và `scrollWidth === clientWidth`
   ⇒ không đẻ thanh cuộn ma.
7. Gốc trang: thumb nằm trong `<body>`, `position: fixed`, `width 2px`, `right 2px`; với viewport
   800 / `scrollHeight` 3611 thì `height = 800²/3611 = 177,2px` — khớp tính tay. Hiện khi cuộn, ẩn
   ngay ở `scrollend`.
8. Cơ chế (2): cuộn → thumb `rgb(125,143,105)`; `offsetWidth − clientWidth` giữ nguyên **10px**,
   `border-width` 4px ⇒ phần thấy được 2px, không nhảy layout.
