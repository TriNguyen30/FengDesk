import { useCallback } from "react";
import { useAppDispatch } from "@/app/store";
import { setCredentials } from "@/features/auth/store/authSlice";
import type { LoginResponseData } from "@/features/auth/types/auth";
import { setSession } from "@/utils";

export function useAuthSession() {
  const dispatch = useAppDispatch();

  const persistSession = useCallback(
    (data: LoginResponseData) => {
      // 1. Perform storage side effects
      setSession(data.accessToken, data.refreshToken, data.user);

      // 2. Dispatch a single atomic state update action
      dispatch(
        setCredentials({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        }),
      );
    },
    [dispatch],
  );

  return { persistSession };
}
