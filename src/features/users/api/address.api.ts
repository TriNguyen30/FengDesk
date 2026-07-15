import fetchHttpClient from "@/lib/httpClient";
import { Address, CreateAddressDto, UpdateAddressDto } from "../types/address";
import type { ApiResponse } from "@/types/api";

export const getAddresses = async (): Promise<Address[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Address[]>>("/addresses");
  return response.data.data;
};

export const getAddressById = async (id: string): Promise<Address> => {
  const response = await fetchHttpClient.get<ApiResponse<Address>>(`/addresses/${id}`);
  return response.data.data;
};

export const createAddress = async (data: CreateAddressDto): Promise<Address> => {
  const response = await fetchHttpClient.post<ApiResponse<Address>>("/addresses", data);
  return response.data.data;
};

export const updateAddress = async (id: string, data: UpdateAddressDto): Promise<Address> => {
  const response = await fetchHttpClient.put<ApiResponse<Address>>(`/addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await fetchHttpClient.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: string): Promise<Address> => {
  const response = await fetchHttpClient.patch<ApiResponse<Address>>(
    `/addresses/${id}/set-default`,
  );
  return response.data.data;
};
