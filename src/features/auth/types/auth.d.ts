export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  /** Chuỗi role gộp (bit-flag), vd "Customer, GardenOwner". Giữ cho tương thích cũ. */
  role?: string;
  /** Danh sách role tách rời từ BE (/me, login), vd ["Customer","GardenOwner"]. */
  roles?: string[];
  dateOfBirth?: string;
  gender?: string;
  occupationCode?: string | null;
  occupationNameVi?: string | null;
  fengShui?: FengShui;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  /** ID token (JWT "credential") trả về từ Google Identity Services ở FE. */
  idToken: string;
}

export interface FengShui {
  element: string | null;
  kuaNumber: number | null;
  kuaGroup: string | null;
  favorableDirections: string[];
}

export interface MyProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: string;
  roles?: string[];
  dateOfBirth?: string;
  /** Giờ sinh "HH:mm:ss" — cần cho Tứ Trụ/Bát Tự đầy đủ. Null/undefined nếu chưa khai. */
  birthTime?: string | null;
  gender?: string;
  /** Mã nghề đang chọn, vd "IT". Null = chưa khai (tuỳ chọn, không chặn gì). */
  occupationCode?: string | null;
  /** Tên nghề tiếng Việt — BE trả sẵn để FE khỏi tra lại bảng nghề chỉ để hiện một dòng. */
  occupationNameVi?: string | null;
  fengShui?: FengShui;
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

/** Body PUT /Auth/me. Enum gender gửi dạng chuỗi ("Male"/"Female"/…) — BE dùng JsonStringEnumConverter. */
export interface UpdateProfilePayload {
  fullName: string;
  /** Null = xóa số điện thoại. */
  phone: string | null;
  gender: "Unspecified" | "Male" | "Female" | "Other";
  /** ISO date ("YYYY-MM-DD"). Null = xóa ngày sinh. Đổi giá trị này làm tính lại mệnh/ngũ hành. */
  dateOfBirth: string | null;
  /**
   * Mã nghề, vd "IT". Tuỳ chọn.
   *
   * Ba trạng thái KHÁC NHAU, đừng gộp: `undefined` = giữ nguyên nghề đang có, `""` = xóa nghề,
   * có mã = đổi sang nghề đó. BE phân biệt như vậy vì `PUT` này ghi đè cả hồ sơ - nếu `undefined`
   * cũng xóa thì mọi màn hình cũ chưa biết field này sẽ âm thầm xóa nghề của user mỗi lần họ sửa
   * số điện thoại.
   */
  occupationCode?: string | null;
}

/** Kết quả bước xác thực OTP email hiện tại — token ràng 3 bước sau vào cùng một phiên. */
export interface ChangeEmailTokenData {
  changeEmailToken: string;
  expiresAt: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordVerifyPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordVerifyResponseData {
  message?: string;
  resetPasswordToken?: string;
}

export interface ForgotPasswordResetPayload {
  resetPasswordToken: string;
  newPassword: string;
}