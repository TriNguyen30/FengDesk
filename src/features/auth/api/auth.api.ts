import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  LoginPayload,
  LoginResponseData,
  GoogleLoginPayload,
  RegisterResponseData,
  RegisterInitiatePayload,
  RegisterVerifyPayload,
  RegisterFinalizePayload,
  MyProfile,
  LogoutPayload,
  RefreshTokenPayload,
} from "@/features/auth/types/auth";

export async function loginRequest(payload: LoginPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/login",
    payload,
  );
  return data;
}

export async function loginWithGoogleRequest(payload: GoogleLoginPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/google",
    payload,
  );
  return data;
}

export async function registerInitiateRequest(payload: RegisterInitiatePayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<RegisterResponseData>>(
    "/Auth/register/initiate",
    payload,
  );
  return data;
}

export async function registerVerifyRequest(payload: RegisterVerifyPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<RegisterResponseData>>(
    "/Auth/register/verify",
    payload,
  );
  return data;
}

export async function registerFinalizeRequest(payload: RegisterFinalizePayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<RegisterResponseData>>(
    "/Auth/register/finalize",
    payload,
  );
  return data;
}

export async function myProfileRequest() {
  const { data } = await fetchHttpClient.get<ApiResponse<MyProfile>>("/Auth/me");
  return data;
}

/** Cập nhật giờ sinh (HH:mm, null để xóa) — dùng cho Tứ Trụ/Bát Tự. */
export async function updateBirthTimeRequest(birthTime: string | null) {
  const { data } = await fetchHttpClient.put<ApiResponse<MyProfile>>("/Auth/me/birth-time", {
    birthTime,
  });
  return data;
}
export async function logoutRequest(payload: LogoutPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<null>>("/Auth/logout", payload);
  return data;
}

export async function refreshTokenRequest(payload: RefreshTokenPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/refresh",
    payload,
  );
  return data;
}
