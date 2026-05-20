import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
} from "@/features/auth/types/auth";

export async function loginRequest(payload: LoginPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/login",
    payload,
  );
  return data;
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/register",
    payload,
  );
  return data;
}
