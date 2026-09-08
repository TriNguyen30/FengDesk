export interface Workspace {
  id: string;
  userId: string;
  name: string;
  workspaceTypeId: string | null;
  locationType: string;
  styleCode: string;
  lighting: string | null;
  deskType: string | null;
  deskOrientation: string | null;
  roomFacingDirection: string | null;
  workPurpose: string;
  /** Mệnh nhập tay (legacy) — chỉ còn ở dữ liệu cũ, không còn nhập mới. */
  fengShuiElement: string | null;
  deskArea: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  /** % hồ sơ đã điền (fields optional có giá trị / tổng). */
  completenessPercent: number;
  /** Gợi ý field nên bổ sung + lợi ích, vd "Thêm hướng cửa để nhận gợi ý vị trí đặt". */
  missingFieldHints: string[];
  /** Màu/vật liệu/hình khối hiện trạng phòng đã lưu. */
  inputs: WorkspaceProfileInputDto[];
}

export interface WorkspaceType {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  personalWeight: number;
}

export interface Style {
  code: string;
  name: string;
  sortOrder: number;
}

/** Một tín hiệu màu/vật liệu/hình khối/vật trang trí (khớp element_input_map). */
export interface WorkspaceProfileInputDto {
  inputKind: "Color" | "Material" | "Shape" | "DecorItem";
  inputCode: string;
}

/** Một lựa chọn tag: `code` để lưu, `labelVi` để hiển thị (BE fallback về code nếu chưa có nhãn). */
export interface ElementInputOption {
  code: string;
  labelVi: string;
}

/**
 * Từ vựng tag hợp lệ cho picker "hiện trạng phòng hiện tại".
 * Riêng cho workspace — không dùng chung với vocabulary sản phẩm.
 */
export interface ElementInputVocabulary {
  colors: ElementInputOption[];
  materials: ElementInputOption[];
  shapes: ElementInputOption[];
  decorItems: ElementInputOption[];
}

export interface ElementContributionDto {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  weight: number;
}

/** Kết quả AI phân loại 1 tag mới — đã chuẩn hóa (code sạch, weight clamp+normalize tổng=1). */
export interface ClassifyElementInputResult {
  code: string;
  /** Chính chữ user đã gõ — đã lưu vào element_input_map để tái sử dụng làm dẫn chứng. */
  labelVi: string;
  elements: ElementContributionDto[];
}

export interface CreateWorkspaceDto {
  name: string;
  locationType: string;
  workspaceTypeId?: string;
  styleCode: string;
  lighting?: string;
  /** Bỏ trống = không gian không có bàn làm việc. */
  deskType?: string;
  deskOrientation?: string;
  roomFacingDirection?: string;
  workPurpose: string;
  deskArea?: number;
  isDefault: boolean;
  inputs?: WorkspaceProfileInputDto[];
}

export interface UpdateWorkspaceDto {
  name: string;
  locationType: string;
  workspaceTypeId?: string;
  styleCode: string;
  lighting?: string;
  /** Bỏ trống = không gian không có bàn làm việc. */
  deskType?: string;
  deskOrientation?: string;
  roomFacingDirection?: string;
  workPurpose: string;
  deskArea?: number;
  /** undefined = không đổi input hiện có; [] = xóa hết. */
  inputs?: WorkspaceProfileInputDto[];
}

/**
 * Draft AI intake (mảng "workspace-ai-intake") — mọi field nullable, null = AI không suy ra được.
 * Chỉ để prefill form; lưu thật vẫn đi qua CreateWorkspaceDto/UpdateWorkspaceDto sẵn có.
 */
export interface WorkspaceProfileDraft {
  name: string | null;
  locationType: string | null;
  workspaceTypeId: string | null;
  styleCode: string | null;
  lighting: string | null;
  /** true = có bàn làm việc, false = rõ ràng không có (vd bếp/phòng khách), null = không đủ căn cứ. */
  hasDesk: boolean | null;
  deskType: string | null;
  deskOrientation: string | null;
  roomFacingDirection: string | null;
  workPurpose: string | null;
  deskArea: number | null;
  inputs: WorkspaceProfileInputDto[];
  /** 0..1 — mức tự tin tổng thể của lượt parse. */
  confidence: number;
  /** Chi tiết user nhắc đến nhưng hệ thống không map được. */
  unrecognized: string[];
}

export interface ElementAnalysisRow {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  ideal: number;
  adjustedIdeal: number;
  current: number;
  gap: number; // + = thiếu (cần bù), − = thừa
  /** Current NẾU tính cả sản phẩm đã mua chưa giao tới (= current khi không có preview). */
  previewCurrent: number;
  previewGap: number;
}

/** 1 dòng nhận định sinh ở BE (SpaceInsightBuilder) — Title/Text đã dựng sẵn, FE chỉ map icon theo Kind. */
export interface SpaceInsightLine {
  /** trait = đặc tính loại phòng · status = hiện trạng + nguyên do · action = đề xuất. */
  kind: "trait" | "status" | "action";
  title: string;
  text: string;
}

export interface SpaceInsights {
  case: "Imbalanced" | "Balanced" | "Toxic";
  lines: SpaceInsightLine[];
}

export interface WorkspaceElementAnalysis {
  workspaceProfileId: string;
  dominantNeed: string; // hành gap dương lớn nhất
  elements: ElementAnalysisRow[];
  /** % phòng đúng chuẩn lý tưởng đã điều chỉnh theo mục đích + bản mệnh (0-100). */
  compatibilityPercent: number;
  insights: SpaceInsights;
  /** true khi có sản phẩm CHƯA GIAO đặt trong phòng → radar vẽ thêm lớp preview nét đứt. */
  hasPreview: boolean;
  previewCompatibilityPercent: number;
  placedProducts: PlacedProduct[];
  /** Current được ghép từ những nguồn nào (nền phòng / tag / sản phẩm) — sắp giảm dần theo %. */
  contributions: CurrentContribution[];
  /** Số bằng chứng thật (tag + sản phẩm). 0 = mọi con số đang suy ra từ nền loại phòng. */
  evidenceCount: number;
  /** 0..1 — tỉ lệ Current đến từ dữ liệu user khai thay vì nền phòng (KHÔNG tính nền phòng và chủ nhân). */
  confidence: number;
  /** Tổng phiếu của mọi nguồn — mẫu số của mọi `sharePercent`. */
  totalVotes: number;
  /**
   * v3.2 — trục cá nhân của CĂN PHÒNG này. `null` khi phòng Public, khi user chưa có ngày sinh,
   * hoặc khi tham số trục cá nhân đang tắt (khi đó `d ≡ ĝ`, lớp vàng trùng "Mức lý tưởng").
   */
  personalDirection: PersonalDirection | null;
}

/**
 * Hệ thống đang ưu tiên bù hành nào cho phòng này, sau khi tính bản mệnh chủ nhân.
 *
 * Có đủ `normalizedGap` (ĝ), `ruleScore` (r) và `personalWeight` (Wp) nên **FE tự dựng lại `d` và
 * `priorityVector` ở mọi mức Wp** — slider mô phỏng không cần gọi lại API.
 */
export interface PersonalDirection {
  personalWeight: number;
  /** `PERSONAL_WEIGHT_PRIVATE` | `_SHARED` | `_PUBLIC`. */
  personalWeightCode: string;
  scope: "Private" | "Shared" | "Public";
  reasonVi: string;
  destinyElement: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  destinyLabelVi: string;
  /** ĝ = gap / (|gap|₁/2), mỗi trục ∈ [−1,+1]. */
  normalizedGap: ElementValueRow[];
  /** r = ruleScore(bản mệnh, ·), CÓ DẤU. */
  ruleScore: ElementValueRow[];
  /** d = (1−Wp)·ĝ + Wp·r. */
  combinedDirection: ElementValueRow[];
  /** Vector bản mệnh Σ=1: mệnh 60% · hành sinh mệnh 30% · hành mệnh sinh 10%. */
  personalVector: ElementValueRow[];
  /**
   * `normalize(max(d, 0))`, Σ=1 — "đang ưu tiên BÙ hành nào". Chỉ trải trên các trục còn dương nên
   * luôn nhọn hơn, **không so sánh trực tiếp được** với hai lớp kia. Để dành cho radar phụ.
   */
  priorityVector: ElementValueRow[];
  conflictResolution: {
    roomNeed: ElementValueRow["element"];
    destiny: ElementValueRow["element"];
    bridge: ElementValueRow["element"];
    reasonVi: string;
  } | null;
}

export interface ElementValueRow {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  value: number;
}

/** Một nguồn tạo nên vector hiện trạng, đã quy ra % (tổng mọi nguồn = 100). */
export interface CurrentContribution {
  /** `Person` = chủ nhân phòng — bản mệnh cũng là một nguồn ngũ hành, xếp cùng nhóm prior với Interior. */
  source: "Interior" | "Tag" | "Product" | "Person";
  /** Nhãn tiếng Việt: tag → labelVi, sản phẩm → tên sản phẩm, nền phòng → "Nền phòng theo loại". */
  label: string;
  sharePercent: number;
  /** Số phiếu — đơn vị gốc của mô hình; `sharePercent = votes / totalVotes`. */
  votes: number;
  /** Phân bổ sharePercent theo từng hành (tổng = sharePercent). */
  elements: ContributionElementShare[];
  inputKind?: "Color" | "Material" | "Shape" | "DecorItem" | null;
  inputCode?: string | null;
  productId?: string | null;
}

export interface ContributionElementShare {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  percent: number;
}

/** Sản phẩm đã mua đang đặt trong phòng (trả kèm element-analysis). */
export interface PlacedProduct {
  placementId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  deliveryStatus: string;
  /** false = hàng đang giao → chỉ nằm trong lớp radar preview. */
  isDelivered: boolean;
  /** Phiếu đóng góp vào vector phòng (scale theo DecorItem code). */
  voteWeight: number;
}

/** Sản phẩm đã mua đủ điều kiện đặt phòng (GET /workspace/placements/purchasable). */
export interface PurchasedItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  deliveryStatus: string;
  isDelivered: boolean;
  placedWorkspaceProfileId?: string | null;
  placedWorkspaceName?: string | null;
}
