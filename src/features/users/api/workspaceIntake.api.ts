import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { WorkspaceProfileDraft } from "../types/workspace";

export const parseWorkspaceDescription = async (
  description: string,
): Promise<WorkspaceProfileDraft> => {
  const response = await fetchHttpClient.post<ApiResponse<WorkspaceProfileDraft>>(
    "/workspace/parse-description",
    { description },
  );
  return response.data.data;
};
