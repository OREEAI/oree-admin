"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/service/api";
import {
  CURRENCIES,
  type Currency,
  GetAdminOrgApi,
  OverrideTierApi,
  REFUND_METHODS,
  RefundApi,
  type RefundMethod,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type TierOverrideResult,
  type RefundResult,
} from "@/service/orgs";
import { rqKeys } from "@/utils/constants";
import { StatusBadge, TierBadge } from "../badges";

export default function OrgDetailPage() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;

  const [tierOpen, setTierOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const orgQuery = useQuery({
    queryKey: [rqKeys.orgs, orgId],
    queryFn: () => GetAdminOrgApi(orgId),
    staleTime: 5 * 60_000,
  });

  const org = orgQuery.data;

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
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
                {org.organization_name}
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <TierBadge tier={org.tier} />
                <StatusBadge status={org.status} />
                <span className="font-code text-[0.6rem] text-ink-soft">{org.id}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ActionCard
              title="Override tier"
              description="Manually set this org's subscription tier. Respected immediately and cleared by the next Stripe webhook or the optional expiry."
              actionLabel="Override tier"
              onClick={() => setTierOpen(true)}
            />
            <ActionCard
              title="Issue refund"
              description="Issue a Stripe refund on a charge, or credit the customer's balance. Creates a Transaction row on the org's billing page."
              actionLabel="Issue refund"
              onClick={() => setRefundOpen(true)}
            />
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
    </div>
  );
}

function ActionCard({
  title,
  description,
  actionLabel,
  onClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
        {title}
      </p>
      <p className="mt-2 flex-1 text-sm text-ink-muted">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 self-start rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral"
      >
        {actionLabel}
      </button>
    </div>
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
