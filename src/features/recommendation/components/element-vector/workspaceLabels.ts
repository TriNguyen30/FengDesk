/**
 * Nhãn tiếng Việt cho mã mục đích / ánh sáng của workspace (BE trả mã enum: `Study`, `Artificial`…).
 * Form tạo phòng hiện vẫn hiện mã thô; ở trang sản phẩm thì không — "Mục đích: Study" đọc như lỗi dịch.
 * Mã lạ trả về chính nó.
 */
const WORK_PURPOSE_VI: Record<string, string> = {
  Office: "làm việc văn phòng",
  Study: "học tập",
  Creative: "sáng tạo",
  Reading: "đọc sách",
  Gaming: "chơi game",
  Cooking: "nấu ăn",
  Dining: "ăn uống",
  Relaxation: "thư giãn",
  Sleep: "ngủ nghỉ",
  Childcare: "chăm sóc trẻ nhỏ",
  Exercise: "tập luyện",
  Mixed: "đa năng",
  Other: "khác",
};

const LIGHTING_VI: Record<string, string> = {
  Natural: "tự nhiên",
  Artificial: "đèn",
  Mixed: "kết hợp",
  Dim: "yếu",
};

export function workPurposeVi(code: string | null | undefined): string {
  return (code && WORK_PURPOSE_VI[code]) || code || "—";
}

export function lightingVi(code: string | null | undefined): string {
  return (code && LIGHTING_VI[code]) || code || "—";
}
