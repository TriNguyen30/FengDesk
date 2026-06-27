/** Một mục tra cứu phong thủy (element / vibe / style) trả từ BE. */
export interface LookupItem {
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}
