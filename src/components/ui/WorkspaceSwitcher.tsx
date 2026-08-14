import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Store,
  ChevronDown,
  Check,
  Shield,
  LayoutDashboard,
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
import { useTranslation } from "react-i18next";

const ICONS: Record<WorkspaceKey, LucideIcon> = {
  shop: ShoppingBag,
  seller: Store,
  management: LayoutDashboard,
  admin: Shield,
};

/** Switcher "Đổi khu" — chỉ hiện các khu user có quyền, và chỉ render khi có >1 khu. */
export default function WorkspaceSwitcher() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { hasSellerWorkspaceAccess } = useHasSellerWorkspaceAccess(!!user);
  const { t } = useTranslation();

  const close = useCallback(() => {
    setClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  const open_ = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setClosing(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, close]);

  const roles = getRoles(user);
  const baseVisible = getVisibleWorkspaces(roles);
  const sellerWorkspace = WORKSPACES.find((w) => w.key === "seller");
  const visible =
    hasSellerWorkspaceAccess && sellerWorkspace && !baseVisible.some((w) => w.key === "seller")
      ? [...baseVisible.filter((w) => w.key !== "seller"), sellerWorkspace]
      : baseVisible;

  if (!user || visible.length <= 1) return null;

  const currentKey: WorkspaceKey =
    location.pathname.startsWith("/admin")
      ? "admin"
      : location.pathname.startsWith("/manager")
        ? "management"
        : location.pathname.startsWith("/seller")
          ? "seller"
          : "shop";
  const current = visible.find((w) => w.key === currentKey) ?? visible[0];
  const CurrentIcon = ICONS[current.key];

  const go = (w: WorkspaceDef) => {
    setLastWorkspace(w.key);
    close();
    navigate(w.route);
  };

  return (
    <>
      <style>{`
        @keyframes workspace-dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes workspace-dropdown-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
        }
        .workspace-dropdown-enter {
          animation: workspace-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top right;
        }
        .workspace-dropdown-exit {
          animation: workspace-dropdown-out 0.15s ease-in both;
          transform-origin: top right;
        }
      `}</style>

      <div
        className="relative group"
        ref={ref}
        onMouseEnter={open_}
        onMouseLeave={close}
      >
        <button
          type="button"
          onClick={() => {
            if (open) close();
            else open_();
          }}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary cursor-pointer"
          aria-label={t("workspace.switch")}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <CurrentIcon size={18} strokeWidth={1.8} />
          <span className="hidden text-xs font-semibold md:block">{t(`workspace.roles.${current.key}`)}</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 pt-1">
            <div
              className={`w-52 overflow-hidden rounded-lg bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] ring-1 ring-black/5 ${closing ? "workspace-dropdown-exit" : "workspace-dropdown-enter"
                }`}
            >
              <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("workspace.switch")}
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
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      <Icon size={16} />

                      <span className="flex-1">{t(`workspace.roles.${w.key}`)}</span>

                      {active && <Check size={15} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
