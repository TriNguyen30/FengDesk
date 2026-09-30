import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

/** Chờ một nhịp trước khi mở/đóng theo chuột — lướt ngang qua cột không làm các card giật mở. */
const HOVER_OPEN_DELAY_MS = 120;
const HOVER_CLOSE_DELAY_MS = 180;

interface CollapsibleFormCardProps {
  icon: LucideIcon;
  title: string;
  /** Câu nhắc "phần này là gì" — chỉ hiện khi đang thu gọn VÀ chưa chọn gì. */
  hint: string;
  /** Mô tả ngắn hiện ở đầu phần mở rộng, thay chỗ câu nhắc. */
  description?: ReactNode;
  /** Những gì đã chọn — hiện thành chip khi thu gọn. Rỗng ⇒ hiện câu nhắc. */
  summary?: string[];
  children: ReactNode;
  testId?: string;
}

/**
 * Card form thu gọn được — cùng kiểu với nhóm tag ở bước "Kiểm tra & lưu" của intake: mặc định chỉ hiện tóm tắt,
 * rê chuột (hoặc focus bằng bàn phím) thì mở đủ, chiều cao chạy mượt bằng mẹo grid-rows 0fr ↔ 1fr. Bấm tiêu đề
 * để ghim mở (dùng được trên màn cảm ứng, không có hover).
 */
export function CollapsibleFormCard({
  icon: Icon,
  title,
  hint,
  description,
  summary,
  children,
  testId,
}: CollapsibleFormCardProps) {
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const expanded = pinned || hovered || focusWithin;
  const hasSummary = (summary?.length ?? 0) > 0;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const hoverTo = (next: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setHovered(next),
      next ? HOVER_OPEN_DELAY_MS : HOVER_CLOSE_DELAY_MS,
    );
  };

  return (
    <div
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow duration-300 hover:shadow-md"
      onMouseEnter={() => hoverTo(true)}
      onMouseLeave={() => hoverTo(false)}
      // Focus ở chính nút tiêu đề không tính — không thì bấm tiêu đề để thu lại cũng không thu được.
      onFocus={(e) => setFocusWithin((e.target as Node) !== headerRef.current)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      }}
      data-testid={testId}
      data-expanded={expanded}
    >
      <button
        ref={headerRef}
        type="button"
        onClick={() => {
          setPinned((p) => !p);
          if (pinned) setHovered(false);
        }}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          <h2 className="text-base font-bold text-gray-950">{title}</h2>
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Thu gọn: tóm tắt đã chọn, chưa chọn gì thì câu nhắc — crossfade với phần mở rộng bên dưới. */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "0fr" : "1fr", opacity: expanded ? 0 : 1 }}
        aria-hidden={expanded}
      >
        <div className="overflow-hidden">
          <div className="pt-3">
            {hasSummary ? (
              <SummaryChips items={summary ?? []} />
            ) : (
              <p className="text-xs italic text-gray-400">{hint}</p>
            )}
          </div>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        {/* inert khi thu gọn: Tab không lọt vào ô đang bị ẩn. */}
        <div className="overflow-hidden" inert={!expanded}>
          <div className="mt-3 space-y-4 border-t border-gray-100 pt-4">
            {description && <p className="text-xs leading-relaxed text-gray-500">{description}</p>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chip tóm tắt cho phần thu gọn. */
function SummaryChips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
