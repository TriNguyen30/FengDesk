import { useQuery } from "@tanstack/react-query";
import { getElementInputCodes } from "../api/taxonomy.api";
import type { ElementInputKind } from "../types/taxonomy";

const TEN_MINUTES = 10 * 60 * 1000;

/** Vocabulary Vật liệu/Màu/Hình khối cho form "Đặc điểm sản phẩm". Cache 10' — vocabulary hiếm khi đổi. */
export function useElementInputCodes() {
  const query = useQuery({
    queryKey: ["element-input-codes"],
    queryFn: async () => {
      const res = await getElementInputCodes();
      return res.isSuccess && res.data ? res.data : [];
    },
    staleTime: TEN_MINUTES,
  });

  const byKind = (kind: ElementInputKind) => query.data?.find((g) => g.kind === kind)?.codes ?? [];

  return {
    materialCodes: byKind("Material"),
    colorCodes: byKind("Color"),
    shapeCodes: byKind("Shape"),
    loading: query.isLoading,
  };
}
