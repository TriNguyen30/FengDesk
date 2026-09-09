/**
 * Một nghề trong danh sách chọn của hồ sơ.
 *
 * KHÔNG có delta ngũ hành: bảng delta là phát biểu phong thủy do chuyên gia duyệt, chỉ engine đọc.
 */
export interface OccupationOption {
  id: string;
  code: string;
  nameVi: string;
  description?: string | null;
  sortOrder: number;
}
