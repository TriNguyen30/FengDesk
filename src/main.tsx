import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";
import { applySavedTheme } from "@/components/ui/ThemeToggle";

// Gắn theme đã lưu TRƯỚC khi render để không nháy màu mặc định.
applySavedTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
