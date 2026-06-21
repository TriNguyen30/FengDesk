import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../store/notificationSlice";
import type { GetNotificationsParams } from "../types/notification";

export function useNotificationsList(params?: GetNotificationsParams & { enabled?: boolean }) {
  const dispatch = useAppDispatch();
  const { notifications, status } = useAppSelector((state) => state.notification);

  const { enabled = true, ...queryParams } = params || {};

  // Simple stringify to detect changes in queryParams for the dependency array
  const queryParamsString = JSON.stringify(queryParams);

  useEffect(() => {
    if (enabled) {
      dispatch(fetchNotifications(queryParams));
    }
  }, [dispatch, enabled, queryParamsString]);

  return {
    notifications: notifications ? notifications.items : [],
    pagination: {
      page: notifications ? notifications.page : 1,
      pageSize: notifications ? notifications.pageSize : 10,
      totalCount: notifications ? notifications.totalCount : 0,
      totalPages: notifications ? notifications.totalPages : 0,
    },
    status,
  };
}

export function useUnreadCount() {
  const dispatch = useAppDispatch();
  const { unreadCount } = useAppSelector((state) => state.notification);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 60000); // Auto refresh every minute
    return () => clearInterval(interval);
  }, [dispatch]);

  return {
    unreadCount,
  };
}

export function useMarkNotificationAsRead() {
  const dispatch = useAppDispatch();

  return {
    mutateAsync: (id: string) => dispatch(markAsRead(id)).unwrap(),
  };
}

export function useMarkAllNotificationsAsRead() {
  const dispatch = useAppDispatch();

  return {
    mutateAsync: () => dispatch(markAllAsRead()).unwrap(),
  };
}
