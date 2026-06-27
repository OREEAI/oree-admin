import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string | null;
  organization_name: string;
  status: string; // active | inactive
  tier: string; // the user's effective subscription tier
  subscription_status: string; // org subscription status (active/trialing/…)
};

/**
 * List every user across all organisations, with account status +
 * subscription. Super-admin only.
 *
 * Endpoint: GET /api/admin/users
 * Payload : { data: AdminUser[] } | AdminUser[]
 */
const ADMIN_USERS_ENDPOINT = "/api/admin/users";

export async function GetAdminUsersApi(orgId?: string): Promise<AdminUser[]> {
  const url = orgId
    ? `${ADMIN_USERS_ENDPOINT}?organization_id=${encodeURIComponent(orgId)}`
    : ADMIN_USERS_ENDPOINT;
  const { data } = await apiClient.get<AdminUser[] | ApiEnvelope<AdminUser[]>>(
    url,
  );
  // handle_response omits the `data` key for an empty list, so coerce to an
  // array rather than hand back the bare envelope.
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}
