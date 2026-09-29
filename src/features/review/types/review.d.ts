export interface UserReviewInfo {
  id: string;
  fullName?: string;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  updatedAt: string | null;
  userId: string;
  /** Null khi sản phẩm đã bị xoá cứng. */
  productId: string | null;
  productName?: string | null;
  gardenStoreId?: string | null;
  orderItemId?: string | null;
  /** Biến thể đã mua (chụp ở dòng đơn). */
  variantName?: string | null;
  user?: UserReviewInfo | null;
}

export interface PagedReviews {
  items: Review[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Điểm trung bình + phân bố sao; distribution[0] = số lượt 1 sao. */
export interface RatingSummary {
  average: number;
  count: number;
  distribution: number[];
}

export type ReviewEligibilityStatus =
  | "Reviewable"
  | "Reviewed"
  | "Returned"
  | "NotDelivered"
  | "ProductUnavailable";

export interface ReviewEligibility {
  canReview: boolean;
  /** Null khi user chưa từng mua sản phẩm. */
  status: ReviewEligibilityStatus | null;
  orderItemId: string | null;
}

/** Trạng thái đánh giá của một dòng đơn — modal đánh giá ở trang Đơn hàng. */
export interface ReviewableOrderItem {
  orderItemId: string;
  orderId: string;
  productId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  status: ReviewEligibilityStatus;
  reviewId: string | null;
}

/** Gửi orderItemId (trang Đơn hàng) hoặc productId (trang sản phẩm — BE tự chọn dòng đơn). */
export interface CreateReviewRequest {
  orderItemId?: string;
  productId?: string;
  content: string;
  rating: number;
}

export interface UpdateReviewRequest {
  content: string;
  rating: number;
}

export interface GetReviewsParams {
  productId?: string;
  storeId?: string;
  page?: number;
  pageSize?: number;
}
