import { useQuery } from "@tanstack/react-query";
import { model3DApi } from "../api/model3d.api";

/**
 * Model 3D hiện tại của sản phẩm (nếu có). 404 (chưa từng tạo model) được coi là trạng thái
 * bình thường — không retry, không set lỗi hiển thị cho người dùng, chỉ đơn giản ẩn phần 3D.
 */
export function useProductModel3D(productId?: string) {
  const query = useQuery({
    queryKey: ["product-model-3d", productId],
    queryFn: async () => {
      if (!productId) throw new Error("No ID provided");
      const response = await model3DApi.getModel3D(productId);
      return response.data;
    },
    enabled: !!productId,
    retry: false,
    staleTime: 30_000,
  });

  const data = query.data;
  const model = data?.isSuccess ? data.data : undefined;

  // Chỉ coi là "có thể hiển thị" khi đã Succeeded, có URL file GLB, và owner chưa tắt hiển thị.
  const viewableModel =
    model && model.status === "Succeeded" && model.modelUrl && model.isEnabled ? model : undefined;

  return {
    model3D: viewableModel,
    loading: query.isLoading,
    query,
  };
}
