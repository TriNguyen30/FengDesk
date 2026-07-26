import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  ShoppingBag,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../hooks/useNotifications";
import type { NotificationItem } from "../types/notification";
import { formatRelativeTime } from "@/utils/date";
import { useTranslation } from "react-i18next";

export default function NotificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { notifications, pagination, status } = useNotificationsList({ page, pageSize });
  const { unreadCount } = useUnreadCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsReadMutation.mutateAsync(item.id);
    }

    if (item.referenceType === "Order" && item.referenceId) {
      navigate(`/profile/orders/${item.referenceId}`);
    } else if (item.referenceType === "StaffInvitation") {
      // Deep-link cho cả 3 loại (invited/accepted/rejected): về trang lời mời của tôi.
      navigate("/profile/invitations");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast.success(t("notification.toast.mark_all_success"));
    } catch (error) {
      toast.error(t("notification.toast.mark_all_error"));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "OrderPlaced":
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShoppingBag size={24} />
          </div>
        );
      case "OrderCancelled":
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <XCircle size={24} />
          </div>
        );
      case "OrderConfirmed":
      case "OrderShipped":
      case "OrderDelivered":
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Package size={24} />
          </div>
        );
      case "StaffInvited":
      case "StaffInvitationAccepted":
      case "StaffInvitationRejected":
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail size={24} />
          </div>
        );
      default:
        return (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600">
            <Bell size={24} />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("notification.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("notification.unread_count_1")}<span className="font-semibold text-primary">{unreadCount}</span>{t("notification.unread_count_2")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Check size={16} />
            {t("notification.mark_all_read")}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {status === "loading" && notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="mt-3 text-sm">{t("notification.loading")}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <Bell size={32} strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-gray-700">{t("notification.empty.title")}</p>
            <p className="text-sm text-gray-400 max-w-sm text-center">
              {t("notification.empty.desc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNotificationClick(item)}
                className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 ${!item.isRead
                    ? "border-primary/20 bg-primary/[0.02]"
                    : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
              >
                {getNotificationIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-base leading-snug text-gray-900 ${!item.isRead ? "font-bold" : "font-semibold"
                        }`}
                    >
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-gray-400 mt-0.5">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{item.message}</p>
                </div>
                {!item.isRead && (
                  <div className="self-center ml-2">
                    <span className="block h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t("notification.pagination.prev")}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${page === pageNum ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={t("notification.pagination.next")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
