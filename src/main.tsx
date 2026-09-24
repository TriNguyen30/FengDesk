import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";

import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import "./utils/i18n.ts";
import { applySavedTheme } from "@/components/ui/ThemeToggle";
import { initScrollFade } from "@/utils/scrollFade";

// Gắn theme đã lưu TRƯỚC khi render để không nháy màu mặc định.
applySavedTheme();

// Thanh cuộn tự ẩn. Tự bám theo DOM (MutationObserver) nên gọi trước render cũng được, modal và
// dropdown xuất hiện sau vẫn được gắn.
initScrollFade();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
