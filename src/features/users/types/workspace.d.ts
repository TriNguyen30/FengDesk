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

/** Một tín hiệu màu/vật liệu/hình khối (khớp element_input_map). */
export interface WorkspaceProfileInputDto {
  inputKind: "Color" | "Material" | "Shape";
  inputCode: string;
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
}

export interface WorkspaceElementAnalysis {
  workspaceProfileId: string;
  dominantNeed: string; // hành gap dương lớn nhất
  elements: ElementAnalysisRow[];
}
