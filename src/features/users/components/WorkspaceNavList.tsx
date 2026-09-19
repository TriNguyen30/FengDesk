import { Link, useMatch } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useWorkspaceCompatibilities, useWorkspaces } from "../hooks/useWorkspace";
import {
  compatibilityColor,
  resolveSelectedWorkspace,
  workspacePath,
} from "../utils/selectWorkspace";

/** Cùng spring với pill của nav chính (ProfileLayout) — chuyển phòng phải "đằm" giống chuyển tab. */
const PILL_SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

/** Số phòng thấy được trước khi phải cuộn; mỗi dòng 34px + gap 2px. */
const VISIBLE_ROWS = 5;
const ROW_HEIGHT_PX = 34;
const ROW_GAP_PX = 2;

/**
 * Danh sách phòng xổ ra dưới mục "Không gian làm việc" trong sidebar hồ sơ — chỉ render khi đang ở tab
 * đó (ProfileLayout quyết định). Mỗi dòng là một chip "NN% Tên phòng"; phòng đang xem có nền là THANH
 * TƯƠNG THÍCH: fill từ trái sang phải theo %, màu theo % (đỏ/vàng/xanh). Quá 5 phòng → cuộn dọc, snap
 * theo từng dòng. Highlight theo cùng quy tắc chọn với trang chính (`resolveSelectedWorkspace`).
 */
export default function WorkspaceNavList() {
  const reduceMotion = useReducedMotion();
  const { workspaces, status } = useWorkspaces();
  // Sidebar nằm ở route cha nên useParams không thấy :workspaceId của route con — match thẳng URL.
  const match = useMatch("/profile/workspace/:workspaceId");
  const selected = resolveSelectedWorkspace(workspaces, match?.params.workspaceId);
  const percentById = useWorkspaceCompatibilities(workspaces.map((w) => w.id));

  const maxHeight = VISIBLE_ROWS * ROW_HEIGHT_PX + (VISIBLE_ROWS - 1) * ROW_GAP_PX;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <ul
        className="custom-scrollbar ml-5 mt-1 flex snap-y snap-mandatory flex-col gap-0.5 overflow-y-auto border-l border-gray-200 pl-2 pr-1"
        style={{ maxHeight }}
      >
        {status === "pending" ? (
          [0, 1].map((i) => (
            <li
              key={i}
              className="animate-pulse rounded-lg bg-gray-50"
              style={{ height: ROW_HEIGHT_PX }}
            />
          ))
        ) : workspaces.length === 0 ? (
          <li className="px-2 py-1.5 text-xs text-gray-400">Chưa có không gian nào</li>
        ) : (
          workspaces.map((w) => {
            const active = w.id === selected?.id;
            const percent = percentById.get(w.id);
            const color = percent != null ? compatibilityColor(percent) : "#9ca3af";
            return (
              <li key={w.id} className="snap-start">
                <Link
                  to={workspacePath(w.id)}
                  aria-current={active ? "page" : undefined}
                  title={percent != null ? `${w.name} — tương thích ${percent}%` : w.name}
                  className={`relative flex items-center gap-2 overflow-hidden rounded-lg border px-2 text-[13px] transition-colors ${
                    active
                      ? "border-gray-200 font-semibold text-gray-900"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{ height: ROW_HEIGHT_PX }}
                >
                  {/* Thanh tương thích: chỉ phòng đang chọn có, trượt sang phòng mới bằng layoutId. */}
                  {active && percent != null && (
                    <motion.span
                      layoutId={reduceMotion ? undefined : "workspace-nav-active-fill"}
                      transition={PILL_SPRING}
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{
                        width: `${Math.max(6, percent)}%`,
                        backgroundColor: color,
                        opacity: 0.18,
                      }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="relative z-10 w-9 shrink-0 text-right text-xs font-bold tabular-nums"
                    style={{ color }}
                  >
                    {percent === undefined ? (
                      <span className="inline-block h-3 w-7 animate-pulse rounded bg-gray-200 align-middle" />
                    ) : percent === null ? (
                      "—"
                    ) : (
                      <>
                        {percent}
                        <span className="text-[9px]">%</span>
                      </>
                    )}
                  </span>
                  <span className="relative z-10 truncate">{w.name}</span>
                  {w.isDefault && (
                    <Star
                      size={11}
                      className="relative z-10 ml-auto shrink-0 fill-current text-primary/70"
                      aria-label="Mặc định"
                    />
                  )}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </motion.div>
  );
}
