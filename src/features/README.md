# 📂 Hướng dẫn quản lý mã nguồn theo Tính năng (Features)

Chào ông bạn! Để dự án **FengDesk AI** không bị biến thành một "đống rác" khi code lớn dần, chúng ta sẽ áp dụng kiến trúc **Feature-based**.

### 💡 Tư duy cốt lõi

Mỗi thư mục trong `features/` là một "ứng dụng nhỏ" độc lập. Nó chứa mọi thứ cần thiết để chạy một tính năng cụ thể.

---

### 🏗️ Cấu trúc bên trong mỗi Feature

Giả sử chúng ta có tính năng `ai-recommendation`, cấu trúc sẽ như sau:

```text
ai-recommendation/
├── api/          # Các hàm gọi API (dùng axios) riêng cho tính năng này
├── components/   # Các UI components chỉ dùng riêng ở đây (VD: Form nhập hướng bàn)
├── hooks/        # Custom hooks xử lý logic (VD: useGetFengShui)
├── pages/        # Các trang (VD: Trang chủ, Trang chi tiết sản phẩm)
├── store/        # Redux Slices hoặc Store cục bộ
├── types/        # Định nghĩa kiểu dữ liệu (TypeScript Interfaces)
├── utils/        # Hàm helper xử lý logic phong thủy/toán học
└── index.ts      # "Cửa sổ" duy nhất để xuất (export) code ra ngoài
```
