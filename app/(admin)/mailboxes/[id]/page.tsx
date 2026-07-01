"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

import { GetAdminMailboxDetailApi, MailboxActionApi } from "@/service/resources";
import { Pill } from "../../_components/table";

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
      <Link href="/mailboxes" className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral">
        ← Mailboxes
      </Link>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load mailbox.</p>}

      {m && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{m.email_address}</h1>
            <Pill label={m.status} tone={m.status === "active" ? "success" : "danger"} />
            {m.can_send && <Pill label="can send" tone="success" />}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {m.organization_name} · {m.provider}
            {m.assigned_user ? ` · ${m.assigned_user}` : ""}
          </p>

          {/* Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Sent" value={m.metrics?.SENT ?? 0} />
            <Metric label="Opened" value={m.metrics?.OPEN ?? 0} />
            <Metric label="Replied" value={m.metrics?.REPLY ?? 0} />
            <Metric label="Bounced" value={m.metrics?.BOUNCE ?? 0} />
          </div>

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
            {m.status === "active" ? (
              <ActionBtn label="Revoke" tone="danger" onClick={() => action.mutate("revoke")} busy={action.isPending} />
            ) : (
              <ActionBtn label="Reactivate" onClick={() => action.mutate("reactivate")} busy={action.isPending} />
            )}
          </div>

          {/* Detail sections */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Warmup">
              <KV k="Status" v={m.warmup_status} />
              <KV k="Day" v={m.warmup_day} />
              <KV k="Days remaining" v={m.warmup_days_remaining} />
              <KV k="Started" v={fmt(m.warmup_start_date)} />
              <KV k="Completed" v={fmt(m.warmup_completed_at)} />
            </Section>
            <Section title="Send load">
              <KV k="Today" v={`${m.daily_send_count} / ${m.daily_send_limit}`} />
              <KV k="Priority" v={m.send_priority} />
              <KV k="Last used" v={fmt(m.last_used_at)} />
              <KV k="Next send" v={fmt(m.next_send_at)} />
              <KV k="Open / Click tracking" v={`${m.open_tracking_enabled ? "on" : "off"} / ${m.click_tracking_enabled ? "on" : "off"}`} />
            </Section>
            <Section title="Connection">
              <KV k="Provider" v={m.provider} />
              <KV k="Type" v={m.is_oauth ? "OAuth" : m.is_smtp ? "SMTP" : "—"} />
              <KV k="SMTP host" v={m.smtp_host || "—"} />
              <KV k="SMTP port" v={m.smtp_port ?? "—"} />
              <KV k="IMAP host" v={m.imap_host || "—"} />
              <KV k="Token expiry" v={fmt(m.token_expiry)} />
            </Section>
            <Section title="Meta">
              <KV k="Organisation" v={m.organization_name} />
              <KV k="Assigned user" v={m.assigned_user || "—"} />
              <KV k="Created" v={fmt(m.created_at)} />
              <KV k="Updated" v={fmt(m.updated_at)} />
            </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">{title}</p>
      <dl className="mt-4 space-y-2">{children}</dl>
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
