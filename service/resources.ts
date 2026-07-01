import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

// ---------------------------------------------------------------------------
// Platform-wide resource lists (super-admin). Back the new management pages:
//   GET /api/admin/platform-stats
//   GET /api/admin/mailboxes  ?organization_id=&status=&search=
//   GET /api/admin/domains    ?organization_id=&status=
//   GET /api/admin/campaigns  ?organization_id=&status=
// ---------------------------------------------------------------------------

export type PlatformStats = {
  orgs: { total: number; active: number };
  leads: { total: number; unlinked_pool: number; org_linked: number };
  mailboxes: {
    total: number;
    active: number;
    warming: number;
    sent_today: number;
    capacity_today: number;
  };
  domains: { total: number; active: number };
  campaigns: { running: number; pending: number; failed_today: number };
  email_today: Record<string, number>;
  subscriptions: {
    by_tier: Record<string, number>;
    by_status: Record<string, number>;
  };
};

export async function GetPlatformStatsApi(): Promise<PlatformStats | null> {
  try {
    const { data } = await apiClient.get<PlatformStats | ApiEnvelope<PlatformStats>>(
      "/api/admin/platform-stats",
    );
    return unwrapApiEnvelope(data) as PlatformStats;
  } catch {
    return null;
  }
}

export type LeadsStats = {
  total: number;
  linked: number;
  unlinked_pool: number;
  total_org_uses: number;
  by_source: Record<string, number>;
  by_enrichment_source: Record<string, number>;
  by_validation_status: Record<string, number>;
  reuse: {
    reused_leads: number;
    shared_2_orgs: number;
    shared_3plus_orgs: number;
    reuse_uses: number;
  };
  top_reused: { name: string; company: string; orgs: number }[];
};

export async function GetLeadsStatsApi(): Promise<LeadsStats | null> {
  try {
    const { data } = await apiClient.get<LeadsStats | ApiEnvelope<LeadsStats>>(
      "/api/admin/leads-stats",
    );
    return unwrapApiEnvelope(data) as LeadsStats;
  } catch {
    return null;
  }
}

export type AdminMailbox = {
  id: string;
  email_address: string;
  organization_id: string | null;
  organization_name: string;
  provider: string;
  status: string;
  assigned_user: string | null;
  warmup_status: string;
  warmup_day: number;
  daily_send_count: number;
  daily_send_limit: number;
  last_used_at: string | null;
  open_tracking_enabled: boolean;
  click_tracking_enabled: boolean;
  can_send: boolean;
};

export async function GetAdminMailboxesApi(params?: {
  organizationId?: string;
  status?: string;
  search?: string;
}): Promise<AdminMailbox[]> {
  const { data } = await apiClient.get<AdminMailbox[] | ApiEnvelope<AdminMailbox[]>>(
    "/api/admin/mailboxes",
    {
      params: {
        organization_id: params?.organizationId,
        status: params?.status,
        search: params?.search,
      },
    },
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export type AdminDomain = {
  id: string;
  domain_name: string;
  organization_id: string | null;
  organization_name: string;
  provider: string;
  status: string;
  dns_verified: boolean;
  tracking_subdomain: string;
  expires_at: string | null;
  last_sync_at: string | null;
  last_sync_error: string;
};

export async function GetAdminDomainsApi(params?: {
  organizationId?: string;
  status?: string;
}): Promise<AdminDomain[]> {
  const { data } = await apiClient.get<AdminDomain[] | ApiEnvelope<AdminDomain[]>>(
    "/api/admin/domains",
    { params: { organization_id: params?.organizationId, status: params?.status } },
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export type AdminCampaign = {
  id: string;
  name: string;
  organization_id: string | null;
  organization_name: string;
  icp_name: string;
  user: string | null;
  lead_count: number;
  status: string;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string;
};

export async function GetAdminCampaignsApi(params?: {
  organizationId?: string;
  status?: string;
}): Promise<AdminCampaign[]> {
  const { data } = await apiClient.get<AdminCampaign[] | ApiEnvelope<AdminCampaign[]>>(
    "/api/admin/campaigns",
    { params: { organization_id: params?.organizationId, status: params?.status } },
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}
