"use client";

import { useQuery } from "@tanstack/react-query";

import { GetLeadsStatsApi } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh } from "../_components/table";

export default function DatabasePage() {
  const query = useQuery({
    queryKey: [rqKeys.leadsStats],
    queryFn: GetLeadsStatsApi,
    staleTime: 60_000,
  });
  const s = query.data;

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Lead database
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        The global lead pool — where leads came from, and how often the same lead
        is reused across organisations (reuse is pure margin).
      </p>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load lead stats.</p>}

      {s && (
        <>
          {/* Top line */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Leads in DB" value={s.total} />
            <Stat label="Linked to an org" value={s.linked} />
            <Stat label="Unlinked pool" value={s.unlinked_pool} />
            <Stat label="Total org uses" value={s.total_org_uses} hint="lead ↔ org links" />
          </div>

          {/* Reuse — the margin story */}
          <h2 className="mt-10 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
            Cross-org reuse
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Reused leads" value={s.reuse.reused_leads} hint="in 2+ orgs" tone="success" />
            <Stat label="Shared with 2 orgs" value={s.reuse.shared_2_orgs} />
            <Stat label="Shared with 3+ orgs" value={s.reuse.shared_3plus_orgs} />
            <Stat
              label="Margin uses"
              value={s.reuse.reuse_uses}
              hint="resold beyond 1st org"
              tone="success"
            />
          </div>

          {/* Breakdowns */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Breakdown title="By source" rows={s.by_source} />
            <Breakdown title="By enrichment" rows={s.by_enrichment_source} />
            <Breakdown title="By validation" rows={s.by_validation_status} />
          </div>

          {/* Top reused leads */}
          <h2 className="mt-10 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
            Most reused leads
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-softer bg-surface-soft/50">
                  <AdminTh className="pl-6">Lead</AdminTh>
                  <AdminTh>Company</AdminTh>
                  <AdminTh className="pr-6 text-right">Orgs</AdminTh>
                </tr>
              </thead>
              <tbody>
                {s.top_reused.map((r, i) => (
                  <tr key={i} className="border-b border-surface-softer/60">
                    <td className="py-3 pl-6 pr-4 font-medium text-ink">{r.name}</td>
                    <td className="py-3 pr-4 text-ink-muted">{r.company || "—"}</td>
                    <td className="py-3 pr-6 text-right font-code font-bold tabular-nums text-ink">
                      {r.orgs}
                    </td>
                  </tr>
                ))}
                {s.top_reused.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-ink-soft">
                      No lead is shared across orgs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-5 shadow-soft-lift">
      <div className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </div>
      <div
        className={`mt-2 font-code text-2xl font-bold tabular-nums ${
          tone === "success" ? "text-success" : "text-ink"
        }`}
      >
        {value.toLocaleString()}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-soft">{hint}</div>}
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Record<string, number> }) {
  const entries = Object.entries(rows).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, n]) => sum + n, 0) || 1;
  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No data.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(([name, count]) => (
            <div key={name}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink">{name.replace(/_/g, " ")}</span>
                <span className="font-code tabular-nums text-ink-muted">
                  {count.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${Math.round((count / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
