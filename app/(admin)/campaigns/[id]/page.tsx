"use client";

import Link from "next/link";
import { FiCheckCircle, FiList, FiSend, FiTarget } from "react-icons/fi";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { GetAdminCampaignDetailApi } from "@/service/resources";
import { AdminTh, Pill } from "../../_components/table";
import { BackLink, DetailList, DetailRow, Panel, Stat, StatePill } from "../../_components/ui";

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
      <BackLink href="/campaigns" label="Campaigns" />

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load campaign.</p>}

      {c && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-white">
              <FiSend className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{c.name}</h1>
                <Pill label={c.status} tone={statusTone(c.status)} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {c.organization_name} · {c.icp_name}
                {c.user ? ` · ${c.user}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={FiCheckCircle} label="Delivered" value={c.delivered} />
            <Stat icon={FiTarget} label="Target" value={c.lead_count} />
            <Stat icon={FiList} label="Leads listed" value={c.leads.length} />
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Panel title="Run">
              <DetailList>
                <DetailRow label="Scheduled" value={fmt(c.scheduled_for)} />
                <DetailRow label="Started" value={fmt(c.started_at)} />
                <DetailRow label="Completed" value={fmt(c.completed_at)} />
                <DetailRow
                  label="Celery task"
                  value={c.celery_task_id ? c.celery_task_id.slice(0, 12) + "…" : "—"}
                />
              </DetailList>
              {c.error_message && (
                <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">
                  {c.error_message}
                </p>
              )}
            </Panel>
            <Panel title="Result summary">
              <pre className="mt-4 overflow-x-auto rounded-lg bg-navy-900/95 p-4 font-code text-xs leading-relaxed text-white/80">
                {JSON.stringify(c.result_summary ?? {}, null, 2)}
              </pre>
            </Panel>
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
                    <td className="py-3 pr-6"><StatePill value={l.status} /></td>
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


