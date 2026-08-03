import { useQuery } from "@tanstack/react-query";
import { model3DApi } from "../api/model3d.api";

/**
 * Các model 3D đang được phép hiển thị, ánh xạ theo productImageId.
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
  const models = data?.isSuccess ? data.data : [];

  const viewableModels = models.filter(
    (model) => model.status === "Succeeded" && model.modelUrl && model.isEnabled,
  );

  return {
    models3D: viewableModels,
    loading: query.isLoading,
    query,
  };
}
