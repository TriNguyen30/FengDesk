import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ShoppingBag, XCircle, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../hooks/useNotifications";
import type { NotificationItem } from "../types/notification";
import { formatRelativeTime } from "@/utils/date";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { unreadCount } = useUnreadCount();
  const { notifications, status } = useNotificationsList({ page: 1, pageSize: 20, enabled: open });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

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
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, close]);

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsReadMutation.mutateAsync(item.id);
    }
    close();

    // Navigate based on type
    if (item.referenceType === "Order" && item.referenceId) {
      navigate(`/profile/orders/${item.referenceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "OrderPlaced":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShoppingBag size={18} />
          </div>
        );
      case "OrderCancelled":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <XCircle size={18} />
          </div>
        );
      case "OrderConfirmed":
      case "OrderShipped":
      case "OrderDelivered":
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Package size={18} />
          </div>
        );
      default:
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600">
            <Bell size={18} />
          </div>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes notification-dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes notification-dropdown-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
        }
        .notification-dropdown-enter {
          animation: notification-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top right;
        }
        .notification-dropdown-exit {
          animation: notification-dropdown-out 0.15s ease-in both;
          transform-origin: top right;
        }
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.9;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite ease-in-out;
        }
      `}</style>

      <div ref={rootRef} className="relative group" onMouseEnter={open_} onMouseLeave={close}>
        <button
          type="button"
          onClick={() => {
            close();
            navigate("/profile/notifications");
          }}
          className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer relative"
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={`Thông báo, ${unreadCount} tin chưa đọc`}
        >
          <div className="relative flex size-[22px] items-center justify-center">
            <Bell size={20} strokeWidth={1.8} className={unreadCount > 0 ? "text-gray-900" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-white animate-pulse-slow tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <span className="hidden text-[10px] font-medium sm:block sm:text-xs">Thông báo</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 pt-2">
            <div
              role="dialog"
              aria-label="Thông báo của bạn"
              className={`w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96 ${closing ? "notification-dropdown-exit" : "notification-dropdown-enter"
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
                <h2 className="text-sm font-bold text-gray-950">Thông báo</h2>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <Check size={14} />
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {/* List */}
              <div className="custom-scrollbar max-h-[26rem] overflow-y-auto divide-y divide-gray-100">
                {status === "loading" && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="mt-2 text-xs">Đang tải thông báo...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-gray-500">
                    <div className="flex size-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                      <Bell size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Chưa có thông báo nào</p>
                    <p className="text-xs text-gray-400">
                      Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer outline-none hover:bg-gray-50/80 ${!item.isRead ? "bg-primary/[0.02] hover:bg-primary/[0.04]" : ""
                        }`}
                    >
                      {getNotificationIcon(item.type)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs sm:text-sm leading-tight text-gray-900 ${!item.isRead ? "font-semibold" : "font-medium"
                              }`}
                          >
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="size-2 shrink-0 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 leading-snug">
                          {item.message}
                        </p>
                        <p className="mt-1.5 text-[10px] font-medium text-gray-400">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
