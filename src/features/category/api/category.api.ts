import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Category } from "../types/category";

export async function getCategoriesRequest() {
    const { data } = await fetchHttpClient.get<ApiResponse<Category[]>>("/categories");
    return data;
}