import type { CurrentContribution } from "@/features/users/types/workspace";

export interface ElementAnalysisRow {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  ideal: number;
  adjustedIdeal: number;
  current: number;
  gap: number; // + = thiếu (cần bù), − = thừa
  /** Current NẾU thêm sản phẩm này vào phòng (BE tính bằng engine — cùng thang với current). */
  previewCurrent: number;
  previewGap: number;
}

export type ElementCode = "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";

export interface ProductElementRow {
  element: ElementCode;
  value: number;
}

// ─────────────────────────── v3.2 §9 — giải thích điểm ───────────────────────────

/** Một số hạng CỘNG vào điểm: contribution = value × weight. Tổng mọi contribution = blended. */
export interface ScoreComponentRow {
  /** `GAP_SCORE` | `PERSONAL_SCORE` | `PERSONAL_NEED_SCORE` — map i18n/icon theo mã, đừng parse nhãn. */
  code: string;
  labelVi: string;
  value: number;
  weight: number;
  contribution: number;
  reasonVi: string;
}

/** Một số hạng TRỪ. BE gửi ĐỦ loại kể cả `applied: false` — "đã xét và không trừ" khác "không tồn tại". */
export interface ScorePenaltyRow {
  /** Trùng `scoring_params.code`: `USER_CONFLICT_PENALTY` | `DIRECTION_PENALTY` | `VIBE_*`. */
  code: string;
  labelVi: string;
  value: number;
  applied: boolean;
  reasonVi: string;
}

export interface PersonalWeightInfo {
  value: number;
  /** `PERSONAL_WEIGHT_PRIVATE` | `_SHARED` | `_PUBLIC`. */
  code: string;
  scope: "Private" | "Shared" | "Public";
  reasonVi: string;
}

/**
 * Các vector để vẽ radar. Có đủ `normalizedGap` (ĝ), `ruleScore` (r) và `personalWeight.value` (Wp)
 * nên FE **tự dựng lại** `combinedDirection` và `priorityVector` ở mọi mức Wp — slider mô phỏng
 * không cần gọi lại API (§10.3).
 */
export interface ScoreVectors {
  product: ProductElementRow[];
  /** ĝ = gap / (|gap|₁/2), mỗi trục ∈ [−1,+1]. Nhánh Carry: vector dụng thần đã chuẩn hoá. */
  normalizedGap: ProductElementRow[];
  /** r' = điểm quan hệ ĐÃ tính nghề nghiệp, CÓ DẤU. null khi trục cá nhân tắt. */
  ruleScore: ProductElementRow[] | null;
  /** r TRƯỚC delta nghề. null khi nghề nghiệp không áp — khi đó `ruleScore` đã là r gốc. */
  baseRuleScore: ProductElementRow[] | null;
  /**
   * `r' − r` — nghề của bạn đã kéo hành nào lên/xuống bao nhiêu.
   *
   * ⚠️ Là mức dịch THẬT, đo SAU khi chặn, nên **không bằng** `delta × share`: hành khắc bản mệnh bị
   * chặn nên hiện ra gần 0 dù bảng delta khai lớn. Đúng con số cần hiển thị — nói "nghề của bạn nâng
   * Kim" trong khi Kim vẫn khắc mệnh là nói dối bằng đồ hoạ.
   *
   * ⚠️ Thang [−1,+1] CÓ DẤU, **không cùng thang** với `current`/`adjustedIdeal` (Σ=1, không âm) —
   * đừng vẽ chồng lên radar chính.
   */
  occupationShift: ProductElementRow[] | null;
  /** d = (1−Wp)·ĝ + Wp·r — thứ thật sự nhân với product. */
  combinedDirection: ProductElementRow[];
  /** normalize(max(d, 0)), Σ=1 — lớp vàng "Ưu tiên của bạn" trên radar. */
  priorityVector: ProductElementRow[];
  /** Chỉ luồng Carry. */
  personalNeed: ProductElementRow[] | null;
  /** Vector bản mệnh Σ=1 (60/30/10). `null` khi user chưa có ngày sinh. */
  personalVector: ProductElementRow[] | null;
  /**
   * `T = (1−Wp)·adjustedIdeal + Wp·personalVector`, Σ=1 — lớp "Mục tiêu của bạn" trên radar.
   * ⚠️ Chỉ để hiển thị; điểm số vẫn đi đường `combinedDirection`.
   */
  personalTarget: ProductElementRow[] | null;
}

/** §13 — phòng thiếu đúng hành khắc bản mệnh; `bridge` là hành hoá giải. */
export interface ConflictResolution {
  roomNeed: ElementCode;
  destiny: ElementCode;
  bridge: ElementCode;
  reasonVi: string;
}

export interface ScoreBreakdown {
  formulaVersion: string;
  target: "WorkspaceGap" | "PersonalNeed";
  placement: string;
  /** BE tính sẵn để không lệch cách làm tròn với FE. */
  displayPercent: number;
  components: ScoreComponentRow[];
  penalties: ScorePenaltyRow[];
  blended: number;
  rawScore: number;
  clamped: boolean;
  score: number;
  /** null ở luồng Carry (Wp không áp: mục tiêu đã 100% cá nhân). */
  personalWeight: PersonalWeightInfo | null;
  vectors: ScoreVectors;
  destinyElement: ElementCode | null;
  destinyLabelVi: string | null;
  conflictResolution: ConflictResolution | null;
  /**
   * Nghề nghiệp đã tác động vào điểm này (P5). `null` khi user chưa khai nghề, nghề chưa có delta,
   * `OCCUPATION_SHARE` đang tắt, hoặc delta chỉ trỏ vào hành khắc mệnh nên bị chặn sạch — cả bốn
   * đều nghĩa là nghề nghiệp không đổi gì.
   */
  occupation: OccupationInfluence | null;
}

/** Nghề nghiệp bẻ vector điểm quan hệ thế nào — v3.2 §11 (P5). */
export interface OccupationInfluence {
  code: string;
  nameVi: string;
  /** `OCCUPATION_SHARE` đang áp. */
  share: number;
  shareCode: string;
  reasonVi: string;
}

/** Độ phù hợp của 1 sản phẩm × 1 workspace — không loại sản phẩm, luôn có kết quả. */
export interface ProductFitResponse {
  productId: string;
  workspaceProfileId: string;
  score: number; // ∈ [-1, 1]
  matchFacts: string[];
  cautionFacts: string[];
  placementHint: string | null;
  gap: ElementAnalysisRow[];
  productVector: ProductElementRow[];

  /** v3.2 — mọi thành phần đã tạo ra `score`. Có thể null nếu BE chưa deploy v3.2. */
  breakdown: ScoreBreakdown | null;

  /** Nguồn nào tạo nên `current` của phòng — cùng dữ liệu tooltip của element-analysis. */
  contributions: CurrentContribution[];
  /** Số bằng chứng THẬT (tag + sản phẩm). 0 = hiện trạng hoàn toàn suy ra từ loại phòng. */
  evidenceCount: number;
  /** 0..1 — tỉ lệ `current` đến từ dữ liệu user khai thay vì nền phòng. */
  confidence: number;
}

/**
 * Độ phù hợp của 1 sản phẩm với BẢN MỆNH user — không gắn với phòng nào (vật mang theo người).
 * Waterfall chỉ MỘT thành phần và radar không có lớp "Mức lý tưởng"/"Hiện tại": không có phòng.
 */
export interface PersonalFitResponse {
  productId: string;
  score: number;
  matchFacts: string[];
  cautionFacts: string[];
  placementHint: string | null;
  breakdown: ScoreBreakdown | null;
  /** Vector "người đang cần hành gì" (dụng thần Tứ Trụ, fallback Nạp Âm) — Σ=1. */
  personalNeedVector: ProductElementRow[];
  productVector: ProductElementRow[];
  destinyElement: ElementCode;
  destinyLabelVi: string;
}
