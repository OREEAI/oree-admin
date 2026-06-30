import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

export type AdminOrg = {
  id: string;
  organization_name: string;
  tier?: string;
  status?: string;
};

// Mirror payments.enums.SubscriptionTierChoices (backend source of truth).
export const SUBSCRIPTION_TIERS = [
  "starter",
  "professional",
  "business",
  "enterprise",
  "custom",
] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// Mirror payments.enums.Currencies.
export const CURRENCIES = ["gbp", "usd", "eur"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Mirror payments.enums.RefundMethod.
export const REFUND_METHODS = ["refund", "balance_credit"] as const;
export type RefundMethod = (typeof REFUND_METHODS)[number];

/**
 * List every organisation for the "Act as org" switcher and the Orgs list.
 *
 * Endpoint: GET /api/admin/organizations  (super-admin only)
 * Payload : { data: AdminOrg[] } | AdminOrg[]
 */
const ADMIN_ORGS_ENDPOINT = "/api/admin/organizations";

const STUB_ORGS: AdminOrg[] = [
  { id: "stub-org-1", organization_name: "Momentum Outbound (stub)" },
  { id: "stub-org-2", organization_name: "Acme Corp (stub)" },
];

export async function GetAdminOrgsApi(): Promise<AdminOrg[]> {
  try {
    const { data } = await apiClient.get<AdminOrg[] | ApiEnvelope<AdminOrg[]>>(
      ADMIN_ORGS_ENDPOINT,
    );
    // handle_response omits the `data` key for an empty list, so coerce to
    // an array rather than hand back the bare envelope.
    const rows = unwrapApiEnvelope(data);
    return Array.isArray(rows) ? rows : [];
  } catch {
    // The admin orgs endpoint is unreachable — fall back to a clearly
    // labelled stub so the switcher's selection behaviour stays testable.
    return STUB_ORGS;
  }
}

/**
 * Single org — there is no dedicated detail endpoint yet, so resolve it
 * from the list. Cheap (the list is small) and keeps one source of truth.
 */
export async function GetAdminOrgApi(orgId: string): Promise<AdminOrg | null> {
  const orgs = await GetAdminOrgsApi();
  return orgs.find((o) => o.id === orgId) ?? null;
}

// Full org detail (info + counts + subscription) for the org page.
// Endpoint: GET /api/admin/organizations/<id>
export type AdminOrgDetail = AdminOrg & {
  created_at?: string;
  lead_source_provider?: string;
  content_generation_model?: string;
  assistant_model?: string;
  monthly_lead_limit?: number;
  leads_used_this_month?: number;
  daily_email_limit?: number;
  subscription?: {
    tier?: string;
    status?: string;
    seats?: number | null;
    current_period_end?: string | null;
  };
  // Org capacity = sum of users' caps + usage (no separate org cap).
  lead_capacity?: { total_cap?: number; total_used?: number };
  counts?: {
    users?: number;
    active_users?: number;
    leads?: number;
    mailboxes?: number;
    domains?: number;
    icps?: number;
  };
};

export async function GetAdminOrgDetailApi(
  orgId: string,
): Promise<AdminOrgDetail | null> {
  try {
    const { data } = await apiClient.get<
      AdminOrgDetail | ApiEnvelope<AdminOrgDetail>
    >(`${ADMIN_ORGS_ENDPOINT}/${orgId}`);
    return unwrapApiEnvelope(data) as AdminOrgDetail;
  } catch {
    // Fall back to the list-derived shape so the page still renders.
    return GetAdminOrgApi(orgId);
  }
}

// ---------------------------------------------------------------------------
// Tier override + refund (C9) — backed by payments.AdminOverrideViewSet:
//   POST /api/payments/admin/orgs/<id>/override-tier
//   POST /api/payments/admin/orgs/<id>/refund
// ---------------------------------------------------------------------------

export type TierOverridePayload = {
  tier: SubscriptionTier;
  reason: string;
  // ISO 8601; omit/null for a permanent override (cleared by the next
  // Stripe subscription webhook).
  expires_at?: string | null;
};

export type TierOverrideResult = {
  subscription_id: string;
  tier: string;
  overrides: unknown;
  entitlements: unknown;
};

export async function OverrideTierApi(
  orgId: string,
  payload: TierOverridePayload,
): Promise<TierOverrideResult> {
  const { data } = await apiClient.post<
    TierOverrideResult | ApiEnvelope<TierOverrideResult>
  >(`/api/payments/admin/orgs/${orgId}/override-tier`, payload);
  return unwrapApiEnvelope(data);
}

export type RefundPayload = {
  // Minor units (pence/cents) — the modal converts from major units.
  amount_minor: number;
  currency: Currency;
  reason: string;
  method: RefundMethod;
  // Required by the backend only when method === "refund".
  transaction_id?: string | null;
};

export type RefundResult = {
  transaction_id: string;
  transaction_type: string;
  status: string;
  amount: string | number;
  currency: string;
  provider_reference: string | null;
};

export async function RefundApi(
  orgId: string,
  payload: RefundPayload,
): Promise<RefundResult> {
  const { data } = await apiClient.post<RefundResult | ApiEnvelope<RefundResult>>(
    `/api/payments/admin/orgs/${orgId}/refund`,
    payload,
  );
  return unwrapApiEnvelope(data);
}

export type LeadCapResult = {
  subscription_id: string;
  leads_per_month: number;
};

/**
 * Set a per-org monthly lead cap (overrides the tier default). 0 clears the
 * override and falls back to the tier default.
 * POST /api/payments/admin/orgs/<id>/lead-cap
 */
export async function SetLeadCapApi(
  orgId: string,
  leadsPerMonth: number,
): Promise<LeadCapResult> {
  const { data } = await apiClient.post<LeadCapResult | ApiEnvelope<LeadCapResult>>(
    `/api/payments/admin/orgs/${orgId}/lead-cap`,
    { leads_per_month: leadsPerMonth },
  );
  return unwrapApiEnvelope(data);
}

// Lead sourcing providers (mirror core.enums OrganizationLeadSourceChoices).
export const LEAD_SOURCES = ["exa", "apollo", "both"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export type LeadSourceResult = {
  id: string;
  lead_source_provider: string;
  apollo_enabled: boolean;
};

/**
 * Switch the org's lead sourcing provider (used when there's no DB match).
 * POST /api/payments/admin/orgs/<id>/lead-source
 */
export async function SetLeadSourceApi(
  orgId: string,
  provider: LeadSource,
): Promise<LeadSourceResult> {
  const { data } = await apiClient.post<LeadSourceResult | ApiEnvelope<LeadSourceResult>>(
    `/api/payments/admin/orgs/${orgId}/lead-source`,
    { provider },
  );
  return unwrapApiEnvelope(data);
}
