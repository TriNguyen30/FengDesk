/** Một mục tra cứu phong thủy (element / vibe / style) trả từ BE. */
export interface LookupItem {
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

/** Loại tín hiệu vật lý dùng để auto-calc vector ngũ hành. */
export type ElementInputKind = "Color" | "Material" | "Shape";

/** Danh sách code hợp lệ theo kind, vd { kind: "Material", codes: ["Wood","Metal",...] }. */
export interface ElementInputCodes {
  kind: ElementInputKind;
  codes: string[];
}
