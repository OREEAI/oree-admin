"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiSearch } from "react-icons/fi";

import { GetAdminCampaignsApi } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh, Pill } from "../_components/table";
import { Pagination, paginateRows } from "../_components/ui";

const STATUS_TABS = ["all", "running", "pending", "completed", "failed", "cancelled"] as const;
const PAGE_SIZE = 25;

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: [rqKeys.campaigns],
    queryFn: () => GetAdminCampaignsApi(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    let all = query.data ?? [];
    if (statusTab !== "all") all = all.filter((c) => c.status === statusTab);
    const q = search.trim().toLowerCase();
    if (q) {
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.organization_name ?? "").toLowerCase().includes(q) ||
          (c.icp_name ?? "").toLowerCase().includes(q),
      );
    }
    return all;
  }, [query.data, statusTab, search]);

  const pageRows = paginateRows(rows, page, PAGE_SIZE);

  const runningCount = useMemo(
    () => (query.data ?? []).filter((c) => c.status === "running").length,
    [query.data],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            Campaigns
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Every campaign run across the platform — what&apos;s live, queued, and what failed.
          </p>
          {query.data ? (
            <p className="mt-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {query.data.length.toLocaleString()} total · {runningCount.toLocaleString()} running
            </p>
          ) : null}
        </div>

        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search campaigns, orgs, ICPs…"
            className="w-80 rounded-full border border-surface-softer bg-white py-2 pl-9 pr-4 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setStatusTab(t);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
              statusTab === t
                ? "bg-coral text-white"
                : "border border-surface-softer bg-white text-ink-muted hover:border-coral hover:text-coral"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading campaigns…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load campaigns.</p>}

      {query.data && (
        <>
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
                {pageRows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                  >
                    <td className="py-3 pl-6 pr-4">
                      <Link href={`/campaigns/${c.id}`} className="font-medium text-ink hover:text-coral">
                        {c.name}
                      </Link>
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
                      No campaigns match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </>
      )}
    </div>
  );
}
