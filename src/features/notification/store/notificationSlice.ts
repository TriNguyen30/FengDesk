import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationApi } from "../api/notificationApi";
import type {
  NotificationItem,
  GetNotificationsParams,
  PaginatedData,
} from "../types/notification";

interface NotificationState {
  notifications: PaginatedData<NotificationItem> | null;
  unreadCount: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: NotificationState = {
  notifications: null,
  unreadCount: 0,
  status: "idle",
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (params: GetNotificationsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  },
);

export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      const data = response.data.data as any;
      return typeof data === "number" ? data : data?.unreadCount || 0;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch unread count");
    }
  },
);

export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark as read");
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark all as read");
    }
  },
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // markAsRead
      .addCase(markAsRead.fulfilled, (state, action) => {
        if (state.notifications) {
          const item = state.notifications.items.find((i) => i.id === action.payload.id);
          if (item && !item.isRead) {
            item.isRead = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        } else {
          // If notifications are not fetched but we just marked as read, decrease count
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // markAllAsRead
      .addCase(markAllAsRead.fulfilled, (state) => {
        if (state.notifications) {
          state.notifications.items.forEach((item) => {
            item.isRead = true;
          });
        }
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
