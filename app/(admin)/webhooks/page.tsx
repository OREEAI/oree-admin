"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import {
  GetWebhookEventApi,
  GetWebhookEventsApi,
  ReplayWebhookEventApi,
  type WebhookEventRow,
} from "@/service/resources";
import { AdminTh } from "../_components/table";
import { StatePill } from "../_components/ui";

const SOURCES = ["all", "stripe", "exa", "heygen", "unipile"] as const;
const STATUSES = ["all", "pending", "processing", "processed", "failed", "ignored"] as const;

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function WebhooksPage() {
  const [source, setSource] = useState<(typeof SOURCES)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-webhooks", source, statusFilter, page],
    queryFn: () =>
      GetWebhookEventsApi({
        page,
        source: source === "all" ? undefined : source,
        processing_status: statusFilter === "all" ? undefined : statusFilter,
      }),
    refetchInterval: 30_000,
  });

  const rows = query.data?.data ?? [];
  const totalPages = query.data?.total_pages ?? 1;

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Webhooks</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Incoming integration events — inspect payloads and replay failures.
      </p>
      {query.data ? (
        <p className="mt-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          {query.data.count.toLocaleString()} events
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          {SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSource(s);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
                source === s
                  ? "bg-coral text-white"
                  : "border border-surface-softer bg-white text-ink-muted hover:border-coral hover:text-coral"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
            Status
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
                statusFilter === s
                  ? "bg-navy-800 text-white"
                  : "border border-surface-softer bg-white text-ink-muted hover:border-navy-300 hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading events…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load webhook events.</p>}

      {query.data && (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-softer bg-surface-soft/50">
                  <AdminTh className="pl-6">Event</AdminTh>
                  <AdminTh>Source</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Retries</AdminTh>
                  <AdminTh className="pr-6">Received</AdminTh>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    open={openId === e.id}
                    onToggle={() => setOpenId(openId === e.id ? null : e.id)}
                    onChanged={() => query.refetch()}
                  />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-soft">
                      No webhook events match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-surface-softer bg-white px-4 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-code text-[0.65rem] tabular-nums text-ink-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-surface-softer bg-white px-4 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function EventRow({
  event,
  open,
  onToggle,
  onChanged,
}: {
  event: WebhookEventRow;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["admin-webhook", event.id],
    queryFn: () => GetWebhookEventApi(event.id),
    enabled: open,
  });

  const replay = useMutation({
    mutationFn: () => ReplayWebhookEventApi(event.id),
    onSuccess: () => {
      onChanged();
      qc.invalidateQueries({ queryKey: ["admin-webhook", event.id] });
    },
  });

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
      >
        <td className="py-3 pl-6 pr-4">
          <span className="font-medium text-ink">{event.event_type || "—"}</span>
          <span className="block font-code text-[0.6rem] text-ink-soft">
            {event.source_event_id}
          </span>
        </td>
        <td className="py-3 pr-4 font-code text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
          {event.source}
        </td>
        <td className="py-3 pr-4">
          <StatePill value={event.processing_status} />
        </td>
        <td className="py-3 pr-4 font-code text-xs tabular-nums text-ink-muted">
          {event.retry_count}
        </td>
        <td className="py-3 pr-6 font-code text-xs text-ink-soft">{fmt(event.created_at)}</td>
      </tr>
      {open ? (
        <tr className="border-b border-surface-softer/60 bg-surface-soft/30">
          <td colSpan={5} className="px-6 py-4">
            {detailQuery.isPending ? (
              <p className="text-sm text-ink-soft">Loading payload…</p>
            ) : detailQuery.data ? (
              <div>
                {detailQuery.data.processing_error ? (
                  <p className="mb-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">
                    {detailQuery.data.processing_error}
                  </p>
                ) : null}
                <pre className="max-h-80 overflow-auto rounded-lg bg-navy-900/95 p-4 font-code text-xs leading-relaxed text-white/80">
                  {JSON.stringify(detailQuery.data.payload ?? {}, null, 2)}
                </pre>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      replay.mutate();
                    }}
                    disabled={replay.isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-surface-softer bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral disabled:opacity-50"
                  >
                    <FiRefreshCw className="h-3.5 w-3.5" />
                    {replay.isPending ? "Replaying…" : "Replay event"}
                  </button>
                  {replay.isError ? (
                    <span className="text-xs text-coral">
                      {getApiErrorMessage(replay.error, "Replay failed.")}
                    </span>
                  ) : replay.isSuccess ? (
                    <span className="text-xs text-success">Replayed.</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-coral">Couldn&apos;t load the payload.</p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}
