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

export interface ProductElementRow {
  element: "Kim" | "Moc" | "Thuy" | "Hoa" | "Tho";
  value: number;
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
}
