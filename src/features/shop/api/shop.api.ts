import fetchHttpClient from "@/lib/httpClient";
import {
  ApiResponse,
  Shop,
  CreateShopDto,
  UpdateShopDto,
  StoreAddress,
  CreateStoreAddressDto,
  UpdateStoreAddressDto,
  StoreStaff,
  AssignStaffDto,
} from "../types/shop";

export async function getAllShopRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<Shop[]>>(`/stores`);
  return data;
}

export async function getShopRequestById(id: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<Shop>>(`/stores/${id}`);
  return data;
}

export async function createShopRequest(payload: CreateShopDto) {
  const { data } = await fetchHttpClient.post<ApiResponse<Shop>>(`/stores`, payload);
  return data;
}

export async function updateShopRequest(id: string, payload: UpdateShopDto) {
  const { data } = await fetchHttpClient.put<ApiResponse<Shop>>(`/stores/${id}`, payload);
  return data;
}

export async function deleteShopRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(`/stores/${id}`);
  return data;
}

export async function hardDeleteShopRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(`/stores/${id}/hard`);
  return data;
}

export async function createShopAddressRequest(id: string, payload: CreateStoreAddressDto) {
  const { data } = await fetchHttpClient.post<ApiResponse<StoreAddress>>(
    `/stores/${id}/address`,
    payload,
  );
  return data;
}

export async function updateShopAddressRequest(id: string, payload: UpdateStoreAddressDto) {
  const { data } = await fetchHttpClient.put<ApiResponse<StoreAddress>>(
    `/stores/${id}/address`,
    payload,
  );
  return data;
}

export async function deleteShopAddressRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(`/stores/${id}/address`);
  return data;
}

export async function hardDeleteShopAddressRequest(id: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(`/stores/${id}/address/hard`);
  return data;
}

export async function getShopStaffRequest(id: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<StoreStaff[]>>(`/stores/${id}/staff`);
  return data;
}

export async function addShopStaffRequest(id: string, payload: AssignStaffDto) {
  const { data } = await fetchHttpClient.post<ApiResponse<StoreStaff>>(
    `/stores/${id}/staff`,
    payload,
  );
  return data;
}

export async function removeShopStaffRequest(id: string, assignmentId: string) {
  const { data } = await fetchHttpClient.delete<ApiResponse<null>>(
    `/stores/${id}/staff/${assignmentId}`,
  );
  return data;
}
