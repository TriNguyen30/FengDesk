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
