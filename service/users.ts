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

export type AdminUserActivity = {
  user?: { last_login?: string | null; created_at?: string | null };
  window_days?: number;
  stats?: {
    leads_assigned_total?: number;
    leads_assigned_window?: number;
    leads_in_sequence?: number;
    leads_replied?: number;
    emails_sent_window?: number;
    emails_opened_window?: number;
    emails_replied_window?: number;
    linkedin_actions_window?: number;
    notes_window?: number;
    recordings_total?: number;
  };
  mailboxes?: {
    id: string;
    email_address: string;
    provider: string;
    status: string;
    daily_send_count: number;
    daily_send_limit: number;
  }[];
  icps?: { id: string; name: string }[];
  recent_activity?: {
    kind: string;
    title: string;
    summary: string;
    occurred_at?: string | null;
  }[];
};

export type AdminUserDetail = AdminUser & {
  created_at?: string | null;
  last_login?: string | null;
  monthly_lead_limit?: number | null;
  leads_used_this_month?: number;
  activity?: AdminUserActivity | null;
};

// Endpoint: GET /api/admin/users/<id>
export async function GetAdminUserDetailApi(
  userId: string,
): Promise<AdminUserDetail | null> {
  const { data } = await apiClient.get<
    AdminUserDetail | ApiEnvelope<AdminUserDetail>
  >(`${ADMIN_USERS_ENDPOINT}/${userId}`);
  return unwrapApiEnvelope(data) as AdminUserDetail;
}

/**
 * Edit a user's tier (sets their cap) and/or a custom monthly lead cap.
 * Endpoint: PATCH /api/admin/users/<id>
 */
export async function UpdateAdminUserApi(
  userId: string,
  payload: { tier?: string; monthly_lead_limit?: number | null },
): Promise<{ id: string; tier: string | null; monthly_lead_limit: number | null }> {
  const { data } = await apiClient.patch<
    | { id: string; tier: string | null; monthly_lead_limit: number | null }
    | ApiEnvelope<{ id: string; tier: string | null; monthly_lead_limit: number | null }>
  >(`${ADMIN_USERS_ENDPOINT}/${userId}`, payload);
  return unwrapApiEnvelope(data) as {
    id: string;
    tier: string | null;
    monthly_lead_limit: number | null;
  };
}

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
