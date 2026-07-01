"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetAdminCampaignsApi } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh, Pill } from "../_components/table";

const STATUS_TABS = ["all", "running", "pending", "completed", "failed", "cancelled"] as const;

function fmtDateTime(iso: string | null) {
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

export default function CampaignsPage() {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");

  const query = useQuery({
    queryKey: [rqKeys.campaigns],
    queryFn: () => GetAdminCampaignsApi(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const all = query.data ?? [];
    if (statusTab === "all") return all;
    return all.filter((c) => c.status === statusTab);
  }, [query.data, statusTab]);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Campaigns
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every campaign run across the platform — what&apos;s live, queued, and
        what failed.
      </p>

      <div className="mt-6 flex gap-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setStatusTab(t)}
            className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] transition-colors ${
              statusTab === t
                ? "bg-coral-50 text-coral-700"
                : "text-ink-soft hover:bg-surface-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {query.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading campaigns…</p>
      )}
      {query.isError && (
        <p className="mt-8 text-sm text-coral">Couldn&apos;t load campaigns.</p>
      )}

      {query.data && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <AdminTh className="pl-6">Campaign</AdminTh>
                <AdminTh>Organisation</AdminTh>
                <AdminTh>Leads</AdminTh>
                <AdminTh>Scheduled</AdminTh>
                <AdminTh className="pr-6">Status</AdminTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                >
                  <td className="py-3 pl-6 pr-4">
                    <div className="font-medium text-ink">{c.name}</div>
                    <div className="text-xs text-ink-soft">{c.icp_name}</div>
                    {c.error_message && (
                      <div className="max-w-sm truncate text-xs text-coral" title={c.error_message}>
                        {c.error_message}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{c.organization_name}</td>
                  <td className="py-3 pr-4 tabular-nums text-ink-muted">{c.lead_count}</td>
                  <td className="py-3 pr-4 text-ink-muted">{fmtDateTime(c.scheduled_for)}</td>
                  <td className="py-3 pr-6">
                    <Pill label={c.status} tone={statusTone(c.status)} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-ink-soft">
                    No campaigns match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
