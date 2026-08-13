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
  UpdateProfilePayload,
  ChangeEmailTokenData,
  ForgotPasswordPayload,
  ForgotPasswordVerifyPayload,
  ForgotPasswordResetPayload,
  ForgotPasswordVerifyResponseData,
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
/** Cập nhật họ tên / SĐT / giới tính / ngày sinh. Email đổi qua luồng OTP riêng bên dưới. */
export async function updateProfileRequest(payload: UpdateProfilePayload) {
  const { data } = await fetchHttpClient.put<ApiResponse<MyProfile>>("/Auth/me", payload);
  return data;
}

// ===== Đổi email — 4 bước tuần tự, mỗi bước cần kết quả của bước trước =====

/** B1: gửi OTP tới email HIỆN TẠI. */
export async function initiateEmailChangeRequest() {
  const { data } = await fetchHttpClient.post<ApiResponse<null>>("/Auth/me/email/initiate", {});
  return data;
}

/** B2: xác thực OTP email hiện tại → nhận changeEmailToken. */
export async function verifyCurrentEmailRequest(otp: string) {
  const { data } = await fetchHttpClient.post<ApiResponse<ChangeEmailTokenData>>(
    "/Auth/me/email/verify-current",
    { otp },
  );
  return data;
}

/** B3: khai email mới → BE gửi OTP tới hòm thư đó. */
export async function requestNewEmailRequest(changeEmailToken: string, newEmail: string) {
  const { data } = await fetchHttpClient.post<ApiResponse<null>>("/Auth/me/email/request-new", {
    changeEmailToken,
    newEmail,
  });
  return data;
}

/** B4: xác thực OTP email mới → đổi email, BE cấp lại cặp token cho phiên hiện tại. */
export async function confirmNewEmailRequest(changeEmailToken: string, otp: string) {
  const { data } = await fetchHttpClient.post<ApiResponse<LoginResponseData>>(
    "/Auth/me/email/confirm",
    { changeEmailToken, otp },
  );
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

export async function forgotPasswordRequest(payload: ForgotPasswordPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<void>>(
    "/Auth/forgot-password/initiate",
    payload,
  );
  return data;
}

export async function verifyForgotPasswordRequest(payload: ForgotPasswordVerifyPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<ForgotPasswordVerifyResponseData>>(
    "/Auth/forgot-password/verify",
    payload,
  );
  return data;
}

export async function resetForgotPasswordRequest(payload: ForgotPasswordResetPayload) {
  const { data } = await fetchHttpClient.post<ApiResponse<void>>(
    "/Auth/forgot-password/reset",
    payload,
  );
  return data;
}