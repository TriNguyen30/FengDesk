import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { PersonalFitResponse, ProductFitResponse } from "../types/recommendation";

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
