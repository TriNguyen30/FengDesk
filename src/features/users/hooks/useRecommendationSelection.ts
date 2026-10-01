import { useCallback, useMemo, useState } from "react";
import type { RecommendationItem } from "@/features/recommendation/types/recommendation";

export interface SelectedRecommendation {
  item: RecommendationItem;
  quantity: number;
}

const MAX_QUANTITY = 99;

/**
 * Giỏ chọn tạm của lưới "Đề xuất" (chưa phải giỏ hàng thật) — giữ thứ tự bấm chọn để món chọn sau
 * cùng nằm cuối danh sách tóm tắt. Sống theo WorkspaceCard (`key` = id phòng) nên đổi phòng là reset.
 */
export function useRecommendationSelection() {
  const [selection, setSelection] = useState<Map<string, SelectedRecommendation>>(new Map());

  const toggle = useCallback((item: RecommendationItem) => {
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(item.productId)) next.delete(item.productId);
      else next.set(item.productId, { item, quantity: 1 });
      return next;
    });
  }, []);

  /** Số lượng về 0 = bỏ chọn — stepper không cần nút xoá riêng. */
  const setQuantity = useCallback((productId: string, quantity: number) => {
    setSelection((prev) => {
      const current = prev.get(productId);
      if (!current) return prev;
      const next = new Map(prev);
      if (quantity <= 0) next.delete(productId);
      else next.set(productId, { ...current, quantity: Math.min(quantity, MAX_QUANTITY) });
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelection(new Map()), []);

  const lines = useMemo(() => [...selection.values()], [selection]);
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalPrice = lines.reduce((sum, l) => sum + (l.item.price ?? 0) * l.quantity, 0);
  // Có món chưa có giá (BE trả null) → tổng chỉ là tạm tính, UI ghi chú lại.
  const hasUnpricedItem = lines.some((l) => l.item.price == null);

  return {
    selection,
    lines,
    totalQuantity,
    totalPrice,
    hasUnpricedItem,
    maxQuantity: MAX_QUANTITY,
    toggle,
    setQuantity,
    clear,
  };
}

export type RecommendationSelection = ReturnType<typeof useRecommendationSelection>;
