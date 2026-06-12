import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/features/auth/types/auth";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: string | null;
  authModal: "login" | "signup" | null;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");
const storedRole = localStorage.getItem("role");

const initialState: AuthState = {
  token: storedToken,
  user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
  role: storedRole as string | null,
  authModal: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("user");
      }
    },
    setRole(state, action: PayloadAction<string | null>) {
      state.role = action.payload;
      if (action.payload) {
        localStorage.setItem("role", action.payload);
      } else {
        localStorage.removeItem("role");
      }
    },
    setAuthModal(state, action: PayloadAction<"login" | "signup" | null>) {
      state.authModal = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.role = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    },
  },
});

export const { setToken, setUser, setRole, setAuthModal, logout } = authSlice.actions;
export default authSlice.reducer;
