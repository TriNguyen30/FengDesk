import { useState } from "react";
import { ChevronDown, Cloud, Settings, Waves } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  FLUID_DRIFT_MAX,
  setClouds,
  setFluidDrift,
  useClouds,
  useFluidDrift,
} from "@/utils/appearance";

const rowClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-neutral-dark hover:text-text-primary";

/** Khối cài đặt giao diện dạng expand trong sidebar Hồ sơ. */
export default function AppearanceSettings() {
  const [open, setOpen] = useState(false);
  const clouds = useClouds();
  const drift = useFluidDrift();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="appearance-settings-panel"
        className={rowClass}
      >
        <Settings size={18} />

        <span className="flex-1 text-left">Cài đặt giao diện</span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="appearance-settings-panel"
        className={`flex flex-col gap-1 rounded-lg bg-neutral-dark/40 p-1 ${open ? "mt-1" : "hidden"}`}
      >
        <ThemeToggle variant="sidebar" />

        <button type="button" onClick={() => setClouds(!clouds)} className={rowClass}>
          <Cloud size={18} />

          <span className="flex-1 text-left">Mảng mây</span>

          <span
            className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              clouds ? "bg-primary" : "bg-neutral-dark"
            }`}
          >
            <span
              className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                clouds ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>

        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
            <Waves size={18} />

            <span className="flex-1">Fluid trôi nổi</span>

            <span className="text-xs font-semibold text-text-primary">
              {drift === 0 ? "Tắt" : `${drift}/${FLUID_DRIFT_MAX}`}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={FLUID_DRIFT_MAX}
            step={1}
            value={drift}
            onChange={(e) => setFluidDrift(Number(e.target.value))}
            aria-label="Cường độ fluid trôi nổi ngẫu nhiên"
            className="mt-2 w-full cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
