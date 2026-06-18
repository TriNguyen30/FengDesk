import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { axiosBaseConfig } from "@/config/axios.config";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/utils";
import { HTTP_STATUS } from "@/constants";
import { store } from "@/app/store";
import { updateTokens, logout } from "@/features/auth/store/authSlice";

export class FetchHttpClient {
  private baseURL: string;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      ...axiosBaseConfig,
      baseURL: this.baseURL,
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor() {
    this.axiosInstance.interceptors.request.use((config) => {
      const access_token = getAccessToken();
      if (access_token && !config.headers?.Authorization) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
      return config;
    });
  }

  private setupResponseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.status, response.config.url);
        return response;
      },
      async (error) => {
        console.log("API Error:", error.response?.status, error.config?.url, error.response?.data);

        const originalRequest = error.config;

        const noAuthRetryEndpoints = [
          "/Auth/login",
          "/Auth/register/initiate",
          "/Auth/register/verify",
          "/Auth/register/finalize",
          "/Auth/refresh",
          "/Auth/logout",
        ];

        const shouldSkipTokenRefresh = noAuthRetryEndpoints.some((endpoint) =>
          originalRequest?.url?.includes(endpoint),
        );

        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !shouldSkipTokenRefresh) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (token && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            window.dispatchEvent(new Event("auth:token_refreshed"));
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            window.dispatchEvent(new Event("auth:session_expired"));
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      store.dispatch(logout());
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/Auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.status !== HTTP_STATUS.OK || !response.data?.isSuccess) {
        clearSession();
        store.dispatch(logout());
        throw new Error("Refresh token expired");
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      setTokens(accessToken, newRefreshToken);
      store.dispatch(updateTokens({ token: accessToken, refreshToken: newRefreshToken }));
      return accessToken;
    } catch (error) {
      clearSession();
      store.dispatch(logout());
      throw error;
    }
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async get<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, {
      params: params ? { ...params } : {},
    });
  }

  async post<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: AxiosRequestConfig["data"],
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  async delete<T>(url: string, params?: AxiosRequestConfig["params"]): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      params: params ? { ...params } : undefined,
    });
  }
}

const fetchHttpClient = new FetchHttpClient(import.meta.env.VITE_API_BASE_URL || "");

export default fetchHttpClient;
