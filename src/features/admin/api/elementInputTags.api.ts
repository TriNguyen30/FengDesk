import fetchHttpClient from "@/lib/httpClient";
import { ApiResponse } from "@/types/api";
import type {
  ElementInputKind,
  ElementInputTag,
  ElementInputTagFilters,
  UpdateElementInputTagPayload,
} from "../types/elementInputTag";

/** Cấu hình chấm điểm ngũ hành — policy `ManagerOrAbove` phía BE. */
export const elementInputTagsApi = {
  getTags: (filters: ElementInputTagFilters) =>
    fetchHttpClient.get<ApiResponse<ElementInputTag[]>>("/admin/scoring/element-input-tags", filters),

  updateTag: (kind: ElementInputKind, code: string, payload: UpdateElementInputTagPayload) =>
    fetchHttpClient.put<ApiResponse<ElementInputTag>>(
      `/admin/scoring/element-input-tags/${kind}/${encodeURIComponent(code)}`,
      payload,
    ),

  deleteTag: (kind: ElementInputKind, code: string) =>
    fetchHttpClient.delete<ApiResponse<boolean>>(
      `/admin/scoring/element-input-tags/${kind}/${encodeURIComponent(code)}`,
    ),
};
