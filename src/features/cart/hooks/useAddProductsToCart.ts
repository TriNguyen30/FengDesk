import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { productApi } from "@/features/products/api/product.api";
import type { ProductDetail, ProductItem } from "@/features/products/types/product";
import { useCart } from "./useCart";

export interface ProductCartLine {
  productId: string;
  productName: string;
  quantity: number;
}

export interface AddProductsResult {
  /** Id dòng giỏ hàng (CartItem.id) của các món đã thêm — truyền thẳng cho /checkout. */
  cartItemIds: string[];
  /** Tên các món không thêm được (hết hàng / lỗi) — để báo lại cho user. */
  skipped: string[];
}

/** Biến thể mặc định: biến thể đầu tiên đủ tồn kho cho số lượng cần, không có thì biến thể còn hàng bất kỳ. */
function pickVariant(items: ProductItem[], quantity: number): ProductItem | null {
  return items.find((i) => i.stock >= quantity) ?? items.find((i) => i.stock > 0) ?? null;
}

/**
 * Thêm nhiều sản phẩm vào giỏ một lượt — giỏ nhận `productItemId` (biến thể) nên phải đọc chi tiết từng
 * sản phẩm để lấy biến thể mặc định. Cùng queryKey ["product", id] với `useProductDetail` để dùng lại cache.
 *
 * Thêm TUẦN TỰ: gọi song song thì các request đầu có thể cùng tạo giỏ mới cho user chưa có giỏ.
 */
export function useAddProductsToCart() {
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);

  const addProducts = useCallback(
    async (lines: ProductCartLine[]): Promise<AddProductsResult> => {
      setPending(true);
      const cartItemIds: string[] = [];
      const skipped: string[] = [];
      try {
        for (const line of lines) {
          try {
            const detail = await queryClient.fetchQuery({
              queryKey: ["product", line.productId],
              queryFn: async () => (await productApi.getProductById(line.productId)).data,
            });
            const product: ProductDetail | undefined = detail?.isSuccess ? detail.data : undefined;
            const variant = product ? pickVariant(product.items, line.quantity) : null;
            if (!variant) {
              skipped.push(line.productName);
              continue;
            }
            const quantity = Math.min(line.quantity, variant.stock);
            const response = await addItem({ productItemId: variant.id, quantity });
            const cartItem = response?.isSuccess
              ? response.data?.items.find((i) => i.productItemId === variant.id)
              : undefined;
            if (cartItem) cartItemIds.push(cartItem.id);
            else skipped.push(line.productName);
          } catch (error) {
            console.error("Add product to cart failed:", line.productId, error);
            skipped.push(line.productName);
          }
        }
      } finally {
        setPending(false);
      }
      return { cartItemIds, skipped };
    },
    [addItem, queryClient],
  );

  return { addProducts, pending };
}
