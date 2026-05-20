# 🌿 FengDesk AI – Nền tảng TMĐT & Hệ thống đề xuất Cây Phong Thủy AI

**FengDesk AI** là một hệ thống đột phá giúp tối ưu hóa không gian làm việc cá nhân thông qua sự kết hợp giữa Trí tuệ nhân tạo (AI), nguyên lý Phong thủy học và nền tảng Thương mại điện tử hiện đại.

---

## 📖 1. Giới thiệu dự án

Dự án tập trung giải quyết việc lựa chọn cây cảnh dựa trên dữ liệu thực tế thay vì cảm tính. Hệ thống phân tích điều kiện môi trường bàn làm việc (ánh sáng, diện tích) và thuộc tính cá nhân (mệnh, tuổi) để đưa ra đề xuất tối ưu nhất cho năng suất và sức khỏe tinh thần.

### 🌟 Tính năng tiêu biểu:

- **AI Recommendation Engine:** Tự động phân tích và đề xuất cây phù hợp kèm giải thích logic (Explainable AI).
- **Integrated E-Commerce:** Mua sắm trực tiếp cây cảnh sau khi nhận tư vấn.
- **Workspace Analysis:** Phân tích bối cảnh không gian làm việc của người dùng.
- **Multi-role Dashboard:** Hệ thống quản lý riêng biệt cho Khách hàng, Admin, Nhân viên, Chủ vườn và Quản lý.

---

## 🛠️ 2. Công nghệ sử dụng (Tech Stack)

### Frontend (Web & Mobile)

- **Framework:** React 19 (Web), React Native (Mobile - Expo).
- **Build Tool:** Vite, pnpm (Workspaces).
- **Styling:** Tailwind CSS v4, Framer Motion (Animations).
- **State Management:** Redux Toolkit.
- **Forms & Validation:** Formik + Yup.

### Backend & Infrastructure

- **BaaS:** Firebase (Authentication, Firestore, Storage).
- **API:** RESTful API structure.
- **CI/CD:** GitHub Actions (Web-CI).
- **Version Control:** Git & GitHub.

---

## 🚀 3. Cài đặt và chạy dự án (pnpm)

Dự án dùng [pnpm](https://pnpm.io/) để tải và quản lý thư viện. Cần [Node.js](https://nodejs.org/) (khuyến nghị bản LTS).

**Cài pnpm** (nếu máy chưa có): xem [Hướng dẫn cài đặt pnpm](https://pnpm.io/installation) — ví dụ với Corepack: `corepack enable` rồi `corepack prepare pnpm@latest --activate`.

Trong thư mục gốc của dự án:

```bash
pnpm install
pnpm dev
```

- **`pnpm install`** — tải và cài đặt toàn bộ thư viện theo `package.json` và lockfile.
- **`pnpm dev`** — chạy máy chủ phát triển (Vite).
- **`pnpm build`** — build bản production.
- **`pnpm preview`** — xem trước bản build.
- **`pnpm lint`** — chạy ESLint.

---

## 📂 4. Cấu trúc thư mục (Monorepo)

```text
fengdesk-ai/
├── apps/
│   ├── web/                # Ứng dụng React Web (Vite + TS)
│   └── mobile/             # Ứng dụng React Native (Optional)
├── .github/workflows/      # Tự động hóa Build & Test (CI/CD)
├── packages/
│   └── shared/             # Logic, Types và Config dùng chung
├── pnpm-workspace.yaml     # Cấu hình pnpm Monorepo
├── .gitignore              # Danh sách file loại bỏ khỏi Git
└── README.md               # Tài liệu tổng thể dự án
```
