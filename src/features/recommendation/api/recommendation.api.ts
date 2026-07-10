import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { ProductFitResponse } from "../types/recommendation";

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
