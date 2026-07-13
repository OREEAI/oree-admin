"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiCreditCard,
  FiDatabase,
  FiGlobe,
  FiMail,
  FiSliders,
  FiTarget,
  FiUsers,
} from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import {
  CURRENCIES,
  type Currency,
  GetAdminOrgDetailApi,
  type LeadCapResult,
  LEAD_SOURCES,
  type LeadSource,
  OverrideTierApi,
  REFUND_METHODS,
  RefundApi,
  type RefundMethod,
  SetLeadCapApi,
  SetLeadSourceApi,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type TierOverrideResult,
  type RefundResult,
} from "@/service/orgs";
import { GetAdminUsersApi, UpdateAdminUserApi } from "@/service/users";
import { rqKeys } from "@/utils/constants";
import { StatePill } from "../../_components/ui";
import { StatusBadge, TierBadge } from "../badges";

export default function OrgDetailPage() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const queryClient = useQueryClient();

  const [tierOpen, setTierOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);

  const orgQuery = useQuery({
    queryKey: [rqKeys.orgs, orgId],
    queryFn: () => GetAdminOrgDetailApi(orgId),
    staleTime: 5 * 60_000,
  });

  const membersQuery = useQuery({
    queryKey: [rqKeys.adminUsers, orgId],
    queryFn: () => GetAdminUsersApi(orgId),
    staleTime: 5 * 60_000,
  });

  const org = orgQuery.data;
  const members = membersQuery.data ?? [];

  return (
    <div>
      <Link
        href="/orgs"
        className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral"
      >
        ← All organisations
      </Link>

      {orgQuery.isPending && (
        <p className="mt-6 text-sm text-ink-soft">Loading organisation…</p>
      )}
      {orgQuery.isError && (
        <p className="mt-6 text-sm text-coral">Couldn&apos;t load this organisation.</p>
      )}

      {orgQuery.data === null && (
        <p className="mt-6 text-sm text-coral">Organisation not found.</p>
      )}

      {org && (
        <>
          {/* Header: identity left, admin actions right. */}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 font-code text-xl font-bold text-white">
                {org.organization_name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div>
                <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
                  {org.organization_name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <TierBadge tier={org.tier} />
                  <StatusBadge status={org.status} />
                  <span className="font-code text-[0.6rem] text-ink-soft">
                    Since{" "}
                    {org.created_at ? new Date(org.created_at).toLocaleDateString() : "—"}
                    {" · "}
                    {org.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <HeaderAction
                icon={FiSliders}
                label="Override tier"
                onClick={() => setTierOpen(true)}
              />
              <HeaderAction
                icon={FiDatabase}
                label="Lead cap"
                onClick={() => setCapOpen(true)}
              />
              <HeaderAction
                icon={FiCreditCard}
                label="Refund"
                onClick={() => setRefundOpen(true)}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat icon={FiUsers} label="Users" value={org.counts?.users} />
            <Stat icon={FiCheckCircle} label="Active" value={org.counts?.active_users} />
            <Stat icon={FiDatabase} label="Leads" value={org.counts?.leads} />
            <Stat icon={FiMail} label="Mailboxes" value={org.counts?.mailboxes} />
            <Stat icon={FiGlobe} label="Domains" value={org.counts?.domains} />
            <Stat icon={FiTarget} label="ICPs" value={org.counts?.icps} />
          </div>

          {/* Body: members lead, plan/config details support. */}
          <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            {/* Members */}
            <div className="overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift xl:col-span-2">
              <p className="px-6 py-4 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
                Members ({members.length})
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-surface-softer bg-surface-soft/50">
                      <Th className="pl-6">User</Th>
                      <Th>Role</Th>
                      <Th>Subscription</Th>
                      <Th className="pr-6">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                      >
                        <td className="py-3 pl-6 pr-4">
                          <Link href={`/users/${u.id}`} className="group flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 font-code text-xs font-bold text-white">
                              {(u.full_name || u.email).trim().charAt(0).toUpperCase()}
                            </span>
                            <span>
                              <span className="block font-medium text-ink transition-colors group-hover:text-coral">
                                {u.full_name || u.email}
                              </span>
                              {u.full_name ? (
                                <span className="block text-xs text-ink-soft">{u.email}</span>
                              ) : null}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="py-3 pr-4">
                          <MemberTierSelect
                            userId={u.id}
                            tier={u.tier}
                            onSaved={() => {
                              membersQuery.refetch();
                              orgQuery.refetch();
                            }}
                          />
                        </td>
                        <td className="py-3 pr-6">
                          <StatusBadge status={u.status} />
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-ink-soft">
                          {membersQuery.isPending ? "Loading members…" : "No users in this org."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plan & configuration */}
            <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
              <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
                Plan &amp; configuration
              </p>

              {/* Lead capacity gets a real usage bar, not a bare fraction. */}
              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink">Lead capacity</span>
                  <span className="font-code text-xs tabular-nums text-ink-muted">
                    {(org.lead_capacity?.total_used ?? 0).toLocaleString()} /{" "}
                    {(org.lead_capacity?.total_cap ?? 0).toLocaleString()}
                  </span>
                </div>
                <UsageBar
                  used={org.lead_capacity?.total_used ?? 0}
                  cap={org.lead_capacity?.total_cap ?? 0}
                />
                <p className="mt-1 text-[0.7rem] text-ink-soft">Sum of every seat&apos;s allowance.</p>
              </div>

              <dl className="mt-5 divide-y divide-surface-softer/70">
                <DetailRow
                  label="Subscription"
                  value={`${org.subscription?.tier || org.tier || "—"} · ${org.subscription?.status || "—"}`}
                />
                <DetailRow label="Seats" value={org.subscription?.seats ?? "—"} />
                <DetailRow label="Daily email limit" value={org.daily_email_limit ?? "—"} />
                <DetailRow
                  label="Lead source"
                  value={
                    <LeadSourceSelect
                      orgId={orgId}
                      provider={org.lead_source_provider}
                      onSaved={() =>
                        queryClient.invalidateQueries({ queryKey: [rqKeys.orgs, orgId] })
                      }
                    />
                  }
                />
                <DetailRow label="Content model" value={org.content_generation_model || "—"} />
                <DetailRow label="Assistant model" value={org.assistant_model || "—"} />
              </dl>
            </div>
          </div>

          {/* The stat cards say "15 mailboxes" but not whether any of them are
              broken, which is what an operator opened this page to find out.
              These are the rows behind the counts. */}
          <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <ListPanel title="Mailboxes" count={org.mailboxes?.length ?? 0}>
              {(org.mailboxes ?? []).map((mailbox) => (
                <div
                  key={mailbox.id}
                  className="flex items-center justify-between gap-4 border-b border-surface-softer/60 px-6 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{mailbox.email_address}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {mailbox.assigned_user || "Unassigned"} · {mailbox.daily_send_limit}/day
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <WarmupPill value={mailbox.warmup_status} />
                    <StatePill value={mailbox.status} />
                  </div>
                </div>
              ))}
            </ListPanel>

            <ListPanel title="Domains" count={org.domains?.length ?? 0}>
              {(org.domains ?? []).map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between gap-4 border-b border-surface-softer/60 px-6 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{domain.domain_name}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {domain.dns_verified ? "DNS verified" : "DNS not verified"}
                    </p>
                  </div>
                  <StatePill value={domain.status} />
                </div>
              ))}
            </ListPanel>

            <ListPanel title="ICPs" count={org.icps?.length ?? 0}>
              {(org.icps ?? []).map((icp) => (
                <div
                  key={icp.id}
                  className="flex items-center justify-between gap-4 border-b border-surface-softer/60 px-6 py-3 last:border-0"
                >
                  <p className="truncate text-sm font-medium text-ink">{icp.name}</p>
                  <p className="shrink-0 truncate text-xs text-ink-soft">{icp.owner || "—"}</p>
                </div>
              ))}
            </ListPanel>
          </div>
        </>
      )}

      {tierOpen && org && (
        <TierOverrideModal
          orgId={orgId}
          currentTier={org.tier}
          onClose={() => setTierOpen(false)}
          onDone={() => {
            setTierOpen(false);
            orgQuery.refetch();
          }}
        />
      )}

      {refundOpen && org && (
        <RefundModal orgId={orgId} onClose={() => setRefundOpen(false)} />
      )}

      {capOpen && org && (
        <LeadCapModal orgId={orgId} onClose={() => setCapOpen(false)} />
      )}
    </div>
  );
}

/** A flush-edged panel of rows, matching the Members table's chrome. */
function ListPanel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
      <p className="border-b border-surface-softer px-6 py-4 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {title} ({count})
      </p>
      {count === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-soft">
          Nothing here for this org yet.
        </p>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

/** Warm-up is the thing most likely to be silently wrong on a mailbox, so it
 *  gets its own pill rather than hiding inside the status. */
function WarmupPill({ value }: { value?: string }) {
  if (!value) return null;
  const done = value === "completed";
  const paused = value === "paused";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.14em] ${
        done
          ? "bg-success/10 text-success"
          : paused
            ? "bg-coral-50 text-coral"
            : "bg-surface-soft text-ink-muted"
      }`}
    >
      {done ? "Warm" : value.replace(/_/g, " ")}
    </span>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
      {Icon ? (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-coral-50 text-coral">
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <p className="font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 font-code text-xl font-bold tabular-nums text-ink">
        {value != null ? value.toLocaleString() : "—"}
      </p>
    </div>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-surface-softer bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span className="text-ink-soft">—</span>;
  const r = role.toLowerCase();
  const tone =
    r === "super_admin"
      ? "bg-navy-800 text-white"
      : r === "org_admin"
        ? "bg-navy-100 text-navy-700"
        : r === "content_admin"
          ? "bg-coral/10 text-coral"
          : "bg-ink/5 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${tone}`}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}

function UsageBar({ used, cap }: { used: number; cap: number }) {
  const pct = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  const color = pct >= 90 ? "#D33A1C" : pct >= 70 ? "#F2A93B" : "#F24E2E";
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-soft">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-2.5 text-left font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft ${className}`}
    >
      {children}
    </th>
  );
}

function LeadSourceSelect({
  orgId,
  provider,
  onSaved,
}: {
  orgId: string;
  provider?: string;
  onSaved: () => void;
}) {
  const current = (LEAD_SOURCES.find((p) => p === (provider ?? "").toLowerCase()) ??
    "exa") as LeadSource;
  const mut = useMutation({
    mutationFn: (next: LeadSource) => SetLeadSourceApi(orgId, next),
    onSuccess: onSaved,
  });
  return (
    <select
      value={current}
      disabled={mut.isPending}
      onChange={(e) => mut.mutate(e.target.value as LeadSource)}
      className="rounded-lg border border-surface-softer bg-white px-2 py-1 text-xs text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 disabled:opacity-50"
    >
      {LEAD_SOURCES.map((p) => (
        <option key={p} value={p}>
          {p === "exa" ? "Exa" : p === "apollo" ? "Apollo" : "Both"}
        </option>
      ))}
    </select>
  );
}

function MemberTierSelect({
  userId,
  tier,
  onSaved,
}: {
  userId: string;
  tier?: string;
  onSaved: () => void;
}) {
  // Assignable tiers (custom isn't directly assignable to a user).
  const options = SUBSCRIPTION_TIERS.filter((t) => t !== "custom");
  const current = options.find((t) => t === (tier ?? "").toLowerCase()) ?? "";
  const mut = useMutation({
    mutationFn: (newTier: string) => UpdateAdminUserApi(userId, { tier: newTier }),
    onSuccess: onSaved,
  });
  return (
    <select
      value={current}
      disabled={mut.isPending}
      onChange={(e) => mut.mutate(e.target.value)}
      className="rounded-lg border border-surface-softer bg-white px-2 py-1 text-xs text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 disabled:opacity-50"
    >
      <option value="" disabled>
        Set tier…
      </option>
      {options.map((t) => (
        <option key={t} value={t}>
          {t[0].toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_25px_60px_-30px_rgba(11,39,64,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const labelCls =
  "block font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft";
const inputCls =
  "mt-1.5 w-full rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tier override modal
// ---------------------------------------------------------------------------

function TierOverrideModal({
  orgId,
  currentTier,
  onClose,
  onDone,
}: {
  orgId: string;
  currentTier?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tier, setTier] = useState<SubscriptionTier>(
    (SUBSCRIPTION_TIERS.find((t) => t === currentTier) ??
      SUBSCRIPTION_TIERS[0]) as SubscriptionTier,
  );
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TierOverrideResult | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      OverrideTierApi(orgId, {
        tier,
        reason: reason.trim(),
        // datetime-local has no timezone; convert to an ISO string.
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    onMutate: () => setError(""),
    onSuccess: setResult,
    onError: (e) => setError(getApiErrorMessage(e, "Tier override failed.")),
  });

  const canSubmit = reason.trim().length > 0 && !mut.isPending;

  return (
    <ModalShell title="Override tier" onClose={onClose}>
      {result ? (
        <div>
          <p className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            Tier overridden to <strong>{result.tier}</strong>.
          </p>
          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={onDone}>Done</PrimaryButton>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mut.mutate();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="tier">
                Tier
              </label>
              <select
                id="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as SubscriptionTier)}
                className={inputCls}
              >
                {SUBSCRIPTION_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="reason">
                Reason
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Why is this override being applied?"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="expires">
                Expires at <span className="text-ink-soft/70">(optional)</span>
              </label>
              <input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-[0.7rem] text-ink-soft">
                Leave blank for a permanent override (cleared by the next Stripe
                webhook).
              </p>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-coral">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <GhostButton onClick={onClose} disabled={mut.isPending}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={!canSubmit}>
              {mut.isPending ? "Applying…" : "Apply override"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Refund modal
// ---------------------------------------------------------------------------

function RefundModal({
  orgId,
  onClose,
}: {
  orgId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("gbp");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<RefundMethod>("refund");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RefundResult | null>(null);

  // Backend takes minor units (pence/cents); the input is major units.
  const amountMinor = useMemo(() => {
    const major = Number.parseFloat(amount);
    if (!Number.isFinite(major) || major <= 0) return 0;
    return Math.round(major * 100);
  }, [amount]);

  const needsTransaction = method === "refund";

  const mut = useMutation({
    mutationFn: () =>
      RefundApi(orgId, {
        amount_minor: amountMinor,
        currency,
        reason: reason.trim(),
        method,
        transaction_id: needsTransaction ? transactionId.trim() : null,
      }),
    onMutate: () => setError(""),
    onSuccess: setResult,
    onError: (e) => setError(getApiErrorMessage(e, "Refund failed.")),
  });

  const canSubmit =
    amountMinor > 0 &&
    reason.trim().length > 0 &&
    (!needsTransaction || transactionId.trim().length > 0) &&
    !mut.isPending;

  return (
    <ModalShell title="Issue refund" onClose={onClose}>
      {result ? (
        <div>
          <p className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            Refund {result.status} — {result.amount} {result.currency.toUpperCase()}
            {result.provider_reference ? ` (ref ${result.provider_reference})` : ""}.
          </p>
          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mut.mutate();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="method">
                Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as RefundMethod)}
                className={inputCls}
              >
                {REFUND_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m === "refund" ? "Stripe refund" : "Balance credit"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelCls} htmlFor="amount">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div className="w-28">
                <label className={labelCls} htmlFor="currency">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {needsTransaction && (
              <div>
                <label className={labelCls} htmlFor="txn">
                  Charge transaction ID
                </label>
                <input
                  id="txn"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="UUID of the original charge"
                  className={inputCls}
                />
                <p className="mt-1 text-[0.7rem] text-ink-soft">
                  Required for a Stripe refund. Use Balance credit if you
                  don&apos;t have the original charge.
                </p>
              </div>
            )}

            <div>
              <label className={labelCls} htmlFor="refund-reason">
                Reason
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Why is this refund being issued?"
                className={inputCls}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-coral">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <GhostButton onClick={onClose} disabled={mut.isPending}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={!canSubmit}>
              {mut.isPending ? "Processing…" : "Issue refund"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Monthly lead cap modal
// ---------------------------------------------------------------------------

function LeadCapModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<LeadCapResult | null>(null);

  const parsed = Number.parseInt(value, 10);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  const mut = useMutation({
    mutationFn: () => SetLeadCapApi(orgId, parsed),
    onMutate: () => setError(""),
    onSuccess: setResult,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't set the lead cap.")),
  });

  return (
    <ModalShell title="Monthly lead cap" onClose={onClose}>
      {result ? (
        <div>
          <p className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            Monthly lead cap set to <strong>{result.leads_per_month.toLocaleString()}</strong>.
          </p>
          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !mut.isPending) mut.mutate();
          }}
        >
          <div>
            <label className={labelCls} htmlFor="cap">
              Leads per month
            </label>
            <input
              id="cap"
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 2000"
              className={inputCls}
            />
            <p className="mt-1 text-[0.7rem] text-ink-soft">
              Overrides the tier default. Set <strong>0</strong> to clear the
              override and fall back to the tier&apos;s cap.
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-coral">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <GhostButton onClick={onClose} disabled={mut.isPending}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={!valid || mut.isPending}>
              {mut.isPending ? "Saving…" : "Set cap"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
