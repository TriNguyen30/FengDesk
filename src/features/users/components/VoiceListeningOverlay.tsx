import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface VoiceListeningOverlayProps {
  /** true = đang warmup hoặc đang nghe thật — viền chạy vào; false → viền chạy ngược ra rồi unmount. */
  active: boolean;
  /** Mức âm lượng 0..1 mỗi bar, đến từ useMicLevel — rỗng/toàn 0 khi chưa có dữ liệu thật. */
  levels: number[];
}

// Khớp bo góc thật của textarea (rounded-xl = 12px). Dùng toạ độ PIXEL THẬT (đo bằng ResizeObserver)
// thay vì viewBox tỉ lệ phần trăm — khung mô tả rất rộng/thấp, preserveAspectRatio="none" trên
// viewBox vuông sẽ méo phi-đều đến mức vector-effect="non-scaling-stroke" làm mất hẳn 2 cạnh dọc.
const CORNER_RADIUS = 12;
const DRAW_TRANSITION = { duration: 1, ease: "easeInOut" as const };
const BORDER_STROKE_WIDTH = 2; // px, khớp border textarea (border-2)

function buildHalves(w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const midX = w / 2;
  const right =
    `M ${midX} 0 L ${w - rr} 0 A ${rr} ${rr} 0 0 1 ${w} ${rr} ` +
    `L ${w} ${h - rr} A ${rr} ${rr} 0 0 1 ${w - rr} ${h} L ${midX} ${h}`;
  const left =
    `M ${midX} 0 L ${rr} 0 A ${rr} ${rr} 0 0 0 0 ${rr} ` +
    `L 0 ${h - rr} A ${rr} ${rr} 0 0 0 ${rr} ${h} L ${midX} ${h}`;
  return { right, left };
}

/**
 * Viền xanh "vẽ" từ giữa cạnh trên tràn xuống 2 bên khi bắt đầu nghe (che khoảng ~1-1.5s mic/engine
 * khởi động — nhắc user khoan nói vội), và audio visualizer (đặt trên đường viền dưới) phản ứng âm
 * lượng mic thật. Gỡ khi dừng bằng animation ngược lại thay vì biến mất đột ngột.
 */
export default function VoiceListeningOverlay({ active, levels }: VoiceListeningOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { right, left } = buildHalves(size.w, size.h, CORNER_RADIUS);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {active && size.w > 0 && (
          <>
            <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none">
              <motion.path
                d={right}
                stroke="var(--color-primary)"
                strokeWidth={BORDER_STROKE_WIDTH}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={DRAW_TRANSITION}
              />
              <motion.path
                d={left}
                stroke="var(--color-primary)"
                strokeWidth={BORDER_STROKE_WIDTH}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={DRAW_TRANSITION}
              />
            </svg>

            <motion.div
              className="absolute inset-x-0 bottom-0 flex h-6 items-end justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .1, ease: "easeInOut", delay: 1 }}
            >
              {levels.map((lvl, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-primary transition-[height] duration-100 ease-out"
                  style={{ height: `${Math.round(lvl * 24)}px` }}
                />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
