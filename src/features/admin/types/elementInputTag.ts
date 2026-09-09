/** 5 hành — enum khớp `FengShuiElement` phía BE. */
export type FengShuiElement = "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";

/** Nhóm tag — khớp `ElementInputKind` phía BE. */
export type ElementInputKind = "Color" | "Material" | "Shape" | "DecorItem";

/**
 * Phạm vi hiển thị của tag.
 * `Pending` và `Personal` hiện GIỐNG NHAU với user (chỉ người tạo thấy) — khác biệt duy nhất là
 * admin đã xem hay chưa, để hàng đợi duyệt (= Pending) rút được về 0.
 */
export type ElementInputVisibility = "Pending" | "Personal" | "Public";

export interface ElementInputTagContribution {
  id: string;
  element: FengShuiElement;
  weight: number;
}

/**
 * Một tag ngũ hành = 1 cặp (inputKind, inputCode), gồm nhiều hành.
 * Admin sửa theo TAG chứ không sửa từng row rời — nếu không, nhãn tiếng Việt của cùng 1 code
 * dễ lệch nhau giữa các hành.
 */
export interface ElementInputTag {
  inputKind: ElementInputKind;
  inputCode: string;
  labelVi: string;
  visibility: ElementInputVisibility;
  /** null = tag seed hệ thống; có giá trị = do user tự tạo ở bước intake workspace. */
  createdBy: string | null;
  isUserCreated: boolean;
  /** Còn nằm trong hàng đợi chờ admin xem. */
  isPending: boolean;
  contributions: ElementInputTagContribution[];
  /** Σ weight = số "phiếu" tag bỏ vào vector hiện trạng phòng. Chuẩn là 1.0. */
  totalWeight: number;
  updatedAt: string;
}

export interface UpdateElementInputTagPayload {
  /** Bỏ trống = giữ nhãn hiện tại. */
  labelVi?: string;
  /** Bỏ trống = giữ nguyên phân bổ hành. Hành không có trong list sẽ bị xóa. */
  contributions?: { element: FengShuiElement; weight: number }[];
  /** Bỏ trống = giữ nguyên phạm vi hiển thị. */
  visibility?: ElementInputVisibility;
}

export interface ElementInputTagFilters {
  kind?: ElementInputKind;
  visibility?: ElementInputVisibility;
  isUserCreated?: boolean;
}

export const VISIBILITY_LABEL: Record<ElementInputVisibility, string> = {
  Pending: "Chờ duyệt",
  Personal: "Cá nhân",
  Public: "Công cộng",
};

export const VISIBILITY_HINT: Record<ElementInputVisibility, string> = {
  Pending: "User vừa tạo, bạn chưa xem. Chỉ người tạo thấy tag này.",
  Personal: "Bạn đã xem và giữ riêng cho người tạo — tag vẫn dùng được, không nằm trong hàng đợi.",
  Public: "Tag chính thức: mọi user thấy trong picker và AI intake được phép dùng.",
};

/** Tailwind class cho badge trạng thái. */
export const VISIBILITY_BADGE: Record<ElementInputVisibility, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Personal: "bg-sky-50 text-sky-700",
  Public: "bg-emerald-50 text-emerald-700",
};

export const ELEMENT_KIND_LABEL: Record<ElementInputKind, string> = {
  Color: "Màu sắc",
  Material: "Chất liệu",
  Shape: "Hình khối",
  DecorItem: "Vật trang trí",
};

export const ELEMENT_LABEL: Record<FengShuiElement, string> = {
  Kim: "Kim",
  Moc: "Mộc",
  Thuy: "Thủy",
  Hoa: "Hỏa",
  Tho: "Thổ",
};

/** Cùng bảng màu với radar ngũ hành phía user (features/recommendation/.../constants.ts). */
export const ELEMENT_COLOR: Record<FengShuiElement, string> = {
  Moc: "#6C914A",
  Thuy: "#3b82f6",
  Hoa: "#ef4444",
  Tho: "#D9AD41",
  Kim: "#9ca3af",
};

export const ALL_ELEMENTS: FengShuiElement[] = ["Kim", "Moc", "Thuy", "Hoa", "Tho"];
export const ALL_KINDS: ElementInputKind[] = ["Color", "Material", "Shape", "DecorItem"];

/**
 * Σ weight của 1 tag = số phiếu nó bỏ vào vector phòng. Lệch khỏi 1.0 nghĩa là tag được cố ý cho
 * nặng/nhẹ hơn tag khác — hợp lệ nhưng cần admin biết mình đang làm gì.
 */
export const WEIGHT_TOLERANCE = 0.001;

export function isTotalWeightNormal(total: number): boolean {
  return Math.abs(total - 1) <= WEIGHT_TOLERANCE;
}
