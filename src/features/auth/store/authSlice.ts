import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/features/auth/types/auth";
import { getAccessToken, getRefreshToken, getStoredUser, getStoredRole } from "@/utils";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  role: string | null;
  authModal: "login" | "signup" | "forgot_password" | null;
}

const initialState: AuthState = {
  token: getAccessToken(),
  refreshToken: getRefreshToken(),
  user: getStoredUser(),
  role: getStoredRole(),
  authModal: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set all session credentials at once
    setCredentials(
      state,
      action: PayloadAction<{ token: string; refreshToken: string; user: AuthUser }>,
    ) {
      const { token, refreshToken, user } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.role = user.role ?? null;
    },
    // Update only the access and refresh tokens (e.g. during automatic background refresh)
    updateTokens(state, action: PayloadAction<{ token: string; refreshToken: string }>) {
      const { token, refreshToken } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
    },
    // Open/Close auth modal
    setAuthModal(state, action: PayloadAction<"login" | "signup" | "forgot_password" | null>) {
      state.authModal = action.payload;
    },
    // Clear credentials on logout (pure action, side-effects should be handled by the caller)
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;
    },
  },
});

export const { setCredentials, updateTokens, setAuthModal, logout } = authSlice.actions;
export default authSlice.reducer;
