import type { AuthUser } from "@/interface/auth";
import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

export async function GetCurrentUserApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser | ApiEnvelope<AuthUser>>("/api/users/me");
  return unwrapApiEnvelope(data);
}
