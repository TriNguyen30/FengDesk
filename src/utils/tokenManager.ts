const ACCESS_TOKEN = 'token';
const REFRESH_TOKEN = 'refreshToken';

const isBrowser = typeof window !== 'undefined';
export const getAccessToken = (): string | null => {
    if (!isBrowser) return null;
    return localStorage.getItem(ACCESS_TOKEN);
}
export const getRefreshToken = (): string | null => {
    if (!isBrowser) return null;
    return localStorage.getItem(REFRESH_TOKEN);
}
export const setTokens = (access_token: string, refresh_token: string): void => {
    if (!isBrowser) return;
    localStorage.setItem(ACCESS_TOKEN, access_token);
    localStorage.setItem(REFRESH_TOKEN, refresh_token);
}
export const clearTokens = (): void => {
    if (!isBrowser) return;
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
}