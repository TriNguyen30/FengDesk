export interface SpaceTabItem {
  id: string;
  name: string;
  /** % hiển thị trên tab; null/undefined → đang tải (hiện skeleton). */
  percent?: number | null;
  color?: string;
}

interface SpaceTabsProps {
  items: SpaceTabItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
}

/** Dải tab chọn phòng (mỗi tab có %), cuộn ngang khi nhiều không gian. */
export default function SpaceTabs({ items, selectedId, onSelect, onAddNew }: SpaceTabsProps) {
  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-0.5">
      {items.map((item) => {
        const active = item.id === selectedId;
        const color = item.color ?? "#7d8f69";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            title={item.name}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "border-[#e5e7eb] border-b-white bg-white"
                : "border-transparent bg-transparent text-gray-500 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            {item.percent != null ? (
              <span style={{ color }}>
                {item.percent}
                <span className="text-[9px]">%</span>
              </span>
            ) : (
              <span className="h-3 w-6 animate-pulse rounded bg-gray-200" />
            )}
            <span className="max-w-[90px] overflow-hidden text-ellipsis text-gray-500">
              {item.name}
            </span>
          </button>
        );
      })}
      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="shrink-0 whitespace-nowrap rounded-t-xl border border-dashed border-[#cdd3c4] px-3 py-2 text-xs font-bold text-primary cursor-pointer"
        >
          + Thêm
        </button>
      )}
    </div>
  );
}
