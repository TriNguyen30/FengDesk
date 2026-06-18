import type { AuthUser } from "@/features/auth/types/auth";

const ACCESS_TOKEN = "token";
const REFRESH_TOKEN = "refreshToken";
const USER_KEY = "user";
const ROLE_KEY = "role";

const isBrowser = typeof window !== "undefined";

export const getAccessToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(ACCESS_TOKEN);
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(REFRESH_TOKEN);
};

export const getStoredUser = (): AuthUser | null => {
  if (!isBrowser) return null;
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch (error) {
    console.error("Failed to parse stored user from localStorage", error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const getStoredRole = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(ROLE_KEY);
};

export const setSession = (accessToken: string, refreshToken: string, user: AuthUser): void => {
  if (!isBrowser) return;
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(REFRESH_TOKEN, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user.role) {
    localStorage.setItem(ROLE_KEY, user.role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (!isBrowser) return;
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(REFRESH_TOKEN, refreshToken);
};

// Keep clearTokens for compatibility
export const clearTokens = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

export const clearSession = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
};
