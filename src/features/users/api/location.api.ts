import fetchHttpClient from "@/lib/httpClient";
import { Provinces, District, Ward } from "../types/location";
import type { ApiResponse } from "@/types/api";

export const getProvinces = async (): Promise<Provinces[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Provinces[]>>("/locations/provinces");
  return response.data.data;
};

export const getDistrictsByProvinceId = async (provinceId: string): Promise<District[]> => {
  const response = await fetchHttpClient.get<ApiResponse<District[]>>(
    `/locations/provinces/${provinceId}/districts`,
  );
  return response.data.data;
};

export const getWardsByDistrictId = async (districtId: string): Promise<Ward[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Ward[]>>(
    `/locations/districts/${districtId}/wards`,
  );
  return response.data.data;
};
