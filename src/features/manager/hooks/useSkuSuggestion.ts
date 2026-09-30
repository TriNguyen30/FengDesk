import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/features/products/api/product.api";

/** Cùng bảng chữ Base32 Crockford với `SkuGenerator` ở BE (bỏ I, L, O, U). */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Dự phòng khi không gọi được API gợi ý (BE cũ chưa có endpoint, mất mạng…): sinh mã cùng dạng `FD-XXXXXXXX` ở
 * trình duyệt để ô SKU không bao giờ trống. 32⁸ tổ hợp nên gần như không trùng; lỡ trùng thì BE trả 400 lúc lưu.
 */
function localSku(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "FD-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * Mã SKU sàn gợi ý cho MỘT ô nhập. Không cache (`gcTime: 0`): mở form lần sau là một mã mới — hai biến thể không
 * được nhận cùng một gợi ý.
 */
export function useSkuSuggestion(enabled: boolean) {
  const query = useQuery({
    queryKey: ["sku-suggestion"],
    queryFn: async () => {
      const res = await productApi.suggestSku();
      if (!res.isSuccess || !res.data) throw new Error(res.message || "Không lấy được mã SKU");
      return res.data;
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const [fallback] = useState(localSku);
  return { suggestion: query.data ?? (query.isError ? fallback : undefined) };
}
