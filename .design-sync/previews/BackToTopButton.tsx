import { useEffect } from "react";
import BackToTopButton from "@/components/ui/BackToTopButton";

// The real component only renders once window.scrollY > 300 (it returns
// null otherwise) — so the card needs tall content plus a forced scroll to
// show anything at all.
function ScrollDown() {
  useEffect(() => {
    window.scrollTo(0, 700);
    window.dispatchEvent(new Event("scroll"));
  }, []);
  return null;
}

export function Visible() {
  return (
    <div style={{ minHeight: 1600, position: "relative" }}>
      <p style={{ padding: 16, color: "#6b7280", fontSize: 13 }}>
        Nút "Cuộn lên đầu trang" chỉ hiện khi người dùng đã cuộn xuống hơn 300px — card này mô
        phỏng trạng thái đó bằng cách cuộn xuống ngay khi tải.
      </p>
      <ScrollDown />
      <BackToTopButton />
    </div>
  );
}
