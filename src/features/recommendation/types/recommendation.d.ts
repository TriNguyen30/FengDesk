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
  /** Mức phạt gốc trong `scoring_params` (vd 0.60). */
  paramValue: number;
  /** Hệ số nhân vào mức gốc (`Wp` hoặc tỉ trọng hành khắc mệnh); `null` = trừ nguyên mức. */
  factor: number | null;
  factorLabelVi: string | null;
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
  /** r = điểm quan hệ với bản mệnh, CÓ DẤU. null khi trục cá nhân tắt. */
  ruleScore: ProductElementRow[] | null;
  /**
   * `ô` — hướng nghề nghiệp (N3), ĐÃ chặn hành khắc mệnh về ≤ 0. Mỗi trục ∈ [−1,+1], cùng thang với
   * `normalizedGap`. null khi trục nghề tắt.
   *
   * ⚠️ Thang CÓ DẤU, **không cùng thang** với `current`/`adjustedIdeal` (Σ=1, không âm) — vẽ bằng
   * thanh có dấu ({@link OccupationDirectionPanel}), đừng chồng lên radar chính.
   */
  occupationDirection: ProductElementRow[] | null;
  /**
   * `ô` TRƯỚC khi chặn. Khác `occupationDirection` đúng ở hành nghề muốn nâng nhưng khắc mệnh —
   * user phải thấy phần nghề *không* kéo được. null khi trục nghề tắt.
   */
  occupationRawDirection: ProductElementRow[] | null;
  /** d = (1−Wp−Wo)·ĝ + Wp·r + Wo·ô (phòng) · (1−Wo)·n̂ + Wo·ô (Carry) — thứ thật sự nhân với product. */
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
  /** v3.6 — kỵ thần đã áp ở nhánh Carry (mã hành); `null`/vắng ở luồng phòng. */
  personalAvoidElements?: ElementCode[] | null;
  destinyLabelVi: string | null;
  conflictResolution: ConflictResolution | null;
  /**
   * Trục nghề đã tác động vào điểm này (N3). `null` khi user chưa khai nghề, nghề chưa có hồ sơ
   * (hoặc là OTHER), hoặc `OCCUPATION_WEIGHT` đang tắt — cả ba đều nghĩa là nghề không đổi gì.
   */
  occupation: OccupationInfluence | null;
}

/** Trục nghề đã áp thế nào — N3, ADR occupation-product-fit-v1.md §3. */
export interface OccupationInfluence {
  code: string;
  nameVi: string;
  /** `Wo` đang áp (đã kẹp ≤ 1 − Wp ở luồng phòng). */
  weight: number;
  /** Luôn `OCCUPATION_WEIGHT`. */
  weightCode: string;
  /** Nói cả phần nghề KHÔNG kéo được (hành khắc mệnh bị chặn). */
  reasonVi: string;
}

/**
 * Mặt A — "sản phẩm này hợp NGHỀ NÀO, bao nhiêu %": `ô · p` cho từng nghề, không cần đăng nhập.
 * Cùng con số với dòng `OCCUPATION_SCORE` trong breakdown gợi ý.
 */
export interface ProductOccupationFitResponse {
  productId: string;
  formulaVersion: string;
  placement: string;
  productVector: ProductElementRow[];
  /** Sắp giảm dần theo `score`. Rỗng khi hàng tiêu hao hoặc chưa nghề nào có hồ sơ. */
  fits: OccupationFitRow[];
  noteVi: string | null;
}

export interface OccupationFitRow {
  code: string;
  nameVi: string;
  /** `ô · p` ∈ [−1, 1]. */
  score: number;
  /** `(score + 1) / 2 × 100` — 50% = trung tính. */
  displayPercent: number;
  /** Rất hợp / Phù hợp / Trung tính / Cân nhắc — cùng ngưỡng `ScoreBadge`. */
  tierVi: string;
  /** `ô` thô (mặt A không có mệnh nên không chặn). */
  direction: ProductElementRow[];
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
  /** v3.5 — hệ số cap phiếu tag đã áp (1 = không cap). Cùng nghĩa với `WorkspaceElementAnalysis.tagVotesScale`. */
  tagVotesScale?: number;
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
  /** `TuTru` (có giờ sinh) | `NapAm` (chỉ năm sinh). */
  personalNeedSource: "TuTru" | "NapAm" | string;
  /** Câu của BE: thân vượng/nhược, nhật chủ… hoặc lời mời bổ sung giờ sinh. */
  personalNeedNoteVi: string;
  /** v3.6 — kỵ thần (mã hành). Phần sản phẩm rơi vào đây là dòng `PERSONAL_AVOID_SCORE`. */
  personalAvoidElements: ElementCode[];
  productVector: ProductElementRow[];
  destinyElement: ElementCode;
  destinyLabelVi: string;
}

// ─────────────────────────── gợi ý theo workspace (preview, không AI) ───────────────────────────

/** Một sản phẩm trong danh sách gợi ý cho workspace — cùng shape với `RecommendationItemResponse` ở BE. */
export interface RecommendationItem {
  productId: string;
  productName: string;
  price: number | null;
  imageUrl: string | null;
  /** Điểm engine ∈ [-1, 1] — quy % bằng `scorePercent`. */
  score: number;
  rank: number;
  matchFacts: string[];
  cautionFacts: string[];
  placementHint: string | null;
  /** Luôn null ở luồng preview (không gọi AI diễn giải). */
  explanation: string | null;
}

/**
 * `GET /recommendations/preview` — engine chấm topN cho một workspace, KHÔNG gọi AI, KHÔNG lưu phiên.
 * `id = 00000000-…` vì không có phiên nào được lưu; `note` là ghi chú engine (vd đã bỏ lọc mục tiêu).
 */
export interface WorkspaceRecommendationPreview {
  id: string;
  kind: "Workspace" | "PersonalCarry";
  status: string;
  note: string | null;
  items: RecommendationItem[];
}

