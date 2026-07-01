"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { GetAdminCampaignDetailApi } from "@/service/resources";
import { AdminTh, Pill } from "../../_components/table";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusTone(s: string): "success" | "warning" | "danger" | "neutral" {
  if (s === "completed") return "success";
  if (s === "running") return "warning";
  if (s === "failed") return "danger";
  return "neutral";
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["admin-campaign", id],
    queryFn: () => GetAdminCampaignDetailApi(id),
    staleTime: 20_000,
  });
  const c = query.data;

  return (
    <div>
      <Link href="/campaigns" className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral">
        ← Campaigns
      </Link>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load campaign.</p>}

      {c && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{c.name}</h1>
            <Pill label={c.status} tone={statusTone(c.status)} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {c.organization_name} · {c.icp_name}
            {c.user ? ` · ${c.user}` : ""}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Delivered" value={c.delivered} />
            <Metric label="Target" value={c.lead_count} />
            <Metric label="Leads listed" value={c.leads.length} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
              <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">Run</p>
              <dl className="mt-4 space-y-2">
                <KV k="Scheduled" v={fmt(c.scheduled_for)} />
                <KV k="Started" v={fmt(c.started_at)} />
                <KV k="Completed" v={fmt(c.completed_at)} />
                <KV k="Celery task" v={c.celery_task_id ? c.celery_task_id.slice(0, 12) + "…" : "—"} />
              </dl>
              {c.error_message && (
                <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">
                  {c.error_message}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
              <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">Result summary</p>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-soft/50 p-3 text-xs text-ink-muted">
                {JSON.stringify(c.result_summary ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          <h2 className="mt-8 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
            Leads sourced ({c.leads.length})
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-softer bg-surface-soft/50">
                  <AdminTh className="pl-6">Lead</AdminTh>
                  <AdminTh>Company</AdminTh>
                  <AdminTh className="pr-6">Stage</AdminTh>
                </tr>
              </thead>
              <tbody>
                {c.leads.map((l, i) => (
                  <tr key={i} className="border-b border-surface-softer/60">
                    <td className="py-3 pl-6 pr-4 font-medium text-ink">{l.name}</td>
                    <td className="py-3 pr-4 text-ink-muted">{l.company || "—"}</td>
                    <td className="py-3 pr-6 text-ink-muted">{l.status}</td>
                  </tr>
                ))}
                {c.leads.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-ink-soft">
                      No leads sourced by this run.
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
      <div className="font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value.toLocaleString()}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
