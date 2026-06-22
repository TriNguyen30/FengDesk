import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import type {
  GetProductsParams,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductItemRequest,
  UpdateProductItemRequest,
  AddProductImageRequest,
  SetProductCategoriesRequest,
  SetProductTagsRequest,
  UpdateProductFengShuiRequest,
} from "../types/product";

export function useProductList(params: GetProductsParams = {}) {
  const query = useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await productApi.getProducts(params);
      return response.data;
    },
  });

  const data = query.data;

  return {
    products: data?.isSuccess && data.data ? data.data.items : [],
    loading: query.isLoading,
    failed: query.isError || (data && !data.isSuccess),
    totalCount: data?.isSuccess && data.data ? data.data.totalCount : 0,
    query,
  };
}

export function useProductDetail(id?: string) {
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const response = await productApi.getProductById(id);
      return response.data;
    },
    enabled: !!id,
  });

  const data = query.data;

  return {
    product: data?.isSuccess ? data.data : undefined,
    loading: query.isLoading,
    failed: query.isError || (data && !data.isSuccess),
    query,
  };
}

export function useProductPrimaryImage(productId?: string) {
  const { product, loading, failed } = useProductDetail(productId);
  return {
    imageUrl: product?.images?.[0]?.url,
    loading,
    failed,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productApi.updateProduct(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateProductItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateProductItemRequest }) =>
      productApi.createProductItem(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useUpdateProductItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      itemId,
      data,
    }: {
      id: string;
      itemId: string;
      data: UpdateProductItemRequest;
    }) => productApi.updateProductItem(id, itemId, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProductItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      productApi.deleteProductItem(id, itemId),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useAddProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddProductImageRequest | FormData }) =>
      productApi.addProductImage(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      productApi.deleteProductImage(id, imageId),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useUpdateProductCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetProductCategoriesRequest }) =>
      productApi.updateProductCategories(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useUpdateProductTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetProductTagsRequest }) =>
      productApi.updateProductTags(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}

export function useUpdateProductFengShui() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductFengShuiRequest }) =>
      productApi.updateProductFengShui(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}
