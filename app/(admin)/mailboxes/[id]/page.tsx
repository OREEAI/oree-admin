"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import {
  FiCheckCircle,
  FiInbox,
  FiMail,
  FiSend,
  FiXCircle,
} from "react-icons/fi";

import { GetAdminMailboxDetailApi, MailboxActionApi } from "@/service/resources";
import { Pill } from "../../_components/table";
import { BackLink, DetailList, DetailRow, Panel, Stat, StatePill, UsageBar } from "../../_components/ui";

const BOUNCE_CLASS_LABELS: Record<string, string> = {
  hard_rejected: "rejected / spam-blocked",
  hard_invalid: "dead address",
  soft: "soft (quota / autoreply)",
  send_failure: "send failure (never left us)",
  unknown: "unclassified",
  unclassified: "unclassified",
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function MailboxDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-mailbox", id],
    queryFn: () => GetAdminMailboxDetailApi(id),
    staleTime: 30_000,
  });
  const m = query.data;

  const action = useMutation({
    mutationFn: (a: string) => MailboxActionApi(id, a),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-mailbox", id] }),
  });

  return (
    <div>
      <BackLink href="/mailboxes" label="Mailboxes" />

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load mailbox.</p>}

      {m && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-white">
              <FiMail className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{m.email_address}</h1>
                <Pill label={m.status} tone={m.status === "active" ? "success" : "danger"} />
                {m.can_send && <Pill label="can send" tone="success" />}
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {m.organization_name} · {m.provider}
                {m.assigned_user ? ` · ${m.assigned_user}` : ""}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={FiSend} label="Sent" value={m.metrics?.SENT ?? 0} />
            <Stat icon={FiInbox} label="Opened" value={m.metrics?.OPEN ?? 0} />
            <Stat
              icon={FiCheckCircle}
              label="Replied"
              value={m.metrics?.REPLY ?? 0}
              tone={(m.metrics?.REPLY ?? 0) > 0 ? "success" : undefined}
            />
            <Stat
              icon={FiXCircle}
              label="Bounced"
              value={m.metrics?.BOUNCE ?? 0}
              tone={(m.metrics?.BOUNCE ?? 0) > 0 ? "danger" : undefined}
            />
          </div>

          {/* Bounce breakdown — a raw bounce count can't be acted on;
              rejected = sender problem, dead address = list problem,
              send failure never left us at all. */}
          {(m.metrics?.BOUNCE ?? 0) > 0 && m.bounce_breakdown && (
            <p className="mt-2 text-xs text-ink-muted">
              Bounces:{" "}
              {Object.entries(m.bounce_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, n]) => `${n} ${BOUNCE_CLASS_LABELS[cls] ?? cls}`)
                .join(" · ")}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {m.warmup_status === "warming" ? (
              <ActionBtn label="Pause warmup" onClick={() => action.mutate("pause_warmup")} busy={action.isPending} />
            ) : (
              <ActionBtn label="Resume warmup" onClick={() => action.mutate("resume_warmup")} busy={action.isPending} />
            )}
            <ActionBtn
              label={m.open_tracking_enabled ? "Disable open tracking" : "Enable open tracking"}
              onClick={() => action.mutate("toggle_open_tracking")}
              busy={action.isPending}
            />
            <ActionBtn
              label={m.click_tracking_enabled ? "Disable click tracking" : "Enable click tracking"}
              onClick={() => action.mutate("toggle_click_tracking")}
              busy={action.isPending}
            />
            <ActionBtn label="Reset daily count" onClick={() => action.mutate("reset_daily")} busy={action.isPending} />
            {m.sending_paused ? (
              <ActionBtn label="Resume sending" onClick={() => action.mutate("resume_sending")} busy={action.isPending} />
            ) : (
              <ActionBtn
                label="Replies only (pause sending)"
                onClick={() => action.mutate("pause_sending")}
                busy={action.isPending}
              />
            )}
            {m.status === "active" ? (
              <ActionBtn label="Revoke" tone="danger" onClick={() => action.mutate("revoke")} busy={action.isPending} />
            ) : (
              <ActionBtn label="Reactivate" onClick={() => action.mutate("reactivate")} busy={action.isPending} />
            )}
          </div>

          {/* Detail sections */}
          <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Panel title="Warmup" right={<StatePill value={m.warmup_status} />}>
              <DetailList>
                <DetailRow label="Day" value={m.warmup_day} />
                <DetailRow label="Days remaining" value={m.warmup_days_remaining} />
                <DetailRow label="Started" value={fmt(m.warmup_start_date)} />
                <DetailRow label="Completed" value={fmt(m.warmup_completed_at)} />
              </DetailList>
            </Panel>
            <Panel
              title="Send load"
              right={
                <span className="font-code text-xs tabular-nums text-ink-muted">
                  {m.daily_send_count} / {m.daily_send_limit} today
                </span>
              }
            >
              <UsageBar used={m.daily_send_count} cap={m.daily_send_limit} />
              <DetailList>
                <DetailRow label="Priority" value={m.send_priority} />
                <DetailRow label="Last used" value={fmt(m.last_used_at)} />
                <DetailRow label="Next send" value={fmt(m.next_send_at)} />
                <DetailRow
                  label="Open / Click tracking"
                  value={`${m.open_tracking_enabled ? "on" : "off"} / ${m.click_tracking_enabled ? "on" : "off"}`}
                />
              </DetailList>
            </Panel>
            <Panel title="Connection">
              <DetailList>
                <DetailRow label="Provider" value={m.provider} />
                <DetailRow label="Type" value={m.is_oauth ? "OAuth" : m.is_smtp ? "SMTP" : "—"} />
                <DetailRow label="SMTP host" value={m.smtp_host || "—"} />
                <DetailRow label="SMTP port" value={m.smtp_port ?? "—"} />
                <DetailRow label="IMAP host" value={m.imap_host || "—"} />
                <DetailRow label="Token expiry" value={fmt(m.token_expiry)} />
              </DetailList>
            </Panel>
            <Panel title="Meta">
              <DetailList>
                <DetailRow label="Organisation" value={m.organization_name} />
                <DetailRow label="Assigned user" value={m.assigned_user || "—"} />
                <DetailRow label="Created" value={fmt(m.created_at)} />
                <DetailRow label="Updated" value={fmt(m.updated_at)} />
              </DetailList>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}




function ActionBtn({
  label,
  onClick,
  busy,
  tone,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-9 items-center rounded-full border px-4 font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-50 ${
        tone === "danger"
          ? "border-coral/30 text-coral hover:bg-coral/10"
          : "border-ink/15 text-ink hover:border-coral hover:text-coral"
      }`}
    >
      {label}
    </button>
  );
}
