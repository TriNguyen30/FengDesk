import { AlertTriangle, Bot, Loader2, PenLine, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AiActivity } from "./types";

interface AiActivityIndicatorProps {
  activity: AiActivity;
}

/** Số dòng chuỗi suy luận hiển thị cùng lúc. */
const VISIBLE_LINES = 3;
/** Phải khớp class `leading-5` bên dưới (1.25rem) để tính chiều cao khung. */
const LINE_HEIGHT_REM = 1.25;

/** Dòng cũ trôi lên trên thì mờ dần thay vì bị cắt ngang — chỉ bật khi đã có dòng trôi ra. */
const TOP_FADE = "linear-gradient(to bottom, transparent 0, #000 1.1rem, #000 100%)";

/**
 * BE gửi kèm "note" thân thiện cho phase calling_tool (nhãn tool) và phase thinking (chuỗi suy luận
 * đang stream). Nhịp gõ chữ do `usePacedAiActivity` lo — ở đây `note` đã là đoạn text sẵn sàng hiển thị.
 */
export default function AiActivityIndicator({ activity }: AiActivityIndicatorProps) {
  const { phase, note } = activity;

  // Thinking có note = chuỗi suy luận đang chạy → khối nhiều dòng, cuộn dọc, KHÔNG icon.
  const isThinkingStream = phase === "thinking" && !!note;

  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLParagraphElement>(null);
  // Phần chữ đã vượt quá khung → đẩy lên bấy nhiêu px.
  const [scrolledPast, setScrolledPast] = useState(0);

  // Dùng ResizeObserver thay vì đo offsetHeight mỗi frame: callback chỉ chạy khi khối chữ THẬT SỰ
  // cao thêm (tức mỗi lần xuống dòng, vài lần/giây), và chạy sau layout nên không ép reflow.
  useEffect(() => {
    const inner = innerRef.current;
    const box = boxRef.current;
    if (!inner || !box) {
      setScrolledPast(0);
      return;
    }
    const measure = () => setScrolledPast(Math.max(0, inner.offsetHeight - box.clientHeight));
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    measure();
    return () => ro.disconnect();
  }, [isThinkingStream]);

  const { icon, label } = (() => {
    if (phase === "calling_tool") {
      return {
        icon: <Wrench size={13} className="shrink-0" />,
        label: (note ?? "Looking up data") + "...",
      };
    }
    if (phase === "writing") {
      return { icon: <PenLine size={13} className="shrink-0" />, label: "Generating response..." };
    }
    if (phase === "error") {
      return { icon: <AlertTriangle size={13} className="shrink-0" />, label: "Something went wrong" };
    }
    return {
      icon: <Loader2 size={13} className="shrink-0 animate-spin" />,
      label: "Thinking...",
    };
  })();

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-2 rounded-2xl rounded-bl-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-gray-600">
        <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot size={13} />
        </span>

        {isThinkingStream ? (
          <>
            {/* Không dùng aria-live cho khối chữ: nó đổi vài lần/giây, screen reader sẽ đọc lặp
                không dứt. Thay bằng một nhãn tĩnh. */}
            <span className="sr-only">AI đang suy nghĩ</span>
            {/* Chữ đổ đầy dòng rồi xuống dòng kế; quá VISIBLE_LINES thì cả khối trượt lên
                (transform, không đụng layout) — dòng mới luôn ở đáy khung. */}
            <div
              ref={boxRef}
              // maxHeight (không phải height cố định): khung cao dần 1→3 dòng rồi mới bắt đầu trượt,
              // tránh chừa 2 dòng trống lúc câu suy luận mới có một dòng.
              className="w-[min(22rem,58vw)] overflow-hidden"
              style={{
                maxHeight: `${VISIBLE_LINES * LINE_HEIGHT_REM}rem`,
                maskImage: scrolledPast > 0 ? TOP_FADE : undefined,
                WebkitMaskImage: scrolledPast > 0 ? TOP_FADE : undefined,
              }}
              aria-hidden="true"
            >
              <p
                ref={innerRef}
                className="leading-5 italic break-words opacity-70"
                style={{
                  transform: `translateY(-${scrolledPast}px)`,
                  transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {note}
              </p>
            </div>
          </>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            {icon}
            <span className="truncate">{label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
