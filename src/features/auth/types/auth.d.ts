export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  /** Chuỗi role gộp (bit-flag), vd "Customer, GardenOwner". Giữ cho tương thích cũ. */
  role?: string;
  /** Danh sách role tách rời từ BE (/me, login), vd ["Customer","GardenOwner"]. */
  roles?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MyProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
}

export interface LoginResponseData {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterResponseData {
  message?: string;
  registrationToken?: string;
}

export interface RegisterInitiatePayload {
  email: string;
}

export interface RegisterVerifyPayload {
  email: string;
  otp: string;
}

export interface RegisterFinalizePayload {
  registrationToken: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: number;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}
