import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setRole, setToken, setUser } from "@/features/auth/store/authSlice";
import type { LoginResponseData } from "@/features/auth/types/auth";

export function useAuthSession() {
  const dispatch = useAppDispatch();

  const persistSession = useCallback(
    (data: LoginResponseData) => {
      dispatch(setToken(data.accessToken));
      localStorage.setItem("refreshToken", data.refreshToken);
      dispatch(setUser(data.user));
      dispatch(setRole(data.user.role ?? null));
    },
    [dispatch],
  );

  return { persistSession };
}
