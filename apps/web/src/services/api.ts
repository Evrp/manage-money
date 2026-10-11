import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth.store";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

type AuthRecoveryHandler = () => Promise<string | null>;

let authRecoveryHandler: AuthRecoveryHandler | null = null;
let authRecoveryPromise: Promise<string | null> | null = null;

export const registerAuthRecoveryHandler = (handler: AuthRecoveryHandler) => {
  authRecoveryHandler = handler;
  return () => {
    if (authRecoveryHandler === handler) authRecoveryHandler = null;
  };
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const url = config?.url || "";
    const isAuthenticationRequest =
      url.includes("/auth/line") || url.includes("/auth/development");

    if (error.response?.status !== 401 || !config || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    if (config._authRetry || !authRecoveryHandler) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    config._authRetry = true;
    try {
      if (!authRecoveryPromise) {
        authRecoveryPromise = authRecoveryHandler().finally(() => {
          authRecoveryPromise = null;
        });
      }

      const token = await authRecoveryPromise;
      if (!token) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    } catch (recoveryError: any) {
      if (!recoveryError.response || recoveryError.response.status === 401) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(recoveryError);
    }
  },
);

export default api;
