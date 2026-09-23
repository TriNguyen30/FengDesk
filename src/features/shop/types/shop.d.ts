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
  /** Delivery chưa xong việc (Pending/Confirmed/Preparing/Shipped) — đã có đơn, chưa tới tay khách. */
  activeDeliveries: number;
  /** Giá trị hàng của các delivery đang xử lý — doanh thu sắp về. */
  activeDeliveriesValue: number;
  /** Đơn online khách đã đặt nhưng CHƯA thanh toán (chưa có delivery) có hàng của store. */
  awaitingPaymentOrders: number;
  awaitingPaymentValue: number;
  productCount: number;
  staffCount: number;
  revenueByMonth: MonthlyRevenuePoint[];
  /** Mốc thời gian BE đã áp (`week|month|quarter|year`). */
  range?: string;
  /** Doanh thu theo mốc của `range`; mốc rỗng vẫn có mặt để biểu đồ không hụt cột. */
  revenueSeries?: RevenueBucket[];
  /** Sản phẩm trong các đơn kèm trạng thái tiền (`Ordered|Paid|Completed|Refunded`). */
  itemsByStatus?: StoreStatisticsItemRow[];
  /** Phí ship theo cùng bộ trạng thái — phí thuộc về đơn nên không chia xuống từng sản phẩm. */
  shippingFeeByStatus?: Record<string, number>;
  /** Số ngày giữ tiền sau khi giao xong (chính sách sàn). */
  payoutHoldDays?: number;
  /** Tiền hàng đã qua khoảng giữ — có thể yêu cầu chi. */
  availableForPayoutValue?: number;
  /** Đã giao nhưng chưa hết khoảng giữ. */
  pendingClearanceValue?: number;
  /** Công nợ chưa miễn, sẽ trừ vào kỳ chi kế tiếp. */
  outstandingLiabilityValue?: number;
}

/**
 * Một cột biểu đồ: 4 lớp theo **mức chắc chắn của tiền** (đặt chưa trả → đã trả đang giao → xong →
 * hoàn tiền). Mỗi lớp bucket theo mốc riêng của nó, nên tổng một cột là "tiền phát sinh trong mốc",
 * không phải doanh thu của mốc.
 */
export interface RevenueBucket {
  /** Đầu mốc (ISO, UTC). */
  start: string;
  /** Nhãn đã dựng sẵn ở BE, vd "12/09", "Tuần 08/09", "Th 09". */
  labelVi: string;
  /** = `completed`; giữ tên cũ cho client cũ. */
  revenue: number;
  deliveredCount: number;
  awaitingPayment?: number;
  awaitingPaymentCount?: number;
  inProgress?: number;
  inProgressCount?: number;
  completed?: number;
  completedCount?: number;
  refunded?: number;
  refundedCount?: number;
}

export interface StoreStatisticsItemRow {
  productId: string;
  productName: string;
  /** `Ordered` | `Paid` | `Completed` | `Refunded` — mã BE, FE dịch khi hiển thị. */
  status: string;
  quantity: number;
  value: number;
  /** Phí ship của đơn, phân bổ cho dòng này theo tỉ trọng tiền hàng (BE tính). */
  shippingFee?: number;
  /** Số đơn đang chứa sản phẩm này. */
  orderCount: number;
}

export interface MonthlyRevenuePoint {
  year: number;
  month: number;
  revenue: number;
  deliveredCount: number;
}
