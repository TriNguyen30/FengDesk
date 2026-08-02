// ---------------------------------------------------------------------------
// Map → form autofill: đổi toạ độ trên bản đồ thành bộ id Tỉnh/Quận/Phường của
// DB nội bộ + số nhà/tên đường.
//
// Toàn bộ phần async (reverse geocode → tải danh mục → khớp tên) gom vào đây và
// trả về MỘT kết quả duy nhất, để phía React chỉ việc set state một lượt.
// Đây là điểm mấu chốt: trước đây mỗi cấp được set state rồi await tiếp, khiến
// cascade effect chạy xen giữa và xoá lại phường/quận vừa điền.
// ---------------------------------------------------------------------------

import {
  getProvinces,
  getDistrictsByProvinceId,
  getWardsByDistrictId,
  getWardPath,
} from "../api/location.api";
import { reverseGeocode, findBestMatch, type ReverseGeocodeResult } from "../api/geocoding";
import type { Provinces, District, Ward } from "../types/location";

/** Bộ state đủ để 3 dropdown hiển thị đúng một lựa chọn. */
export interface LocationSelection {
  provinces: Provinces[];
  districts: District[];
  wards: Ward[];
  provinceId: string;
  districtId: string;
  wardId: string;
}

/**
 * Dựng lại lựa chọn Tỉnh/Quận/Phường từ wardId của địa chỉ đã lưu.
 * Dùng khi mở form sửa: bản ghi chỉ có wardId nên phải tra ngược 2 cấp cha rồi
 * tải danh mục anh em để <select> có option mà hiển thị.
 *
 * Trả về null nếu không có wardId hoặc tra cứu thất bại — khi đó cứ để form trống.
 */
export async function loadSelectionForWard(wardId: string): Promise<LocationSelection | null> {
  if (!wardId) return null;

  try {
    const path = await getWardPath(wardId);

    const [provinces, districts, wards] = await Promise.all([
      getProvinces(),
      getDistrictsByProvinceId(path.provinceId),
      getWardsByDistrictId(path.districtId),
    ]);

    return {
      provinces: provinces ?? [],
      districts: districts ?? [],
      wards: wards ?? [],
      provinceId: path.provinceId,
      districtId: path.districtId,
      wardId: path.wardId,
    };
  } catch (error) {
    console.error("[Location] Không nạp được khu vực của địa chỉ đã lưu:", error);
    return null;
  }
}

export interface ResolvedLocation {
  /** Danh mục tương ứng với các id đã khớp — set kèm để <select> có option hiển thị. */
  provinces: Provinces[];
  districts: District[];
  wards: Ward[];
  /** Rỗng nếu không khớp được cấp đó. Các cấp dưới cũng sẽ rỗng theo. */
  provinceId: string;
  districtId: string;
  wardId: string;
  /** Số nhà + tên đường, có thể rỗng. */
  street: string;
  /** Tên hành chính thô do VietMap trả về (để log/chẩn đoán). */
  raw: ReverseGeocodeResult;
}

/**
 * Reverse geocode một toạ độ rồi khớp sang id trong DB.
 * Trả về null khi VietMap không xác định được địa chỉ (hết quota, ngoài biển...).
 *
 * @param knownProvinces danh sách tỉnh đã tải sẵn ở phía gọi; truyền [] nếu chưa có.
 */
export async function resolveLocationFromCoordinates(
  lat: number,
  lng: number,
  knownProvinces: Provinces[] = [],
): Promise<ResolvedLocation | null> {
  const raw = await reverseGeocode(lat, lng);
  if (!raw) return null;

  const provinces = knownProvinces.length ? knownProvinces : ((await getProvinces()) ?? []);

  const provinceId = findBestMatch(provinces, raw.province);
  if (!provinceId) {
    console.warn("[Geocode] Không khớp được tỉnh/thành:", raw.province);
    return { provinces, districts: [], wards: [], provinceId: "", districtId: "", wardId: "", street: raw.street ?? "", raw };
  }

  const districts = (await getDistrictsByProvinceId(provinceId)) ?? [];
  const districtId = findBestMatch(districts, raw.district);
  if (!districtId) {
    console.warn("[Geocode] Không khớp được quận/huyện:", raw.district, "— DB có", districts.length, "quận/huyện");
    return { provinces, districts, wards: [], provinceId, districtId: "", wardId: "", street: raw.street ?? "", raw };
  }

  const wards = (await getWardsByDistrictId(districtId)) ?? [];
  const wardId = findBestMatch(wards, raw.ward);
  if (!wardId) {
    console.warn("[Geocode] Không khớp được phường/xã:", raw.ward, "— DB có", wards.length, "phường/xã");
  }

  return {
    provinces,
    districts,
    wards,
    provinceId,
    districtId,
    wardId,
    street: raw.street ?? "",
    raw,
  };
}
