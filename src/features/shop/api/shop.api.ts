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
  StoreInvitation,
  UserSearchItem,
} from "../types/shop";

export async function getAllShopRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<Shop[]>>(`/stores`);
  return data;
}

export async function getShopRequestById(id: string) {
  const { data } = await fetchHttpClient.get<ApiResponse<Shop>>(`/stores/${id}`);
  return data;
}

/** Các cửa hàng mà user hiện tại đồng sở hữu (kênh người bán). */
export async function getMyShopsRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<Shop[]>>(`/stores/mine`);
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

// ===== User search (dùng cho combobox mời nhân viên) =====

/** GET /api/users/search — BE yêu cầu tối thiểu 3 ký tự; trả field tối thiểu. */
export async function searchUsersRequest(q: string, limit = 10) {
  const { data } = await fetchHttpClient.get<ApiResponse<UserSearchItem[]>>(
    `/users/search`,
    { q, limit },
  );
  return data;
}

// ===== Invitation (góc nhìn người được mời) =====

export async function getMyStoreInvitationsRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<StoreInvitation[]>>(
    `/stores/staff/invitations/mine`,
  );
  return data;
}

export async function acceptStoreInvitationRequest(assignmentId: string) {
  const { data } = await fetchHttpClient.post<ApiResponse<StoreStaff>>(
    `/stores/staff/${assignmentId}/accept`,
  );
  return data;
}

export async function rejectStoreInvitationRequest(assignmentId: string) {
  const { data } = await fetchHttpClient.post<ApiResponse<null>>(
    `/stores/staff/${assignmentId}/reject`,
  );
  return data;
}
