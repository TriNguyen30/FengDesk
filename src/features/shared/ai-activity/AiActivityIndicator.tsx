import { AlertTriangle, Loader2, PenLine, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { AiActivity } from "./types";

interface AiActivityIndicatorProps {
  activity: AiActivity;
  /**
   * Lề ngang khe (rem). Animate CÙNG chiều cao nên đổi giá trị giữa lượt không bị giật ngang —
   * cần thiết vì lề thay đổi ngay khi lời dẫn đầu tiên xuất hiện (xem `attachedAbove`).
   */
  insetRem?: number;
  /**
   * Có khối lời dẫn nằm sát ngay TRÊN khe không.
   * true → bỏ mép trên và bóng trên, để viền dưới của khối lời dẫn làm mép chung: chữ streaming
   * trông như đang nạp tiếp lên phần trả lời tạm, thay vì là một khối rời bên dưới.
   * Phía gọi phải tự triệt tiêu khoảng cách dọc của container (xem `className`).
   */
  attachedAbove?: boolean;
  /** Lề/khoảng cách dọc do container quy định, vd `-mt-4` để hút khe lên sát khối phía trên. */
  className?: string;
}

/** Số dòng chuỗi suy luận hiển thị cùng lúc. */
const VISIBLE_LINES = 3;
/** Phải khớp class `leading-5` bên dưới (1.25rem) để tính chiều cao khe. */
const LINE_HEIGHT_REM = 1.25;
/** Khoảng hở trên + dưới giữa chữ và hai mép khe. */
const BAND_PAD_REM = 0.5;

const STREAM_CONTENT_REM = VISIBLE_LINES * LINE_HEIGHT_REM;
const LABEL_CONTENT_REM = LINE_HEIGHT_REM;

/** Dòng cũ trôi lên trên thì mờ dần thay vì bị cắt ngang — chỉ bật khi đã có dòng trôi ra. */
const TOP_FADE = "linear-gradient(to bottom, transparent 0, #000 1.1rem, #000 100%)";

/**
 * Bề rộng vệt mờ ở hai đầu khe, và độ thụt của chữ so với mép khe.
 * Chữ thụt vào ÍT hơn vệt mờ nên ký tự đầu/cuối dính mờ nhẹ — cố ý.
 * Tỉ lệ `TEXT_INSET / SIDE_FADE` chính là độ đục của ký tự đầu tiên (~0.73): kéo hai số này thì
 * giữ tỉ lệ, đừng chỉnh một cái rồi để chữ bị nuốt.
 */
const SIDE_FADE_REM = 3.75;
const TEXT_INSET_REM = 2.5;

/**
 * Hai ĐẦU khe nhòe dần ra nền. Đây là thứ phân biệt "khe hở" với "cái hộp": nếu để nền trong khác
 * nền ngoài và cắt vuông ở hai đầu thì mắt đọc ra bốn cạnh — tức một box. Nhòe hai đầu + nền trong
 * TRÙNG nền ngoài thì chỉ còn hai mép ngang, đúng cảm giác rãnh.
 * Mask áp lên cả khe nên bóng đổ và hai mép cũng nhòe theo, không kết thúc đột ngột.
 */
const SIDE_FADE =
  `linear-gradient(to right, transparent 0, #000 ${SIDE_FADE_REM}rem, ` +
  `#000 calc(100% - ${SIDE_FADE_REM}rem), transparent 100%)`;

/**
 * Trạng thái AI hiển thị dưới dạng KHE HỞ cắt ngang khung chat, không phải bong bóng tin nhắn:
 * hai mép trên/dưới tách ra khi lượt bắt đầu, chữ chạy bên trong, rồi khép lại khi lượt kết thúc.
 *
 * Vì sao cả indicator (mọi phase) đều là khe, không riêng phase thinking: một lượt đi qua
 * thinking → calling_tool → thinking → writing. Nếu chỉ phase thinking là khe thì UI sẽ nhấp nháy
 * qua lại giữa khe và bong bóng. Ở đây khe mở MỘT lần đầu lượt, đóng MỘT lần cuối lượt; đổi phase
 * chỉ đổi nội dung bên trong (và chiều cao khe, tạo cảm giác khe "thở").
 *
 * Animation đóng/mở do `AnimatePresence` ở phía component cha điều khiển — không có nó thì khe bị
 * gỡ khỏi DOM ngay lập tức và mất hẳn hoạt cảnh khép lại.
 */
export default function AiActivityIndicator({
  activity,
  insetRem = 0,
  attachedAbove = false,
  className = "",
}: AiActivityIndicatorProps) {
  const { phase, note } = activity;
  const reduceMotion = useReducedMotion();

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
      return {
        icon: <AlertTriangle size={13} className="shrink-0" />,
        label: "Something went wrong",
      };
    }
    return {
      icon: <Loader2 size={13} className="shrink-0 animate-spin" />,
      label: "Thinking...",
    };
  })();

  const contentRem = isThinkingStream ? STREAM_CONTENT_REM : LABEL_CONTENT_REM;
  const bandRem = contentRem + BAND_PAD_REM * 2;

  // marginInline nằm trong CẢ open lẫn shut: nó chỉ đổi khi `insetRem` đổi (lúc lời dẫn đầu tiên
  // tới), không được đổi theo nhịp mở/đóng khe.
  const open = { height: `${bandRem}rem`, opacity: 1, marginInline: `${insetRem}rem` };
  const shut = { height: "0rem", opacity: 0, marginInline: `${insetRem}rem` };
  const bandTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

  // Hai mép trượt ra/vào theo chiều ngang → cảm giác khe được "rạch" mở ra rồi khép lại.
  const edge = {
    initial: reduceMotion ? {} : { scaleX: 0.35, opacity: 0 },
    animate: { scaleX: 1, opacity: 1 },
    exit: reduceMotion ? {} : { scaleX: 0.35, opacity: 0 },
    transition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <motion.div
      // Chiều cao là thứ duy nhất animate ở tầng này. Chỉ chạy lúc mở/đóng/đổi phase (vài lần mỗi
      // lượt), không phải mỗi frame — nên việc nó gây layout là chấp nhận được.
      initial={shut}
      animate={open}
      exit={shut}
      transition={bandTransition}
      // KHÔNG đặt màu nền: nền trong phải trùng nền ngoài, nếu không hai đầu khe sẽ hiện thành cạnh
      // dọc và cả khối đọc ra thành một cái box.
      className={`relative overflow-hidden ${className}`}
      style={{
        // Bóng đổ vào trong, mép DƯỚI đậm hơn mép trên — làm khe trông như lõm xuống chứ không phải
        // một dải màu dán lên bề mặt. Khi nối vào khối phía trên thì bỏ bóng trên, nếu không nó
        // chồng lên viền dưới của khối đó thành một vệt tối đôi ngay chỗ nối.
        boxShadow: attachedAbove
          ? "inset 0 -8px 10px -9px rgba(0,0,0,0.5)"
          : "inset 0 5px 7px -8px rgba(0,0,0,0.16), inset 0 -8px 10px -9px rgba(0,0,0,0.4)",
        maskImage: SIDE_FADE,
        WebkitMaskImage: SIDE_FADE,
      }}
    >
      {/* Nội dung neo GIỮA khe: khi chiều cao chạy 0 → mở, chữ lộ dần ra từ giữa về hai phía,
          đúng cảm giác khe hở tách ra. Nếu để theo dòng chảy bình thường thì nó chỉ trượt từ
          trên xuống như một khối rơi vào. */}
      <div
        className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center text-xs text-gray-600"
        // Thụt vào ÍT hơn bề rộng vệt mờ → mép chữ chỉ dính mờ nhẹ thay vì bị nuốt mất.
        style={{ height: `${contentRem}rem`, paddingInline: `${TEXT_INSET_REM}rem` }}
      >
        {isThinkingStream ? (
          <>
            {/* Không dùng aria-live cho khối chữ: nó đổi vài lần/giây, screen reader sẽ đọc lặp
                không dứt. Thay bằng một nhãn tĩnh. */}
            <span className="sr-only">AI đang suy nghĩ</span>
            {/* Chữ đổ đầy dòng rồi xuống dòng kế; quá VISIBLE_LINES thì cả khối trượt lên
                (transform, không đụng layout) — dòng mới luôn ở đáy khe. */}
            <div
              ref={boxRef}
              className="w-full overflow-hidden"
              style={{
                maxHeight: `${STREAM_CONTENT_REM}rem`,
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
                  transition: reduceMotion
                    ? undefined
                    : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
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

      {/* Hai mép. Bám đúng mép khung nên khi chiều cao chạy, chúng tách xa / khép lại nhau.
          Mép dưới đậm hơn + có vệt sáng ngay dưới: đó là phần "môi" dưới hứng sáng, thứ làm khe
          trông như hổng chứ không phải hai đường kẻ. Tương quan đậm/nhạt khớp với bóng đổ ở trên. */}
      {/* Mép trên chỉ vẽ khi KHÔNG có khối lời dẫn ngay trên — nếu có, viền dưới của khối đó chính
          là mép trên của khe, vẽ thêm nữa thành hai vạch sát nhau. */}
      {!attachedAbove && (
        <motion.span
          {...edge}
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-900/12 to-transparent"
        />
      )}
      <motion.span
        {...edge}
        className="pointer-events-none absolute inset-x-0 bottom-px h-px bg-gradient-to-r from-transparent via-gray-900/0 to-transparent"
      />
      <motion.span
        {...edge}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />
    </motion.div> 
  );
}
