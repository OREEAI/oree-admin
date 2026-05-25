import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import type { TokenPairEnvelope, TokenPairResponse } from "@/interface/auth";
import type { ApiEnvelope } from "@/interface/general";
import {
  clearAuth,
  loadAuth,
  mergeAuth,
  registerAuthHeaderSync,
  saveAuth,
} from "@/service/auth-storage";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://api.oreeai.com";

type RetriableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const plainApiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function setApiClientAuthHeader(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

setApiClientAuthHeader(loadAuth()?.access_token ?? null);
registerAuthHeaderSync(setApiClientAuthHeader);

function unwrapTokenResponse(
  payload: TokenPairEnvelope | TokenPairResponse,
): TokenPairResponse {
  return "data" in payload ? payload.data : payload;
}

let refreshPromise: Promise<ReturnType<typeof loadAuth>> | null = null;

apiClient.interceptors.request.use(async (config) => {
  let auth = loadAuth();

  // Access token cookie can expire before the refresh one does (cookies
  // don't carry JWT exp semantics). When that happens we still have a
  // valid refresh token, so rather than fire off an unauthenticated
  // request and burn a 401 round-trip, mint a fresh access token first.
  if (!auth?.access_token && auth?.refresh_token) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.access_token) {
      auth = refreshed;
    }
  }

  const token = auth?.access_token;
  if (token) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;
    const currentAuth = loadAuth();

    if (
      !originalRequest ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      !currentAuth?.refresh_token
    ) {
      throw error;
    }

    originalRequest._retry = true;

    const refreshed = await refreshAccessToken();

    if (!refreshed?.access_token) {
      clearAuth();
      throw error;
    }

    const headers = AxiosHeaders.from(originalRequest.headers);
    headers.set("Authorization", `Bearer ${refreshed.access_token}`);
    originalRequest.headers = headers;
    return apiClient(originalRequest);
  },
);

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = loadAuth();

    if (!current?.refresh_token) return null;

    try {
      const { data } = await plainApiClient.post<TokenPairEnvelope | TokenPairResponse>(
        "/api/auth/token/refresh",
        {
          refresh_token: current.refresh_token,
        },
      );
      const tokens = unwrapTokenResponse(data);
      const merged = mergeAuth(current, tokens);

      if (!merged) {
        clearAuth();
        return null;
      }

      saveAuth(merged);
      return merged;
    } catch {
      clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function flattenApiErrorMessages(value: unknown, fieldPath?: string): string[] {
  if (typeof value === "string") {
    return [fieldPath ? `${fieldPath}: ${value}` : value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenApiErrorMessages(entry, fieldPath));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const nextFieldPath =
        key === "errors" && !fieldPath
          ? fieldPath
          : fieldPath
            ? `${fieldPath}.${key}`
            : key;

      return flattenApiErrorMessages(nestedValue, nextFieldPath);
    });
  }

  return [];
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; error?: string; message?: string }
      | Record<string, unknown>
      | undefined;

    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;

    if (data && typeof data === "object") {
      const flattened = flattenApiErrorMessages(data).join(" ");

      if (flattened) return flattened;
    }

    if (typeof error.response?.data === "string" && error.response.data.trim()) {
      return error.response.data;
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isForbiddenError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function unwrapApiEnvelope<T>(payload: T | ApiEnvelope<T>): T {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    "message" in payload
  ) {
    return payload.data;
  }

  return payload as T;
}
