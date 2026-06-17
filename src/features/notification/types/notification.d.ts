import { ApiResponse } from "@/types/api";

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  pageSize?: number;
}

export type GetNotificationsResponse = ApiResponse<PaginatedData<NotificationItem>>;
export type GetUnreadCountResponse = ApiResponse<number>;
export type MarkAsReadResponse = ApiResponse<NotificationItem>;
export type MarkAllAsReadResponse = ApiResponse<any>;
