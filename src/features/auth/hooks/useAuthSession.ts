import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setRole, setToken, setUser } from "@/features/auth/store/authSlice";
import type { LoginResponseData } from "@/features/auth/types/auth";

export function useAuthSession() {
  const dispatch = useAppDispatch();

  const persistSession = useCallback(
    (data: LoginResponseData) => {
      dispatch(setToken(data.accessToken));
      dispatch(
        setUser({
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        }),
      );
      dispatch(setRole(data.role));
    },
    [dispatch],
  );

  return { persistSession };
}
