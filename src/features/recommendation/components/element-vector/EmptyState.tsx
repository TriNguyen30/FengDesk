interface EmptyStateProps {
  onCreateWorkspace?: () => void;
}

/** "Bạn chưa có không gian nào" — khi user chưa có workspace nào để xem fit sản phẩm. */
export default function EmptyState({ onCreateWorkspace }: EmptyStateProps) {
  return (
    <div className="flex max-w-[520px] flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d5ddc9] bg-[#fafbf9] px-6 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7d8f691f] text-2xl font-bold text-primary">
        +
      </div>
      <div className="text-base font-extrabold text-gray-900">Bạn chưa có không gian nào</div>
      <p className="max-w-[400px] text-sm leading-relaxed text-gray-500">
        Thêm một không gian (phòng ngủ, phòng làm việc, phòng họp…) để xem sản phẩm này hợp đến đâu
        với <b>bản mệnh</b> và <b>Ngũ hành từng phòng</b> của bạn.
      </p>
      {onCreateWorkspace && (
        <button
          type="button"
          onClick={onCreateWorkspace}
          className="mt-1 cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          + Thêm không gian để xem phân tích
        </button>
      )}
    </div>
  );
}
