import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoriesRequest,
  getCategoryByIdRequest,
  createCategoryRequest,
  updateCategoryRequest,
  deleteCategoryRequest,
} from "../api/category.api";
import type { CreateCategoryRequest, UpdateCategoryRequest } from "../types/category";

export function useCategoryList() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategoriesRequest();
      return response;
    },
  });

  const data = query.data;

  return {
    categories: data?.isSuccess && data.data ? data.data : [],
    loading: query.isLoading,
    failed: query.isError || (data && !data.isSuccess),
    query,
  };
}

export function useCategoryDetail(id?: string) {
  const query = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const response = await getCategoryByIdRequest(id);
      return response;
    },
    enabled: !!id,
  });

  const data = query.data;

  return {
    category: data?.isSuccess ? data.data : undefined,
    loading: query.isLoading,
    failed: query.isError || (data && !data.isSuccess),
    query,
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategoryRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategoryRequest(id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategoryRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
