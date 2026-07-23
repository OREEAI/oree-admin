"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/service/api";
import {
  GetAdminPlansApi,
  UpdatePlanPricingApi,
  type AdminPlanRow,
} from "@/service/resources";

/** amount_minor (pence) → "£12.90" */
function formatPrice(amountMinor: number, currency: string): string {
  const symbol = currency?.toLowerCase() === "gbp" ? "£" : `${(currency || "").toUpperCase()} `;
  return `${symbol}${(amountMinor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function intervalLabel(interval: string): string {
  if (interval === "year") return "/yr";
  if (interval === "month") return "/mo";
  return "";
}

export default function PlansPage() {
  const query = useQuery({
    queryKey: ["admin-plans"],
    queryFn: GetAdminPlansApi,
  });

  const plans = query.data ?? [];
  // Free trial (£0) first, then paid tiers ascending — matches the pricing page.
  const sorted = [...plans].sort((a, b) => a.amount_minor - b.amount_minor);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Plans &amp; pricing
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Edit a plan&apos;s price here — it updates the platform and Stripe together. Existing
        subscribers keep their current price and move to the new one at their next renewal.
      </p>

      <div className="mt-8 max-w-3xl space-y-4">
        {query.isPending ? (
          <div className="h-32 animate-pulse rounded-2xl bg-ink/5" />
        ) : null}
        {query.isError ? (
          <div className="rounded-2xl border border-coral/20 bg-coral-50/60 px-5 py-4 text-sm text-coral">
            {getApiErrorMessage(query.error, "Couldn't load plans.")}
          </div>
        ) : null}
        {sorted.map((plan) => (
          <PlanCard key={plan.code} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: AdminPlanRow }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  // Edit in pounds (major units); convert to pence on submit.
  const [pounds, setPounds] = useState((plan.amount_minor / 100).toString());
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  const isFree = plan.amount_minor === 0;

  const save = useMutation({
    mutationFn: () => {
      const amountMinor = Math.round(parseFloat(pounds) * 100);
      return UpdatePlanPricingApi(plan.code, { amount_minor: amountMinor });
    },
    onSuccess: async (result) => {
      setError("");
      setEditing(false);
      setSavedNote(
        result.subscriber_migration === "queued"
          ? "Saved. New sign-ups get the new price now; existing subscribers move over at their next renewal."
          : "Saved.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't update this price.")),
  });

  const amount = parseFloat(pounds);
  const invalid = Number.isNaN(amount) || amount <= 0;

  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-ink">{plan.display_name}</h2>
            <span className="rounded-full bg-ink/5 px-2.5 py-0.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              {plan.code}
            </span>
            {plan.pricing_managed_by === "admin" ? (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-success">
                Edited here
              </span>
            ) : null}
            {!plan.is_active ? (
              <span className="rounded-full bg-ink/5 px-2.5 py-0.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
                Inactive
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-code text-2xl font-bold tabular-nums text-ink">
              {formatPrice(plan.amount_minor, plan.currency)}
            </span>
            <span className="font-code text-xs text-ink-soft">
              {intervalLabel(plan.billing_interval)}
            </span>
          </div>

          <p className="mt-1.5 font-code text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">
            {plan.leads_per_month != null ? `${plan.leads_per_month} leads/mo` : "—"}
            {plan.trial_days > 0 ? ` · ${plan.trial_days}-day trial` : ""}
            {plan.pricing_managed_by !== "admin"
              ? " · price still from the seed env var"
              : ""}
          </p>
        </div>

        {!isFree ? (
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setSavedNote("");
              setError("");
              setPounds((plan.amount_minor / 100).toString());
            }}
            className="shrink-0 rounded-full border border-surface-softer px-4 py-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            {editing ? "Cancel" : "Edit price"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-5 border-t border-surface-softer pt-5">
          <label className="mb-2 block text-sm font-medium text-ink">
            New price ({plan.currency?.toUpperCase() || "GBP"}
            {intervalLabel(plan.billing_interval)})
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-surface-softer bg-white px-3">
              <span className="font-code text-sm text-ink-soft">£</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={pounds}
                onChange={(e) => setPounds(e.target.value)}
                className="w-32 bg-transparent px-2 py-2.5 font-code text-sm tabular-nums text-ink outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || invalid}
              className="rounded-full bg-coral px-5 py-2.5 font-code text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-coral-600 disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save price"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            A new Stripe price is created and this plan repoints to it. New checkouts use it
            immediately; current subscribers move over at their next renewal (no mid-cycle
            charge).
          </p>
        </div>
      ) : null}

      {savedNote ? (
        <div className="mt-4 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-sm text-ink">
          {savedNote}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-coral/20 bg-coral-50/60 px-4 py-2.5 text-sm text-coral">
          {error}
        </div>
      ) : null}
    </div>
  );
}
