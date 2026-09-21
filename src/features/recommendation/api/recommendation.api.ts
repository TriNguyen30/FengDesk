import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type {
  PersonalFitResponse,
  ProductFitResponse,
  ProductOccupationFitResponse,
  WorkspaceRecommendationPreview,
} from "../types/recommendation";

export const getProductFit = async (
  productId: string,
  workspaceProfileId: string,
): Promise<ProductFitResponse> => {
  const response = await fetchHttpClient.get<ApiResponse<ProductFitResponse>>(
    "/recommendations/fit",
    { productId, workspaceProfileId },
  );
  return response.data.data;
};

/**
 * Độ phù hợp của 1 sản phẩm với BẢN MỆNH user — không cần workspace.
 *
 * Dùng cho vật phẩm mang theo người: `getProductFit` bắt buộc `workspaceProfileId` và luôn chấm theo
 * gap của một phòng, mà vật đeo trên người thì không thuộc phòng nào.
 *
 * Trả `422` khi hồ sơ chưa có ngày sinh — ở luồng này không còn nhu cầu của phòng để dựa vào, nên BE
 * cố ý từ chối chấm thay vì trả một con số không có căn cứ.
 */
export const getPersonalFit = async (productId: string): Promise<PersonalFitResponse> => {
  const response = await fetchHttpClient.get<ApiResponse<PersonalFitResponse>>(
    "/recommendations/fit/personal",
    { productId },
  );
  return response.data.data;
};

/**
 * Mặt A của trục nghề (N3): "sản phẩm này hợp NGHỀ NÀO, bao nhiêu %" — public, không cần đăng nhập,
 * phòng hay ngày sinh. `occupationCode` để lấy đúng một nghề; bỏ trống = mọi nghề đang bật có hồ sơ.
 */
export const getProductOccupationFit = async (
  productId: string,
  occupationCode?: string,
): Promise<ProductOccupationFitResponse> => {
  const response = await fetchHttpClient.get<ApiResponse<ProductOccupationFitResponse>>(
    `/products/${productId}/occupation-fit`,
    occupationCode ? { occupationCode } : undefined,
  );
  return response.data.data;
};

/**
 * Danh sách sản phẩm đề xuất cho một workspace — chỉ engine chấm điểm, không AI diễn giải, không lưu
 * phiên, nên gọi mỗi lần mở trang hồ sơ workspace là ổn. Muốn phiên có lời giải thích thì dùng
 * `POST /recommendations` (chatbot đang dùng), không phải hàm này.
 */
export const getWorkspaceRecommendationPreview = async (
  workspaceProfileId: string,
  topN = 8,
): Promise<WorkspaceRecommendationPreview> => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceRecommendationPreview>>(
    "/recommendations/preview",
    { workspaceProfileId, topN },
  );
  return response.data.data;
};

