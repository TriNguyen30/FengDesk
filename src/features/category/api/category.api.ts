import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "../types/category";

export async function getCategoriesRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<Category[]>>("/categories");
  return data;
}

export async function getCategoryByIdRequest(id: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<Category>>(`/categories/${id}`);
  return data;
}

export async function createCategoryRequest(payload: CreateCategoryRequest) {
  const { data } = await fetchHttpClient.post<ApiResponse<Category>>("/categories", payload);
  return data;
}

export async function updateCategoryRequest(id: string, payload: UpdateCategoryRequest) {
  const { data } = await fetchHttpClient.put<ApiResponse<Category>>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategoryRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<boolean>>(`/categories/${id}`);
  return data;
}
