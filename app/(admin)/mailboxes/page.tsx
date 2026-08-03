"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetAdminMailboxesApi, type AdminMailbox } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh, Pill } from "../_components/table";
import { Pagination, paginateRows } from "../_components/ui";

const STATUS_TABS = ["all", "active", "warming", "revoked", "pending"] as const;

export default function MailboxesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");

  const query = useQuery({
    queryKey: [rqKeys.mailboxes],
    queryFn: () => GetAdminMailboxesApi(),
    staleTime: 60_000,
  });

  const rows = useMemo(() => {
    let all = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (q)
      all = all.filter(
        (m) =>
          m.email_address.toLowerCase().includes(q) ||
          m.organization_name.toLowerCase().includes(q),
      );
    if (statusTab !== "all") {
      all = all.filter((m) =>
        statusTab === "warming"
          ? m.warmup_status === "warming"
          : m.status === statusTab,
      );
    }
    return all;
  }, [query.data, search, statusTab]);

  const summary = useMemo(() => {
    const all = query.data ?? [];
    return {
      total: all.length,
      active: all.filter((m) => m.status === "active").length,
      warming: all.filter((m) => m.warmup_status === "warming").length,
      sentToday: all.reduce((n, m) => n + (m.daily_send_count || 0), 0),
      capacity: all.reduce((n, m) => n + (m.daily_send_limit || 0), 0),
    };
  }, [query.data]);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Mailboxes
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every sending mailbox across the platform — warmup, daily send load, and
        deliverability status in one place.
      </p>

      {query.data && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Mailboxes" value={summary.total} />
          <SummaryCard label="Active" value={summary.active} tone="success" />
          <SummaryCard label="Warming" value={summary.warming} tone="warning" />
          <SummaryCard
            label="Sent today"
            value={`${summary.sentToday} / ${summary.capacity}`}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
          placeholder="Search email or org…"
          className="w-72 rounded-full border border-surface-softer bg-white px-4 py-2 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />
        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
              setStatusTab(t);
              setPage(1);
            }}
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
      </div>

      {query.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading mailboxes…</p>
      )}
      {query.isError && (
        <p className="mt-8 text-sm text-coral">Couldn&apos;t load mailboxes.</p>
      )}

      {query.data && (
        <>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <AdminTh className="pl-6">Mailbox</AdminTh>
                <AdminTh>Organisation</AdminTh>
                <AdminTh>Provider</AdminTh>
                <AdminTh>Warmup</AdminTh>
                <AdminTh>Today</AdminTh>
                <AdminTh>Still sending</AdminTh>
                <AdminTh>Tracking</AdminTh>
                <AdminTh className="pr-6">Status</AdminTh>
              </tr>
            </thead>
            <tbody>
              {paginateRows(rows, page, 25).map((m) => (
                <MailboxRow key={m.id} m={m} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-ink-soft"
                  >
                    No mailboxes match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={rows.length} pageSize={25} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function MailboxRow({ m }: { m: AdminMailbox }) {
  const warmup =
    m.warmup_status === "completed"
      ? "Active"
      : m.warmup_status === "warming"
        ? `Day ${m.warmup_day}`
        : m.warmup_status;
  const tracking = [
    m.open_tracking_enabled ? "Opens" : null,
    m.click_tracking_enabled ? "Clicks" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <tr className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40">
      <td className="py-3 pl-6 pr-4">
        <Link href={`/mailboxes/${m.id}`} className="font-medium text-ink hover:text-coral">
          {m.email_address}
        </Link>
        {m.assigned_user && (
          <div className="text-xs text-ink-soft">{m.assigned_user}</div>
        )}
      </td>
      <td className="py-3 pr-4 text-ink-muted">{m.organization_name}</td>
      <td className="py-3 pr-4 text-ink-muted">{m.provider}</td>
      <td className="py-3 pr-4 text-ink-muted">{warmup}</td>
      <td className="py-3 pr-4 tabular-nums text-ink-muted">
        {m.daily_send_count}/{m.daily_send_limit}
      </td>
      <td className="py-3 pr-4">
        {m.pending_sends > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-code text-[0.62rem] font-bold tabular-nums text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {m.pending_sends} queued
          </span>
        ) : (
          <span className="font-code text-[0.62rem] text-ink-soft">clear</span>
        )}
      </td>
      <td className="py-3 pr-4 text-xs text-ink-soft">{tracking || "—"}</td>
      <td className="py-3 pr-6">
        <Pill
          label={m.status}
          tone={m.status === "active" ? "success" : m.status === "pending" ? "warning" : "danger"}
        />
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-ink";
  return (
    <div className="rounded-2xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
      <div className="font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
