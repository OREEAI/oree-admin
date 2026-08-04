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
  /** Queued/scheduled sends still in front of this mailbox (Ben Aug 3 —
   * watch Anita's boxes drain during the mailbox move). */
  pending_sends: number;
  /** Replies-only mode: sending stops, reply polling continues. */
  sending_paused: boolean;
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

export type AdminMailboxDetail = AdminMailbox & {
  warmup_start_date: string | null;
  warmup_completed_at: string | null;
  warmup_days_remaining: number;
  send_priority: number;
  next_send_at: string | null;
  is_oauth: boolean;
  is_smtp: boolean;
  token_expiry: string | null;
  smtp_host: string;
  smtp_port: number | null;
  imap_host: string;
  created_at: string | null;
  updated_at: string | null;
  metrics: Record<string, number>;
  /** What recipients see as the sender — resolved (may come from the assigned member). */
  display_name?: string;
  /** Only the explicit override, empty when it's falling back. */
  display_name_explicit?: string;
  bounce_breakdown?: Record<string, number>;
  deliverability_pct?: number | null;
  reputation_bounces?: number;
  failed_sends?: number;
  pending_sends?: number;
};

export async function GetAdminMailboxDetailApi(id: string): Promise<AdminMailboxDetail | null> {
  try {
    const { data } = await apiClient.get<AdminMailboxDetail | ApiEnvelope<AdminMailboxDetail>>(
      `/api/admin/mailboxes/${id}`,
    );
    return unwrapApiEnvelope(data) as AdminMailboxDetail;
  } catch {
    return null;
  }
}

export async function MailboxActionApi(id: string, action: string, extra?: Record<string, unknown>) {
  const { data } = await apiClient.post(`/api/admin/mailboxes/${id}/action`, { action, ...(extra ?? {}) });
  return unwrapApiEnvelope(data);
}

export type AdminDomainDetail = AdminDomain & {
  // Which provider sends this domain's mail — decides whether DKIM is a manual
  // paste (google) or fully automatic (twentyi).
  mail_provider: "google" | "twentyi";
  dkim_managed: boolean;
  dkim_selector: string;
  dkim_key_present: boolean;
  registrar_id: string;
  provider_domain_key: string;
  purchased_at: string | null;
  created_at: string | null;
  mailboxes: { email: string; status: string; warmup: string }[];
};

export async function GetAdminDomainDetailApi(id: string): Promise<AdminDomainDetail | null> {
  try {
    const { data } = await apiClient.get<AdminDomainDetail | ApiEnvelope<AdminDomainDetail>>(
      `/api/admin/domains/${id}`,
    );
    return unwrapApiEnvelope(data) as AdminDomainDetail;
  } catch {
    return null;
  }
}

export type AdminCampaignDetail = AdminCampaign & {
  delivered: number;
  celery_task_id: string;
  result_summary: Record<string, unknown>;
  leads: { name: string; company: string; status: string }[];
};

export async function GetAdminCampaignDetailApi(id: string): Promise<AdminCampaignDetail | null> {
  try {
    const { data } = await apiClient.get<AdminCampaignDetail | ApiEnvelope<AdminCampaignDetail>>(
      `/api/admin/campaigns/${id}`,
    );
    return unwrapApiEnvelope(data) as AdminCampaignDetail;
  } catch {
    return null;
  }
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

/** Cancel a pending/running campaign run (revokes the Celery task). */
export async function CancelAdminCampaignApi(id: string): Promise<{ id: string; status: string }> {
  const { data } = await apiClient.post<
    { id: string; status: string } | ApiEnvelope<{ id: string; status: string }>
  >(`/api/admin/campaigns/${id}/cancel`);
  return unwrapApiEnvelope(data) as { id: string; status: string };
}

/** Retry a failed/cancelled/short run — re-dispatches sourcing for the gap. */
export async function RetryAdminCampaignApi(
  id: string,
): Promise<{ id: string; status: string; retry_gap: number; delivered: number }> {
  const { data } = await apiClient.post<
    | { id: string; status: string; retry_gap: number; delivered: number }
    | ApiEnvelope<{ id: string; status: string; retry_gap: number; delivered: number }>
  >(`/api/admin/campaigns/${id}/retry`);
  return unwrapApiEnvelope(data) as {
    id: string;
    status: string;
    retry_gap: number;
    delivered: number;
  };
}

// ---------------------------------------------------------------------------
// Pending invites (console)
// ---------------------------------------------------------------------------

export type AdminInvite = {
  id: string;
  email: string;
  role: string;
  tier: string | null;
  organization_name: string;
  invited_by: string | null;
  created_at: string | null;
  expires_at: string | null;
  expired: boolean;
};

export async function GetAdminInvitesApi(): Promise<AdminInvite[]> {
  const { data } = await apiClient.get<AdminInvite[] | ApiEnvelope<AdminInvite[]>>(
    "/api/admin/invites",
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export async function RevokeAdminInviteApi(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/invites/${id}`);
}

// ---------------------------------------------------------------------------
// CRM connections across orgs
// ---------------------------------------------------------------------------

export type AdminCrmConnection = {
  id: string;
  organization_id: string | null;
  organization_name: string;
  provider: string;
  status: string;
  region: string;
  api_domain: string;
  token_expiry: string | null;
  token_expired: boolean;
  connected_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function GetAdminCrmConnectionsApi(): Promise<AdminCrmConnection[]> {
  const { data } = await apiClient.get<AdminCrmConnection[] | ApiEnvelope<AdminCrmConnection[]>>(
    "/api/admin/crm-connections",
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

// ---------------------------------------------------------------------------
// Celery / queue health
// ---------------------------------------------------------------------------

export type CeleryHealth = {
  workers: { name: string; active: number; reserved: number }[];
  worker_count: number;
  workers_ok: boolean;
  queue_depth: number | null;
  running: { worker: string; name: string; time_start: number | null }[];
};

export async function GetCeleryHealthApi(): Promise<CeleryHealth> {
  const { data } = await apiClient.get<CeleryHealth | ApiEnvelope<CeleryHealth>>(
    "/api/admin/celery/health",
  );
  return unwrapApiEnvelope(data) as CeleryHealth;
}

// ---------------------------------------------------------------------------
// Webhook events (console Webhooks page)
// ---------------------------------------------------------------------------

export type WebhookEventRow = {
  id: string;
  source: string;
  source_event_id: string;
  event_type: string;
  processing_status: string;
  retry_count: number;
  processed_at: string | null;
  created_at: string;
};

export type WebhookEventDetail = WebhookEventRow & {
  payload?: Record<string, unknown>;
  processing_error?: string;
  organization_name?: string | null;
};

export async function GetWebhookEventsApi(params: {
  page?: number;
  source?: string;
  processing_status?: string;
}): Promise<{ data: WebhookEventRow[]; count: number; total_pages: number }> {
  const { data } = await apiClient.get<{
    data: WebhookEventRow[];
    count: number;
    total_pages: number;
  }>("/api/admin/webhooks", {
    params: {
      page: params.page ?? 1,
      page_size: 25,
      ...(params.source ? { source: params.source } : {}),
      ...(params.processing_status ? { processing_status: params.processing_status } : {}),
    },
  });
  return data;
}

export async function GetWebhookEventApi(id: string): Promise<WebhookEventDetail> {
  const { data } = await apiClient.get<WebhookEventDetail | ApiEnvelope<WebhookEventDetail>>(
    `/api/admin/webhooks/${id}`,
  );
  return unwrapApiEnvelope(data) as WebhookEventDetail;
}

export async function ReplayWebhookEventApi(id: string): Promise<{ status: string }> {
  const { data } = await apiClient.post<{ status: string } | ApiEnvelope<{ status: string }>>(
    `/api/admin/webhooks/${id}/replay`,
  );
  return unwrapApiEnvelope(data) as { status: string };
}

/** Run DNS setup + verification for a domain: writes missing SPF/DKIM/
 * DMARC/tracking records at the registrar and refreshes the flags. */
export type DomainDnsResult = {
  domain_id: string;
  domain_name: string;
  dns_verified: boolean;
  status: string;
  sync_error: string | null;
};

export async function ConfigureDomainDnsApi(id: string): Promise<DomainDnsResult> {
  const { data } = await apiClient.post<DomainDnsResult | ApiEnvelope<DomainDnsResult>>(
    `/api/admin/domains/${id}/configure-dns`,
  );
  return unwrapApiEnvelope(data) as DomainDnsResult;
}

/** Publish a DKIM TXT value (v=DKIM1; k=rsa; p=…) to a domain's zone. */
export async function SetDomainDkimApi(
  id: string,
  dkimValue: string,
): Promise<{ id: string; dkim_key_present: boolean; dns_verified: boolean; status: string }> {
  const { data } = await apiClient.post<
    | { id: string; dkim_key_present: boolean; dns_verified: boolean; status: string }
    | ApiEnvelope<{ id: string; dkim_key_present: boolean; dns_verified: boolean; status: string }>
  >(`/api/admin/domains/${id}/dkim`, { dkim_value: dkimValue });
  return unwrapApiEnvelope(data) as {
    id: string;
    dkim_key_present: boolean;
    dns_verified: boolean;
    status: string;
  };
}

// ---------------------------------------------------------------------------
// Operator alerts (ops backlog)
// ---------------------------------------------------------------------------

export type OperatorAlert = {
  id: string;
  ids: string[];
  count: number;
  kind: string;
  status: string;
  title: string;
  message: string;
  organization_name: string;
  created_at: string | null;
};

export async function GetOperatorAlertsApi(): Promise<OperatorAlert[]> {
  const { data } = await apiClient.get<OperatorAlert[] | ApiEnvelope<OperatorAlert[]>>(
    "/api/admin/alerts",
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export async function SetOperatorAlertStatusApi(
  id: string,
  statusValue: string,
): Promise<{ id: string; status: string }> {
  const { data } = await apiClient.post<
    { id: string; status: string } | ApiEnvelope<{ id: string; status: string }>
  >(`/api/admin/alerts/${id}/status`, { status: statusValue });
  return unwrapApiEnvelope(data) as { id: string; status: string };
}

/** Clear a deduped alert group (ids) or an entire noisy kind. */
export async function BulkClearAlertsApi(payload: {
  ids?: string[];
  kind?: string;
  status?: string;
}): Promise<{ cleared: number }> {
  const { data } = await apiClient.post<
    { cleared: number } | ApiEnvelope<{ cleared: number }>
  >("/api/admin/alerts/bulk-clear", payload);
  return unwrapApiEnvelope(data) as { cleared: number };
}

// ---------------------------------------------------------------------------
// Platform flags — platform-wide feature switches (first: drip sourcing).
//   GET  /api/admin/platform-flags
//   POST /api/admin/platform-flags/<key>   { enabled }
// ---------------------------------------------------------------------------

export type PlatformFlagRow = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  /** "db" once an admin has flipped it; "env" while still on the legacy env var. */
  source: "db" | "env";
  updated_at: string | null;
  updated_by: string | null;
};

export async function GetPlatformFlagsApi(): Promise<PlatformFlagRow[]> {
  const { data } = await apiClient.get<PlatformFlagRow[] | ApiEnvelope<PlatformFlagRow[]>>(
    "/api/admin/platform-flags",
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export async function SetPlatformFlagApi(
  key: string,
  enabled: boolean,
): Promise<{ key: string; enabled: boolean }> {
  const { data } = await apiClient.post<
    { key: string; enabled: boolean } | ApiEnvelope<{ key: string; enabled: boolean }>
  >(`/api/admin/platform-flags/${key}`, { enabled });
  return unwrapApiEnvelope(data) as { key: string; enabled: boolean };
}

// ---------------------------------------------------------------------------
// Subscription plan pricing (super-admin).
//   GET  /api/admin/plans
//   POST /api/admin/plans/<code>/pricing   { amount_minor, billing_interval? }
// Prices are stored in the DB and pushed to Stripe. Because Stripe prices are
// immutable, an edit mints a new Stripe price server-side and repoints the plan.
// ---------------------------------------------------------------------------

export type AdminPlanRow = {
  code: string;
  tier: string;
  display_name: string;
  description: string;
  amount_minor: number;
  currency: string;
  billing_interval: "month" | "year" | string;
  trial_days: number;
  is_active: boolean;
  is_checkout_allowed: boolean;
  stripe_price_id: string;
  /** "admin" once edited here; "env" while still driven by the seed env var. */
  pricing_managed_by: "admin" | "env" | string;
  leads_per_month: number | null;
};

export async function GetAdminPlansApi(): Promise<AdminPlanRow[]> {
  const { data } = await apiClient.get<AdminPlanRow[] | ApiEnvelope<AdminPlanRow[]>>(
    "/api/admin/plans",
  );
  const rows = unwrapApiEnvelope(data);
  return Array.isArray(rows) ? rows : [];
}

export async function UpdatePlanPricingApi(
  code: string,
  payload: { amount_minor: number; billing_interval?: "month" | "year" },
): Promise<AdminPlanRow & { new_price_id: string; subscriber_migration: string }> {
  const { data } = await apiClient.post<
    | (AdminPlanRow & { new_price_id: string; subscriber_migration: string })
    | ApiEnvelope<AdminPlanRow & { new_price_id: string; subscriber_migration: string }>
  >(`/api/admin/plans/${code}/pricing`, payload);
  return unwrapApiEnvelope(data) as AdminPlanRow & {
    new_price_id: string;
    subscriber_migration: string;
  };
}
