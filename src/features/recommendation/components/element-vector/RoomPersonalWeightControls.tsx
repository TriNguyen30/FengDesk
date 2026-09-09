import { useState } from "react";
import { Info, RotateCcw, UserRound } from "lucide-react";
import type { PersonalDirection } from "@/features/users/types/workspace";

interface RoomPersonalWeightControlsProps {
  direction: PersonalDirection;
  /** Số phiếu chủ nhân đang thật sự có, từ `contributions`. */
  personVotes: number;
  /** Số phiếu đang mô phỏng (null = dùng đúng giá trị BE trả). */
  simulatedVotes: number | null;
  onSimulate: (votes: number | null) => void;
}

/** Kéo tới đâu là đủ để thấy khác biệt mà không biến chủ nhân thành cả căn phòng. */
const MAX_SIMULATED_VOTES = 8;

/**
 * Chip bản mệnh + slider mô phỏng **số phiếu** của chủ nhân phòng.
 *
 * Đơn vị là PHIẾU chứ không phải %, vì phiếu mới là đại lượng gốc của mô hình: nền phòng 3 phiếu,
 * mỗi tag 1 phiếu, chủ nhân N phiếu. Phần trăm chỉ là hệ quả (`votes / totalVotes`) và nó đổi mỗi
 * lần user khai thêm tag — nói "3 phiếu" thì ổn định, nói "23%" thì mai khai thêm tag là sai.
 */
export default function RoomPersonalWeightControls({
  direction,
  personVotes,
  simulatedVotes,
  onSimulate,
}: RoomPersonalWeightControlsProps) {
  const [showReason, setShowReason] = useState(false);

  const active = simulatedVotes ?? personVotes;
  const isSimulating = simulatedVotes !== null && simulatedVotes !== personVotes;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowReason((v) => !v)}
          aria-expanded={showReason}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#D9AD41]/15 px-2.5 py-1 text-xs font-medium text-[#8a6d1f]"
        >
          <UserRound size={13} />
          Bạn góp {personVotes} phiếu vào phòng
          <Info size={12} className="opacity-70" />
        </button>

        <span className="text-[11px] text-gray-500">{direction.destinyLabelVi}</span>

        {isSimulating && (
          <button
            type="button"
            onClick={() => onSimulate(null)}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700"
          >
            <RotateCcw size={12} />
            Về mức thật
          </button>
        )}
      </div>

      {showReason && (
        <p className="mt-2 text-[11px] leading-snug text-gray-600">
          Bản mệnh của bạn cũng là một nguồn ngũ hành trong phòng, tính bằng phiếu như nền phòng
          (3 phiếu) và mỗi tag bạn khai (1 phiếu). Khai càng nhiều tag thật thì phần của bản mệnh
          càng loãng đi — suy đoán nhường chỗ cho quan sát.
        </p>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <label htmlFor="room-person-votes">Thử mức khác</label>
          <span className="tabular-nums">{active} phiếu</span>
        </div>
        <input
          id="room-person-votes"
          type="range"
          min={0}
          max={MAX_SIMULATED_VOTES}
          step={1}
          value={active}
          onChange={(e) => onSimulate(Number(e.target.value))}
          className="mt-1 w-full accent-[#D9AD41]"
        />
        <p className="mt-1 text-[10px] leading-snug text-gray-400">
          Chỉ để xem thử — không đổi cấu hình hệ thống.
        </p>
      </div>
    </div>
  );
}
