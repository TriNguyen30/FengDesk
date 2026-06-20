import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/features/products/types/product";
import type {
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
  GetReviewsParams,
} from "../types/review";

export async function getReviewsRequest(params?: GetReviewsParams) {
  const { data } = await fetchHttpClient.get<ApiResponse<Review[]>>("/Review", params);
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
