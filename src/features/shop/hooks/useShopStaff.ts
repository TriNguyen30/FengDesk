import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShopStaffRequest,
  addShopStaffRequest,
  removeShopStaffRequest,
  getMyStoreInvitationsRequest,
  acceptStoreInvitationRequest,
  rejectStoreInvitationRequest,
  getMyShopsRequest,
} from "@/features/shop/api/shop.api";
import type { AssignStaffDto } from "@/features/shop/types/shop";
import { useAppDispatch } from "@/app/store";
import {
  fetchNotifications,
  fetchUnreadCount,
} from "@/features/notification/store/notificationSlice";

const STAFF_KEY = (storeId: string) => ["shop-staff", storeId] as const;
const MY_INVITATIONS_KEY = ["my-store-invitations"] as const;

export function useShopStaff(storeId?: string) {
  const query = useQuery({
    queryKey: STAFF_KEY(storeId ?? ""),
    queryFn: async () => {
      if (!storeId) throw new Error("storeId required");
      const res = await getShopStaffRequest(storeId);
      if (!res.isSuccess) throw new Error(res.message || "Không thể tải nhân viên");
      return res.data ?? [];
    },
    enabled: !!storeId,
  });

  return {
    staff: query.data ?? [],
    status: query.status,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAssignShopStaff(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignStaffDto) => addShopStaffRequest(storeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY(storeId) });
    },
  });
}

export function useRemoveShopStaff(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => removeShopStaffRequest(storeId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEY(storeId) });
    },
  });
}

// ===== Invitations gửi cho user hiện tại =====

export function useMyStoreInvitations(enabled = true) {
  const query = useQuery({
    queryKey: MY_INVITATIONS_KEY,
    queryFn: async () => {
      const res = await getMyStoreInvitationsRequest();
      if (!res.isSuccess) throw new Error(res.message || "Không thể tải lời mời");
      return res.data ?? [];
    },
    enabled,
  });
  return {
    invitations: query.data ?? [],
    status: query.status,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Quyền vào khu người bán = có ≥1 store trong /stores/mine.
 * Nguồn sự thật: BE GetForUserAsync (owner HOẶC garden staff đã Accepted) — KHÔNG suy từ
 * endpoint lời mời (chỉ trả Pending, biến mất sau khi Accept).
 */
export function useHasSellerWorkspaceAccess(enabled = true) {
  const query = useQuery({
    queryKey: ["my-shops"],
    queryFn: async () => {
      const res = await getMyShopsRequest();
      if (!res.isSuccess) throw new Error(res.message || "Không thể tải cửa hàng");
      return res.data ?? [];
    },
    enabled,
  });
  const shops = query.data ?? [];
  return {
    hasSellerWorkspaceAccess: shops.length > 0,
    shops,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useAcceptStoreInvitation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (assignmentId: string) => acceptStoreInvitationRequest(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_INVITATIONS_KEY });
      // Notification dùng Redux (không TanStack) — refresh qua dispatch để badge unread giảm ngay.
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ page: 1, pageSize: 20 }));
    },
  });
}

export function useRejectStoreInvitation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (assignmentId: string) => rejectStoreInvitationRequest(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_INVITATIONS_KEY });
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications({ page: 1, pageSize: 20 }));
    },
  });
}
