import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { OccupationOption } from "../types/occupation";

/**
 * Danh sách nghề đang bật, sắp sẵn theo `sortOrder` từ BE.
 *
 * Endpoint public và **không kèm delta ngũ hành**: con số delta là chuyện của engine, hiện ra cho
 * người đang chọn nghề chỉ khiến họ chọn theo điểm thay vì chọn theo nghề thật của mình.
 */
export async function getOccupationsRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<OccupationOption[]>>("/occupations");
  return data;
}
