import { Fragment, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Loader2, MoveRight } from "lucide-react";
import { MoneyInput } from "@/components/ui/MoneyInput";
import Tooltip from "@/components/ui/Tooltip";
import { formatMoneyInput } from "@/utils/money";
import { usePlatformFeePolicy } from "../hooks/usePlatformFeePolicy";
import {
  computeCommission,
  computeListedPriceForNet,
  computeSellerNet,
} from "../utils/platform-fee";

type PriceSide = "listed" | "net";

const SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

interface SellerPricingFieldProps {
  /** Giá niêm yết — số được lưu vào sản phẩm, cũng là số khách trả cho một món. */
  price: number;
  onChange: (price: number) => void;
  label?: string;
}

/**
 * Chiều cao chạy mượt theo nội dung — ghi chú hai bên dài ngắn khác nhau, đổi bên thì ngăn kéo co/giãn thay vì
 * giật. Đo bằng ResizeObserver nên cả khi chữ xuống dòng do đổi bề rộng cũng mượt.
 */
function AutoHeight({ children, instant }: { children: ReactNode; instant: boolean }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={instant ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div ref={innerRef} className="relative">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Ô giá bán gồm hai mảnh ghép: **Giá niêm yết** (giá khách thấy và trả) ⇄ **Đơn giá** (tiền người bán nhận cho một
 * món, sau chi phí nền tảng). Nhập bên nào bên kia tự tính theo tỉ lệ BE công bố, cùng quy tắc làm tròn với sổ cái.
 * Nền rãnh xanh như mục đang mở ở menu Hồ sơ, mảnh đang chọn là viên trắng trượt qua lại; ngăn kéo bên dưới giải
 * thích đúng mảnh đó.
 */
export function SellerPricingField({
  price,
  onChange,
  label = "Giá bán *",
}: SellerPricingFieldProps) {
  const { policy, isLoading, isError } = usePlatformFeePolicy();
  const reduceMotion = useReducedMotion() ?? false;
  const pillId = useId();
  const [active, setActive] = useState<PriceSide>("listed");
  // Số người bán đang gõ ở ô đơn giá: giữ nguyên chữ họ gõ, không bắt nó nhảy theo số tính ngược từ giá niêm yết.
  const [netDraft, setNetDraft] = useState<number | null>(null);
  const netRef = useRef<HTMLInputElement>(null);
  const listedRef = useRef<HTMLInputElement>(null);

  const rate = policy?.commissionRate;
  const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
  const net = rate == null ? null : computeSellerNet(safePrice, rate);
  const commission = rate == null ? 0 : computeCommission(safePrice, rate);
  const ratePct = rate == null ? null : Math.round(rate * 10000) / 100;
  const netUnreachable = netDraft != null && net != null && net !== netDraft;

  const sides: {
    side: PriceSide;
    placeholder: string;
    value: number | null;
    disabled: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onValue: (v: number | null) => void;
    testId: string;
  }[] = [
    {
      side: "listed",
      placeholder: "Giá niêm yết · khách trả",
      value: safePrice > 0 ? safePrice : null,
      disabled: false,
      inputRef: listedRef,
      onValue: (v) => onChange(v ?? 0),
      testId: "customer-pays",
    },
    {
      side: "net",
      placeholder: "Đơn giá · bạn nhận",
      value: netDraft ?? (safePrice > 0 ? net : null),
      // Không có tỉ lệ thì không tính ngược được — khoá thay vì đoán.
      disabled: rate == null,
      inputRef: netRef,
      onValue: (v) => {
        setNetDraft(v);
        onChange(rate == null ? safePrice : computeListedPriceForNet(v ?? 0, rate));
      },
      testId: "seller-receives",
    },
  ];

  return (
    <div className="space-y-1.5" data-testid="seller-pricing-field">
      <label
        className="text-sm font-semibold text-gray-700"
        onClick={() => (active === "net" ? netRef : listedRef).current?.focus()}
      >
        {label}
      </label>

      {/* Rãnh nền xanh (cùng độ đậm với mục đang chọn ở menu Hồ sơ), mảnh đang chọn là viên trắng nổi lên. */}
      <div className="relative z-10 flex rounded-xl border border-primary/20 bg-primary/10 p-1">
        {sides.map((s, index) => {
          const isActive = active === s.side;
          return (
            <Fragment key={s.side}>
              {index === 1 && (
                // Kim chỉ chiều tính: nhập bên nào thì kim chỉ sang bên được TÍNH RA, chữ nhỏ nói bên đó là gì.
                <div
                  aria-hidden
                  className="flex w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 text-primary"
                  data-testid="pricing-direction"
                  data-direction={active === "listed" ? "right" : "left"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={active}
                      initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap text-[10px] font-semibold leading-none"
                    >
                      {active === "listed" ? "bạn nhận được" : "khách sẽ trả"}
                    </motion.span>
                  </AnimatePresence>
                  <motion.span
                    initial={false}
                    animate={{ rotate: active === "listed" ? 0 : 180 }}
                    transition={reduceMotion ? { duration: 0 } : SPRING}
                    className="flex"
                  >
                    <MoveRight size={20} strokeWidth={2.25} />
                  </motion.span>
                </div>
              )}
              <div
                onClick={() => !s.disabled && s.inputRef.current?.focus()}
                title={s.placeholder}
                className={`group relative flex flex-1 items-center gap-1 rounded-lg px-3 py-2 ${
                  s.disabled ? "cursor-not-allowed" : "cursor-text"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : pillId}
                    transition={SPRING}
                    className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-primary/15"
                  />
                )}
                <MoneyInput
                  ref={s.inputRef}
                  value={s.value}
                  onChange={s.onValue}
                  onFocus={() => setActive(s.side)}
                  onBlur={() => s.side === "net" && setNetDraft(null)}
                  disabled={s.disabled}
                  placeholder={s.placeholder}
                  aria-label={s.placeholder}
                  data-testid={s.testId}
                  className={`relative z-10 w-full min-w-0 bg-transparent text-sm outline-none transition-colors placeholder:font-normal ${
                    isActive
                      ? "font-semibold text-gray-900 placeholder:text-gray-400"
                      : "font-medium text-primary placeholder:text-primary/70"
                  }`}
                />
                <span
                  className={`relative z-10 text-xs font-semibold transition-colors ${
                    isActive ? "text-gray-400" : "text-primary/70"
                  }`}
                >
                  đ
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Ngăn kéo: trượt ra từ dưới ô giá, chiều cao co giãn mượt theo ghi chú của mảnh đang chọn. */}
      <div className="relative -mt-3 rounded-b-xl border border-t-0 border-primary/20 bg-primary/5 px-3 pt-5 pb-2.5 text-xs text-gray-700">
        {isLoading ? (
          <p className="flex items-center gap-1.5 text-gray-400">
            <Loader2 size={12} className="animate-spin" /> Đang tải chính sách phí sàn...
          </p>
        ) : isError || rate == null || !policy ? (
          // Không đoán tỉ lệ khi không tải được — hiện số sai còn tệ hơn không hiện.
          <p className="text-amber-600">
            Chưa tải được phí sàn — chỉ nhập được giá niêm yết, số tiền bạn nhận sẽ hiện lại sau.
          </p>
        ) : (
          <>
            <AutoHeight instant={reduceMotion}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={active}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="leading-relaxed text-gray-700"
                  data-testid="pricing-note"
                >
                  {active === "net" ? (
                    <>
                      <b className="text-gray-800">Đơn giá</b> là số tiền bạn thực nhận cho mỗi sản
                      phẩm bán ra, đã trừ phí sàn {ratePct}%.
                      {netUnreachable && (
                        <span className="text-amber-700">
                          {" "}
                          Phí sàn làm tròn tới đồng nên số gần nhất nhận được là{" "}
                          {formatMoneyInput(net ?? 0)}đ.
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <b className="text-gray-800">Giá niêm yết</b> là giá khách thấy trên trang sản
                      phẩm và thanh toán cho một món (chưa gồm phí vận chuyển).
                    </>
                  )}
                </motion.p>
              </AnimatePresence>
            </AutoHeight>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-primary/15 pt-2 text-gray-600">
              <Tooltip
                position="top-left"
                className="max-w-xs whitespace-normal leading-snug"
                content="Phí vận chuyển khách trả riêng; mã freeship do sàn tài trợ, không trừ vào tiền của bạn. Chi phí nền tảng tính trên tổng tiền hàng mỗi đơn nên có thể lệch 1đ so với số theo từng món."
              >
                <span className="flex cursor-help items-center gap-1 decoration-dotted underline-offset-2 hover:underline">
                  Chi phí nền tảng {ratePct}%:{" "}
                  <b className="font-semibold text-primary-dark" data-testid="platform-fee">
                    −{formatMoneyInput(commission)}đ
                  </b>
                  <Info size={11} className="shrink-0 text-gray-400" />
                </span>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
