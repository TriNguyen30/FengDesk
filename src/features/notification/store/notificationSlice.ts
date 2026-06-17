import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { notificationApi } from "../api/notificationApi";
import type { GetNotificationsParams, NotificationItem } from "../types/notification";

type LoadingStatus = "idle" | "loading" | "failed";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  status: LoadingStatus;
  unreadCountStatus: LoadingStatus;
  markStatus: LoadingStatus;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
  status: "idle",
  unreadCountStatus: "idle",
  markStatus: "idle",
};

export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (params: GetNotificationsParams = {}) => {
    const response = await notificationApi.getNotifications(params);
    return response.data;
  },
);

export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async () => {
    const response = await notificationApi.getUnreadCount();
    return response.data;
  },
);

export const markNotificationAsRead = createAsyncThunk(
  "notification/markNotificationAsRead",
  async (id: string) => {
    const response = await notificationApi.markAsRead(id);
    return { id, data: response.data };
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notification/markAllNotificationsAsRead",
  async () => {
    const response = await notificationApi.markAllAsRead();
    return response.data;
  },
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
      state.page = 1;
      state.totalCount = 0;
      state.totalPages = 0;
      state.status = "idle";
      state.unreadCountStatus = "idle";
      state.markStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications List
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "idle";
        if (action.payload.isSuccess && action.payload.data) {
          const paginated = action.payload.data;
          state.notifications = paginated.items;
          state.page = paginated.page;
          state.pageSize = paginated.pageSize;
          state.totalCount = paginated.totalCount;
          state.totalPages = paginated.totalPages;
        }
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "failed";
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadCountStatus = "loading";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCountStatus = "idle";
        if (action.payload.isSuccess && typeof action.payload.data === "number") {
          state.unreadCount = action.payload.data;
        }
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.unreadCountStatus = "failed";
      })

      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markStatus = "loading";
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markStatus = "idle";
        const { id, data } = action.payload;
        if (data.isSuccess) {
          const item = state.notifications.find((n) => n.id === id);
          if (item && !item.isRead) {
            item.isRead = true;
            item.readAt = new Date().toISOString();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markNotificationAsRead.rejected, (state) => {
        state.markStatus = "failed";
      })

      // Mark All as Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markStatus = "loading";
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.markStatus = "idle";
        if (action.payload.isSuccess) {
          state.notifications.forEach((item) => {
            if (!item.isRead) {
              item.isRead = true;
              item.readAt = new Date().toISOString();
            }
          });
          state.unreadCount = 0;
        }
      })
      .addCase(markAllNotificationsAsRead.rejected, (state) => {
        state.markStatus = "failed";
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state: RootState) => state.notification.notifications;
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount;
export const selectNotificationsStatus = (state: RootState) => state.notification.status;
export const selectNotificationsPagination = (state: RootState) => ({
  page: state.notification.page,
  pageSize: state.notification.pageSize,
  totalCount: state.notification.totalCount,
  totalPages: state.notification.totalPages,
});
