import fetchHttpClient from "@/lib/httpClient";
import type {
  GetNotificationsParams,
  GetNotificationsResponse,
  GetUnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
} from "../types/notification";

export const notificationApi = {
  getNotifications: (params?: GetNotificationsParams) =>
    fetchHttpClient.get<GetNotificationsResponse>("/notifications", params),

  getUnreadCount: () =>
    fetchHttpClient.get<GetUnreadCountResponse>("/notifications/unread-count"),

  markAsRead: (id: string) =>
    fetchHttpClient.patch<MarkAsReadResponse>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    fetchHttpClient.patch<MarkAllAsReadResponse>("/notifications/read-all"),
};
