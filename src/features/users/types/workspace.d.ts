export interface Workspace {
  id: string;
  userId: string;
  name: string;
  workspaceTypeId: string;
  locationType: string;
  styleCode: string;
  lighting: string;
  deskType: string;
  deskOrientation: string;
  roomFacingDirection: string;
  workPurpose: string;
  fengShuiElement: string;
  deskArea: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CreateWorkspaceDto {
  name: string;
  locationType: string;
  workspaceTypeId: string;
  styleCode: string;
  lighting: string;
  deskType: string;
  deskOrientation: string;
  roomFacingDirection: string;
  workPurpose: string;
  fengShuiElement: string;
  deskArea: number;
  isDefault: boolean;
}

export interface UpdateWorkspaceDto {
  name: string;
  locationType: string;
  workspaceTypeId: string;
  styleCode: string;
  lighting: string;
  deskType: string;
  deskOrientation: string;
  roomFacingDirection: string;
  workPurpose: string;
  fengShuiElement: string;
  deskArea: number;
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
