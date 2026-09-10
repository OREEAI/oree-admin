"use client";

/**
 * Deliverability (Ben, 9 Sep): "can you get the statistics on emails that
 * have bounced undelivered compared to sent please for the past 30 and 60
 * days. Nothing in the admin panel to show me these details."
 *
 * Headline bounce numbers are receiver bounces only. Send failures (auth or
 * network errors that never reached a receiver) appear in the class
 * breakdown so nothing is hidden, but they are not "bounced undelivered".
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetDeliverabilityApi, type DeliverabilityWindow } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh, Pill } from "../_components/table";

const WINDOW_PRESETS: { label: string; days: number[] }[] = [
  { label: "30 & 60 days", days: [30, 60] },
  { label: "7 & 14 days", days: [7, 14] },
  { label: "90 days", days: [90] },
];

const CLASS_LABELS: Record<string, string> = {
  hard_rejected: "Rejected / spam-blocked",
  hard_invalid: "Dead address",
  soft: "Soft (quota / temporary)",
  send_failure: "Send failure (never left us)",
  unknown: "Unclassified DSN",
  unclassified: "Unclassified DSN",
};

const CLASS_TONES: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  hard_rejected: "danger",
  hard_invalid: "warning",
  soft: "neutral",
  send_failure: "neutral",
  unknown: "warning",
  unclassified: "warning",
};

// Under 2% is the standard healthy threshold; 2-5% needs watching.
function rateTone(rate: number | null): "success" | "warning" | "danger" | "neutral" {
  if (rate === null) return "neutral";
  if (rate < 2) return "success";
  if (rate < 5) return "warning";
  return "danger";
}

export default function DeliverabilityPage() {
  const [preset, setPreset] = useState(0);

  const query = useQuery({
    queryKey: [rqKeys.deliverability, preset],
    queryFn: () => GetDeliverabilityApi(WINDOW_PRESETS[preset].days),
    staleTime: 60_000,
  });

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Deliverability
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Bounced undelivered compared to sent, over rolling windows. Bounce counts are real
        receiver bounces — our own send failures are listed in the breakdown but never
        counted as bounces. Under 2% is healthy.
      </p>

      <div className="mt-6 flex gap-1">
        {WINDOW_PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(i)}
            className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] transition-colors ${
              preset === i ? "bg-coral-50 text-coral-700" : "text-ink-soft hover:bg-surface-soft"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading deliverability…</p>}
      {query.isError && (
        <p className="mt-8 text-sm text-coral">Couldn&apos;t load deliverability stats.</p>
      )}

      {query.data && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {query.data.windows.map((w) => (
              <WindowCard key={w.days} window={w} />
            ))}
          </div>

          <h2 className="mt-10 text-lg font-semibold text-ink">Most recent bounces</h2>
          <p className="mt-1 text-sm text-ink-muted">
            The newest receiver bounces in the largest window, so the numbers have names.
          </p>
          {query.data.recent_bounces.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No bounces in this window.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-surface-softer">
                    <AdminTh className="pl-5">When</AdminTh>
                    <AdminTh>Lead</AdminTh>
                    <AdminTh>Address</AdminTh>
                    <AdminTh>Class</AdminTh>
                    <AdminTh className="pr-5">Reason</AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {query.data.recent_bounces.map((b, i) => (
                    <tr key={`${b.when}-${i}`} className="border-b border-surface-softer/60 last:border-0">
                      <td className="whitespace-nowrap py-2.5 pl-5 text-ink-muted">
                        {new Date(b.when).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-2.5 font-medium text-ink">{b.lead_name}</td>
                      <td className="py-2.5 text-ink-muted">{b.lead_email || "—"}</td>
                      <td className="py-2.5">
                        <Pill
                          label={CLASS_LABELS[b.bounce_class] ?? b.bounce_class}
                          tone={CLASS_TONES[b.bounce_class] ?? "neutral"}
                        />
                      </td>
                      <td className="max-w-[22rem] truncate py-2.5 pr-5 text-ink-soft" title={b.bounce_reason}>
                        {b.bounce_reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WindowCard({ window: w }: { window: DeliverabilityWindow }) {
  const rate = w.bounce_rate_pct;
  return (
    <section className="rounded-2xl border border-surface-softer bg-white p-5 shadow-soft-lift">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-ink">Last {w.days} days</h2>
        <Pill label={rate === null ? "no sends" : `${rate}% bounce rate`} tone={rateTone(rate)} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Sent" value={w.sent} />
        <Stat label="Bounced" value={w.bounced} />
        <Stat label="Leads affected" value={w.unique_leads_bounced} />
      </div>

      {Object.keys(w.bounce_breakdown).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(w.bounce_breakdown).map(([cls, n]) => (
            <Pill
              key={cls}
              label={`${CLASS_LABELS[cls] ?? cls} · ${n}`}
              tone={CLASS_TONES[cls] ?? "neutral"}
            />
          ))}
        </div>
      )}

      {w.per_domain.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-softer">
              <AdminTh>Sending domain</AdminTh>
              <AdminTh className="text-right">Sent</AdminTh>
              <AdminTh className="text-right">Bounced</AdminTh>
              <AdminTh className="text-right">Rate</AdminTh>
            </tr>
          </thead>
          <tbody>
            {w.per_domain.map((d) => (
              <tr key={d.domain} className="border-b border-surface-softer/60 last:border-0">
                <td className="py-2 font-medium text-ink">{d.domain}</td>
                <td className="py-2 text-right tabular-nums text-ink-muted">{d.sent}</td>
                <td className="py-2 text-right tabular-nums text-ink-muted">{d.bounced}</td>
                <td className="py-2 text-right tabular-nums text-ink-muted">
                  {d.bounce_rate_pct === null ? "—" : `${d.bounce_rate_pct}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-surface-softer bg-surface-soft/40 px-3 py-2.5">
      <div className="font-code text-[0.58rem] font-bold uppercase tracking-[0.15em] text-ink-soft">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
