import { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  CHAT_SURFACES,
  EFFECT_PRESET_LABELS,
  FLUID_DRIFT_MAX,
  FPS_STEPS,
  applyEffectPreset,
  getActivePreset,
  setChatSurface,
  setEffects,
  useChatSurface,
  useEffectSettings,
  type EffectSettings,
} from "@/utils/appearance";

/** Một lựa chọn trong nhóm nút dạng radio. */
type Choice<T> = { value: T; label: string };

const CLOUD_MODES: ReadonlyArray<Choice<EffectSettings["cloudMode"]>> = [
  { value: "playing", label: "Chạy" },
  { value: "paused", label: "Đứng im" },
  { value: "hidden", label: "Ẩn" },
];

const RAIL_SURFACES: ReadonlyArray<Choice<EffectSettings["railSurface"]>> = [
  { value: "blur", label: "Kính mờ" },
  { value: "tint", label: "Đục màu" },
];

const FLUID_RAILS: ReadonlyArray<Choice<EffectSettings["fluidRail"]>> = [
  { value: "full", label: "Kín màn" },
  { value: "clip", label: "Chừa dải" },
  { value: "stitch", label: "Nối mép" },
];

/** Nhóm nút chọn một-trong-nhiều. `value` là null khi không mục nào khớp. */
function Segmented<T extends string | number>({
  label,
  value,
  choices,
  onChange,
  highlight = false,
}: {
  label: string;
  value: T | null;
  choices: ReadonlyArray<Choice<T>>;
  onChange: (next: T) => void;
  /** Viền sáng để báo "đang ở trạng thái tùy chỉnh". */
  highlight?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-1 rounded-lg bg-neutral-dark/60 p-1 ${
        highlight ? "ring-2 ring-primary" : ""
      }`}
    >
      {choices.map((choice) => {
        const selected = value === choice.value;

        return (
          <button
            key={String(choice.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.value)}
            className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              selected
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-neutral-dark hover:text-text-primary"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Nút gạt.
 *
 * Rãnh lúc TẮT dùng border-dark chứ không phải neutral-dark: cả hàng có
 * hover:bg-neutral-dark, trùng màu thì lúc rê chuột rãnh biến mất, chỉ còn trơ
 * nút tròn.
 */
function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
    >
      <span className="flex-1 text-left">{label}</span>

      <span
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
          on ? "bg-primary" : "bg-border-dark"
        }`}
      >
        <span
          className={`absolute top-0.5 block h-4 w-4 rounded-full bg-neutral shadow transition-transform duration-200 ${
            on ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/** Nhãn nhỏ phía trên mỗi nhóm điều khiển trong phần nâng cao. */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-1.5 text-sm font-medium text-text-secondary">{label}</div>

      {children}

      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-text-secondary/70">{hint}</p> : null}
    </div>
  );
}

/**
 * Cài đặt hiệu ứng — dropdown trên Navbar, giữa Thông báo và tài khoản.
 *
 * Ba mức dựng sẵn ở trên; mọi thứ chi tiết nằm trong "Nâng cao". "Tùy chỉnh"
 * KHÔNG phải một lựa chọn bấm được: chỉnh bất kỳ thứ gì bên trong là cài đặt
 * hiện tại thôi khớp preset nào, nhóm nút bỏ chọn hết và sáng viền xanh.
 */
export default function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const effects = useEffectSettings();
  const chatSurface = useChatSurface();
  const preset = getActivePreset(effects);

  // Bấm ra ngoài / bấm Escape thì đóng.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Cài đặt hiệu ứng"
        className="flex min-w-[36px] cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary sm:min-w-[44px]"
      >
        <SlidersHorizontal size={22} strokeWidth={1.8} />
        <span className="hidden text-[10px] font-medium sm:block sm:text-xs">Hiệu ứng</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Cài đặt hiệu ứng"
          className="nav-dropdown-enter absolute right-0 top-full z-50 flex w-72 flex-col gap-1 rounded-lg bg-white p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
        >
          <Field
            label="Hiệu ứng nền"
            hint={
              preset === null
                ? ""
                : undefined
            }
          >
            <Segmented
              label="Mức hiệu ứng nền"
              value={preset}
              choices={EFFECT_PRESET_LABELS}
              onChange={applyEffectPreset}
              highlight={preset === null}
            />
          </Field>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="flex-1 text-left">Nâng cao</span>

            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-300 ${advanced ? "rotate-180" : ""}`}
            />
          </button>

          {/* Mở/đóng bằng grid-template-rows 0fr→1fr: CSS thuần, không phải đo chiều
              cao, và animate được — khác với `display:none` (thuộc tính rời rạc,
              trình duyệt không nội suy nên panel bật/tắt cụp một cái).
              `inert` chặn tab-focus vào các nút đang bị thu gọn. */}
          <div
            inert={!advanced}
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              advanced ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col divide-y divide-border-light/60 border-t border-border-light/60 pt-1">
                <div className="py-1">
                  <ThemeToggle variant="sidebar" />
                </div>

                <Field
                  label={`Fluid: ${effects.fluidFps === 0 ? "Tắt" : `${effects.fluidFps} FPS`}`}
                >
                  <input
                    type="range"
                    min={0}
                    max={FPS_STEPS.length - 1}
                    step={1}
                    value={Math.max(0, FPS_STEPS.indexOf(effects.fluidFps as never))}
                    onChange={(e) => setEffects({ fluidFps: FPS_STEPS[Number(e.target.value)] })}
                    aria-label="Khung hình mỗi giây của lớp fluid"
                    className="w-full cursor-pointer accent-primary"
                  />
                </Field>

                <Field
                  label={`Fluid frequency: ${
                    effects.fluidDrift === 0 ? "Tắt" : `${effects.fluidDrift}/${FLUID_DRIFT_MAX}`
                  }`}
                >
                  <input
                    type="range"
                    min={0}
                    max={FLUID_DRIFT_MAX}
                    step={1}
                    value={effects.fluidDrift}
                    onChange={(e) => setEffects({ fluidDrift: Number(e.target.value) })}
                    aria-label="Cường độ fluid trôi nổi ngẫu nhiên"
                    className="w-full cursor-pointer accent-primary"
                  />
                </Field>

                <Field
                  label="Fluid sau dải nội dung"
                  hint="Nối mép: bỏ hẳn phần giữa khỏi lưới nên rẻ hơn, đổi lại sóng hất vào mép trái sẽ bật ra ở mép phải ngay lập tức."
                >
                  <Segmented
                    label="Fluid sau dải nội dung"
                    value={effects.fluidRail}
                    choices={FLUID_RAILS}
                    onChange={(fluidRail) => setEffects({ fluidRail })}
                  />
                </Field>

                <Field label="Mảng mây">
                  <Segmented
                    label="Mảng mây"
                    value={effects.cloudMode}
                    choices={CLOUD_MODES}
                    onChange={(cloudMode) => setEffects({ cloudMode })}
                  />
                </Field>

                <Field
                  label="Dải nội dung"
                  hint="Kính mờ đẹp nhất nhưng đắt nhất: mỗi khung hình là một lượt làm mờ gần kín màn."
                >
                  <Segmented
                    label="Chất liệu dải nội dung"
                    value={effects.railSurface}
                    choices={RAIL_SURFACES}
                    onChange={(railSurface) => setEffects({ railSurface })}
                  />
                </Field>

                <Field label="Nền khung chat AI">
                  <Segmented
                    label="Chất liệu nền khung chat AI"
                    value={chatSurface}
                    choices={CHAT_SURFACES}
                    onChange={setChatSurface}
                  />
                </Field>

                <div className="py-1">
                  <Toggle
                    label="Hiệu ứng rê chuột"
                    on={effects.hoverEffects}
                    onChange={(hoverEffects) => setEffects({ hoverEffects })}
                  />

                  <Toggle
                    label="Chuyển cảnh giữa trang"
                    on={effects.pageTransition}
                    onChange={(pageTransition) => setEffects({ pageTransition })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
