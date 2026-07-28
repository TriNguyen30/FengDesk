import fetchHttpClient from "@/lib/httpClient";
import { ApiResponse } from "@/types/api";
import {
  AdminUser,
  AdminPaginatedResponse,
  UpdateUserRolesPayload,
  UpdateUserStatusPayload,
  AdminUserAuditLog,
} from "../types/adminUser";

export const adminUsersApi = {
  getUsers: (params: { page?: number; pageSize?: number; search?: string; role?: string; name?: string; email?: string; }) => {
    return fetchHttpClient.get<ApiResponse<AdminPaginatedResponse<AdminUser>>>("/admin/users", params);
  },

  getUserById: (id: string) => {
    return fetchHttpClient.get<ApiResponse<AdminUser>>(`/admin/users/${id}`);
  },

  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) => {
    return fetchHttpClient.patch<ApiResponse<boolean>>(`/admin/users/${id}/status`, payload);
  },

  updateUserRoles: (id: string, payload: UpdateUserRolesPayload) => {
    return fetchHttpClient.put<ApiResponse<boolean>>(`/admin/users/${id}/roles`, payload);
  },

  revokeUserSessions: (id: string) => {
    return fetchHttpClient.post<ApiResponse<boolean>>(`/admin/users/${id}/revoke-sessions`);
  },

  getUserAuditLogs: (id: string) => {
    return fetchHttpClient.get<ApiResponse<AdminPaginatedResponse<AdminUserAuditLog>>>(`/admin/users/${id}/audit-logs`);
  },
};
