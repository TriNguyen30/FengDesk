import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Store,
  LayoutDashboard,
  ChevronDown,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useAppSelector } from "@/app/store";
import { useHasSellerWorkspaceAccess } from "@/features/shop/hooks/useShopStaff";
import {
  getRoles,
  getVisibleWorkspaces,
  WORKSPACES,
  setLastWorkspace,
  type WorkspaceDef,
  type WorkspaceKey,
} from "@/lib/workspace";

const ICONS: Record<WorkspaceKey, LucideIcon> = {
  shop: ShoppingBag,
  seller: Store,
  admin: LayoutDashboard,
};

/** Switcher "Đổi khu" — chỉ hiện các khu user có quyền, và chỉ render khi có >1 khu. */
export default function WorkspaceSwitcher() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { hasSellerWorkspaceAccess } = useHasSellerWorkspaceAccess(!!user);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roles = getRoles(user);
  const baseVisible = getVisibleWorkspaces(roles);
  const sellerWorkspace = WORKSPACES.find((w) => w.key === "seller");
  const visible =
    hasSellerWorkspaceAccess && sellerWorkspace && !baseVisible.some((w) => w.key === "seller")
      ? [...baseVisible.filter((w) => w.key !== "seller"), sellerWorkspace]
      : baseVisible;

  if (!user || visible.length <= 1) return null;

  const currentKey: WorkspaceKey = location.pathname.startsWith("/manager")
    ? "admin"
    : location.pathname.startsWith("/seller")
      ? "seller"
      : "shop";
  const current = visible.find((w) => w.key === currentKey) ?? visible[0];
  const CurrentIcon = ICONS[current.key];

  const go = (w: WorkspaceDef) => {
    setLastWorkspace(w.key);
    setOpen(false);
    navigate(w.route);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary cursor-pointer"
        aria-label="Đổi khu làm việc"
      >
        <CurrentIcon size={18} strokeWidth={1.8} />
        <span className="hidden text-xs font-semibold md:block">{current.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
          <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Đổi khu làm việc
            </p>
          </div>
          <div className="flex flex-col gap-1 p-1">
            {visible.map((w) => {
              const Icon = ICONS[w.key];
              const active = w.key === current.key;

              return (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => go(w)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${active
                      ? "bg-primary/5 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon size={16} />

                  <span className="flex-1">{w.label}</span>

                  {active && <Check size={15} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
