import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/features/products/types/product";
import type {
  Review,
  PagedReviews,
  RatingSummary,
  ReviewEligibility,
  ReviewableOrderItem,
  CreateReviewRequest,
  UpdateReviewRequest,
  GetReviewsParams,
} from "../types/review";

export async function getReviewsRequest(params?: GetReviewsParams) {
  const { data } = await fetchHttpClient.get<ApiResponse<PagedReviews>>("/Review", params);
  return data;
}

/** Điểm trung bình + phân bố sao — truyền ĐÚNG MỘT trong productId / storeId. */
export async function getRatingSummaryRequest(params: { productId?: string; storeId?: string }) {
  const { data } = await fetchHttpClient.get<ApiResponse<RatingSummary>>("/Review/summary", params);
  return data;
}

/** User hiện tại có được đánh giá sản phẩm này không (cần đăng nhập). */
export async function getReviewEligibilityRequest(productId: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<ReviewEligibility>>("/Review/eligibility", {
    productId,
  });
  return data;
}

/** Trạng thái đánh giá từng dòng của một đơn của chính user. */
export async function getReviewableOrderItemsRequest(orderId: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<ReviewableOrderItem[]>>(
    `/Review/orders/${orderId}/items`,
  );
  return data;
}

export async function createReviewRequest(payload: CreateReviewRequest) {
  const { data } = await fetchHttpClient.post<ApiResponse<Review>>("/Review", payload);
  return data;
}

export async function getMyReviewsRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<Review[]>>("/Review/my");
  return data;
}

export async function updateReviewRequest(id: string, payload: UpdateReviewRequest) {
  const { data } = await fetchHttpClient.put<ApiResponse<Review>>(`/Review/${id}`, payload);
  return data;
}

export async function deleteReviewRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(`/Review/${id}`);
  return data;
}
