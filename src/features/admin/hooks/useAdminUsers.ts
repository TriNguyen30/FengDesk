import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi } from "../api/adminUsers.api";
import { UpdateUserRolesPayload, UpdateUserStatusPayload } from "../types/adminUser";

export const adminQueryKeys = {
  all: ["adminUsers"] as const,
  lists: () => [...adminQueryKeys.all, "list"] as const,
  list: (params: any) => [...adminQueryKeys.lists(), params] as const,
  details: () => [...adminQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...adminQueryKeys.details(), id] as const,
  auditLogs: (id: string) => [...adminQueryKeys.detail(id), "auditLogs"] as const,
};

export function useAdminUsers(params: { page?: number; pageSize?: number; search?: string; role?: string; name?: string; email?: string; }) {
  return useQuery({
    queryKey: adminQueryKeys.list(params),
    queryFn: async () => {
      const response = await adminUsersApi.getUsers(params);
      return response.data;
    },
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.detail(id!),
    queryFn: async () => {
      const response = await adminUsersApi.getUserById(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useAdminUserAuditLogs(id: string | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.auditLogs(id!),
    queryFn: async () => {
      const response = await adminUsersApi.getUserAuditLogs(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusPayload }) => 
      adminUsersApi.updateUserStatus(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.lists() });
    },
  });
}

export function useUpdateAdminUserRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRolesPayload }) => 
      adminUsersApi.updateUserRoles(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.lists() });
    },
  });
}

export function useRevokeAdminUserSessions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.revokeUserSessions(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.detail(variables) });
    },
  });
}
