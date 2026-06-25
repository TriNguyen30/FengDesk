import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { LookupItem } from "../types/taxonomy";

/** Ngũ hành (5 cố định: Kim/Moc/Thuy/Hoa/Tho). Public. */
export const getElements = async () => {
  const { data } = await fetchHttpClient.get<ApiResponse<LookupItem[]>>("/elements");
  return data;
};

/** Vibe (cảm hứng không gian), code động. Public. */
export const getVibes = async () => {
  const { data } = await fetchHttpClient.get<ApiResponse<LookupItem[]>>("/vibes");
  return data;
};

/** Style (phong cách), code động. Public. */
export const getStyles = async () => {
  const { data } = await fetchHttpClient.get<ApiResponse<LookupItem[]>>("/styles");
  return data;
};
