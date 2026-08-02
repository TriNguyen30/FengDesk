export interface Provinces {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  provinceId: string;
  name: string;
  code: string;
}

export interface Ward {
  id: string;
  districtId: string;
  name: string;
  code: string;
}

/** Đường dẫn hành chính đầy đủ của 1 phường — GET /locations/wards/{id}/path. */
export interface WardPath {
  wardId: string;
  wardName: string;
  districtId: string;
  districtName: string;
  provinceId: string;
  provinceName: string;
}
