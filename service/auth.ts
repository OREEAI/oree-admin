import { plainApiClient } from "@/service/api";
import type {
  LoginEnvelope,
  LoginRequest,
  LoginResponse,
  TokenPairEnvelope,
  TokenPairResponse,
  TokenRefreshRequest,
} from "@/interface/auth";

export {
  clearAuth,
  getAuthSnapshot,
  hasAccessToken,
  isAuthenticated,
  loadAuth,
  mergeAuth,
  saveAuth,
  subscribeToAuthChanges,
} from "@/service/auth-storage";

function unwrapLoginResponse(payload: LoginEnvelope | LoginResponse): LoginResponse {
  return "data" in payload ? payload.data : payload;
}

function unwrapTokenResponse(
  payload: TokenPairEnvelope | TokenPairResponse,
): TokenPairResponse {
  return "data" in payload ? payload.data : payload;
}

export async function LoginUserApi(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await plainApiClient.post<LoginEnvelope | LoginResponse>(
    "/api/auth/login",
    payload,
  );
  return unwrapLoginResponse(data);
}

export async function RefreshTokenApi(
  payload: TokenRefreshRequest,
): Promise<TokenPairResponse> {
  const { data } = await plainApiClient.post<TokenPairEnvelope | TokenPairResponse>(
    "/api/auth/token/refresh",
    payload,
  );
  return unwrapTokenResponse(data);
}
