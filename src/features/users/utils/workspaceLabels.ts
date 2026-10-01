import type { WorkspaceType } from "../types/workspace";

/**
 * Nhãn hiển thị tiếng Việt cho mã enum của workspace (BE trả mã: `Home`, `Natural`, `Northeast`…).
 * Dùng ở form tạo/sửa phòng và dải thông tin phòng. Mã lạ (enum BE thêm mới) → trả nguyên mã, không
 * làm vỡ giao diện.
 *
 * Bản viết thường để ghép vào câu ("dùng để học tập") nằm ở
 * `recommendation/components/element-vector/workspaceLabels.ts`.
 */
const LOCATION_TYPE_VI: Record<string, string> = {
  Home: "Nhà riêng",
  Office: "Văn phòng",
  Cafe: "Quán cà phê",
  Studio: "Studio",
  Coworking: "Không gian coworking",
  School: "Trường học",
  Outdoor: "Ngoài trời",
  Hotel: "Khách sạn",
  Other: "Khác",
};

const LIGHTING_VI: Record<string, string> = {
  Natural: "Ánh sáng tự nhiên",
  Artificial: "Đèn điện",
  Mixed: "Tự nhiên + đèn",
  Dim: "Thiếu sáng",
};

const DESK_TYPE_VI: Record<string, string> = {
  Sitting: "Bàn ngồi",
  Standing: "Bàn đứng",
  StandingSitting: "Bàn nâng hạ",
  LShape: "Bàn chữ L",
  Corner: "Bàn góc",
  Other: "Khác",
};

const DIRECTION_VI: Record<string, string> = {
  North: "Bắc",
  Northeast: "Đông Bắc",
  East: "Đông",
  Southeast: "Đông Nam",
  South: "Nam",
  Southwest: "Tây Nam",
  West: "Tây",
  Northwest: "Tây Bắc",
};

const WORK_PURPOSE_VI: Record<string, string> = {
  Office: "Làm việc văn phòng",
  Study: "Học tập",
  Creative: "Sáng tạo",
  Reading: "Đọc sách",
  Gaming: "Chơi game",
  Cooking: "Nấu ăn",
  Dining: "Ăn uống",
  Relaxation: "Thư giãn",
  Sleep: "Ngủ nghỉ",
  Childcare: "Chăm sóc trẻ nhỏ",
  Exercise: "Tập luyện",
  Mixed: "Đa năng",
  Other: "Khác",
};

const lookup = (map: Record<string, string>) => (code: string | null | undefined) =>
  (code && map[code]) || code || "—";

export const locationTypeLabel = lookup(LOCATION_TYPE_VI);
export const lightingLabel = lookup(LIGHTING_VI);
export const deskTypeLabel = lookup(DESK_TYPE_VI);
export const directionLabel = lookup(DIRECTION_VI);
export const workPurposeLabel = lookup(WORK_PURPOSE_VI);

/** Loại phòng hệ thống có tên tiếng Việt từ BE; loại user tự tạo chỉ có `name`. */
export function workspaceTypeLabel(type: Pick<WorkspaceType, "name" | "nameVi">): string {
  return type.nameVi || type.name;
}
