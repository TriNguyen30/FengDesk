import fetchHttpClient from "@/lib/httpClient";
import { ApiResponse } from "../types/tag";
import { Tag } from "../types/tag";

export const getTags = async () => {
  const response = await fetchHttpClient.get<ApiResponse<Tag[]>>("/tags");
  return response.data;
};
