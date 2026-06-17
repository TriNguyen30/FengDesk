import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsStatus,
  selectNotificationsPagination,
} from "../store/notificationSlice";
import type { GetNotificationsParams } from "../types/notification";

export function useNotifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const status = useAppSelector(selectNotificationsStatus);
  const pagination = useAppSelector(selectNotificationsPagination);

  const getNotifications = useCallback(
    (params?: GetNotificationsParams) => {
      return dispatch(fetchNotifications(params));
    },
    [dispatch],
  );

  const getUnreadCount = useCallback(() => {
    return dispatch(fetchUnreadCount());
  }, [dispatch]);

  const markAsRead = useCallback(
    (id: string) => {
      return dispatch(markNotificationAsRead(id));
    },
    [dispatch],
  );

  const markAllAsRead = useCallback(() => {
    return dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const resetNotifications = useCallback(() => {
    return dispatch(clearNotifications());
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    status,
    pagination,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    resetNotifications,
  };
}
