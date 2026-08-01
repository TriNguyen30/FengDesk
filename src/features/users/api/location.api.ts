import fetchHttpClient from "@/lib/httpClient";
import { Provinces, District, Ward, WardPath } from "../types/location";
import type { ApiResponse } from "@/types/api";

// ── Cache theo phiên ────────────────────────────────────────────────────────
// Danh mục hành chính là dữ liệu tĩnh. Autofill từ bản đồ gọi lại chính các
// endpoint mà cascade effect cũng gọi → cache + dedupe in-flight để một lần
// chọn toạ độ chỉ tốn 1 request cho mỗi cấp.

const provinceCache: { promise: Promise<Provinces[]> | null } = { promise: null };
const districtCache = new Map<string, Promise<District[]>>();
const wardCache = new Map<string, Promise<Ward[]>>();
const wardPathCache = new Map<string, Promise<WardPath>>();

/** Xoá cache khi request lỗi để lần gọi sau còn thử lại được. */
function forgetOnError<T>(promise: Promise<T>, forget: () => void): Promise<T> {
  return promise.catch((error) => {
    forget();
    throw error;
  });
}

export const getProvinces = async (): Promise<Provinces[]> => {
  if (!provinceCache.promise) {
    provinceCache.promise = forgetOnError(
      fetchHttpClient
        .get<ApiResponse<Provinces[]>>("/locations/provinces")
        .then((response) => response.data.data ?? []),
      () => {
        provinceCache.promise = null;
      },
    );
  }
  return provinceCache.promise;
};

export const getDistrictsByProvinceId = async (provinceId: string): Promise<District[]> => {
  const cached = districtCache.get(provinceId);
  if (cached) return cached;

  const request = forgetOnError(
    fetchHttpClient
      .get<ApiResponse<District[]>>(`/locations/provinces/${provinceId}/districts`)
      .then((response) => response.data.data ?? []),
    () => districtCache.delete(provinceId),
  );

  districtCache.set(provinceId, request);
  return request;
};

export const getWardsByDistrictId = async (districtId: string): Promise<Ward[]> => {
  const cached = wardCache.get(districtId);
  if (cached) return cached;

  const request = forgetOnError(
    fetchHttpClient
      .get<ApiResponse<Ward[]>>(`/locations/districts/${districtId}/wards`)
      .then((response) => response.data.data ?? []),
    () => wardCache.delete(districtId),
  );

  wardCache.set(districtId, request);
  return request;
};

/**
 * Tra ngược phường → quận → tỉnh.
 * Địa chỉ đã lưu chỉ giữ wardId, nên khi mở form sửa phải hỏi BE 2 cấp cha để
 * dựng lại đủ 3 dropdown.
 */
export const getWardPath = async (wardId: string): Promise<WardPath> => {
  const cached = wardPathCache.get(wardId);
  if (cached) return cached;

  const request = forgetOnError(
    fetchHttpClient
      .get<ApiResponse<WardPath>>(`/locations/wards/${wardId}/path`)
      .then((response) => response.data.data),
    () => wardPathCache.delete(wardId),
  );

  wardPathCache.set(wardId, request);
  return request;
};
