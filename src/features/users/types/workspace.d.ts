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

/**
 * Từ vựng mã hợp lệ cho tag picker "hiện trạng phòng hiện tại" — mã đã là tiếng Anh, hiển thị thẳng.
 * Riêng cho workspace — không dùng chung với vocabulary sản phẩm.
 */
export interface ElementInputVocabulary {
  colors: string[];
  materials: string[];
  decorItems: string[];
}

export interface ElementContributionDto {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  weight: number;
}

/** Kết quả AI phân loại 1 tag mới — đã chuẩn hóa (code sạch, weight clamp+normalize tổng=1). */
export interface ClassifyElementInputResult {
  code: string;
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
  kind: "status" | "detail" | "action";
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
