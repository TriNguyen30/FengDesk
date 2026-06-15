import fetchHttpClient from "@/lib/httpClient";
import { ApiResponse, Shop } from "../types/shop";

export async function getAllShopRequest() {
    const { data } = await fetchHttpClient.get<ApiResponse<Shop[]>>(`/stores`);
    return data;
}

export async function getShopRequestById(id: string) {
    const { data } = await fetchHttpClient.get<ApiResponse<Shop>>(`/stores/${id}`);
    return data;
}


