export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

export interface Shop {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  /** Chỉ có ở /stores/mine: true = user là owner store này, false = chỉ là nhân viên (Accepted). */
  isOwner?: boolean;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopDto {
  name: string;
  description?: string;
  hotline: string;
  openingHours?: string;
  // Self-service: owner = người đang đăng nhập. Các field dưới BE đã bỏ qua (giữ optional cho tương thích cũ).
  ownerUserId?: string;
  isActive?: boolean;
  address?: string;
}

export interface UpdateShopDto {
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
}

/**
 * Địa chỉ cửa hàng = điểm lấy hàng (pickup). Khớp hợp đồng BE StoreAddressResponse —
 * KHÔNG có recipientName/recipientPhone/isDefault/label (khác địa chỉ customer).
 */
export interface StoreAddress {
  id: string;
  storeId: string;
  wardId: string;
  streetAddress: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface CreateStoreAddressDto {
  wardId: string;
  streetAddress: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type UpdateStoreAddressDto = CreateStoreAddressDto;

/** Trạng thái lời mời — khớp BE enum InvitationStatus (stored as string). */
export type InvitationStatus = "Pending" | "Accepted" | "Rejected" | "Revoked";

/**
 * Bản ghi phân công nhân sự cho store.
 *
 * BE hiện mô tả theo assignment:
 * - gardenStoreId: cửa hàng nào
 * - staffId: user nào
 * - assignedBy: ai phân công
 * - isActive: còn đang làm hay đã gỡ
 * - assignedAt / unassignedAt: thời điểm bắt đầu/kết thúc
 *
 * Một số màn hình cũ vẫn đang đọc thêm các field invite/status, nên giữ optional fallback.
 */
export interface StoreStaff {
  id: string;
  gardenStoreId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffPhone?: string | null;
  assignedBy: string;
  assignedByName?: string | null;
  isActive: boolean;
  assignedAt: string;
  unassignedAt?: string | null;
  invitedBy?: string;
  invitedByName?: string | null;
  status?: InvitationStatus;
  invitedAt?: string;
  respondedAt?: string | null;
}

/** Mời nhân viên — FE mới dùng staffId (từ user search); email chỉ giữ để tương thích. */
export interface AssignStaffDto {
  staffId?: string;
  staffEmail?: string;
}

/** Lời mời gửi cho user hiện tại (MyInvitationsPage). */
export interface StoreInvitation {
  id: string;
  gardenStoreId: string;
  storeName: string;
  invitedBy: string;
  invitedByName?: string | null;
  status: InvitationStatus;
  invitedAt: string;
}

/** Kết quả /api/users/search — field công khai tối thiểu. */
export interface UserSearchItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

/** GET /stores/{id}/membership — vai trò của user hiện tại với store (nguồn sự thật cho tab/quyền FE). */
export interface StoreMembership {
  isPrimaryOwner: boolean;
  isOwner: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  canManage: boolean;
}

/** GET /stores/{id}/statistics — chỉ owner/admin. */
export interface StoreStatistics {
  totalRevenue: number;
  totalShippingFee: number;
  totalDeliveries: number;
  deliveriesByStatus: Record<string, number>;
  productCount: number;
  staffCount: number;
  revenueByMonth: MonthlyRevenuePoint[];
}

export interface MonthlyRevenuePoint {
  year: number;
  month: number;
  revenue: number;
  deliveredCount: number;
}
