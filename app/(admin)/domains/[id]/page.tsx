"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FiGlobe, FiZap } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import { ConfigureDomainDnsApi, GetAdminDomainDetailApi, SetDomainDkimApi } from "@/service/resources";
import { AdminTh, Pill } from "../../_components/table";
import { BackLink, DetailList, DetailRow, Panel, StatePill } from "../../_components/ui";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["admin-domain", id],
    queryFn: () => GetAdminDomainDetailApi(id),
    staleTime: 30_000,
  });
  const d = query.data;

  const configure = useMutation({
    mutationFn: () => ConfigureDomainDnsApi(id),
    onSuccess: () => query.refetch(),
  });

  return (
    <div>
      <BackLink href="/domains" label="Domains" />

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load domain.</p>}

      {d && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-white">
              <FiGlobe className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{d.domain_name}</h1>
                <Pill label={d.status} tone={d.status === "active" ? "success" : "warning"} />
                <Pill label={d.dns_verified ? "DNS verified" : "DNS unverified"} tone={d.dns_verified ? "success" : "warning"} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {d.organization_name} · {d.provider}
              </p>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => configure.mutate()}
                disabled={configure.isPending}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  d.dns_verified
                    ? "border border-surface-softer bg-white text-ink-muted hover:border-coral hover:text-coral"
                    : "bg-coral text-white shadow-[0_8px_20px_-8px_rgba(242,78,46,0.45)] hover:bg-coral-700"
                }`}
              >
                <FiZap className="h-4 w-4" />
                {configure.isPending
                  ? "Configuring…"
                  : d.dns_verified
                    ? "Re-run DNS sync"
                    : "Finish DNS setup"}
              </button>
            </div>
          </div>
          {configure.isSuccess ? (
            <p
              className={`mt-3 text-sm ${configure.data.dns_verified ? "text-success" : "text-warning"}`}
            >
              {configure.data.dns_verified
                ? "DNS configured and verified — the domain is active."
                : `Records written, but verification hasn't passed yet${configure.data.sync_error ? `: ${configure.data.sync_error}` : " — DNS can take a few minutes to propagate; run it again shortly."}`}
            </p>
          ) : configure.isError ? (
            <p className="mt-3 text-sm text-coral">
              {getApiErrorMessage(configure.error, "DNS configuration failed.")}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Panel title="DNS &amp; provider" right={<StatePill value={d.dns_verified ? "verified" : "pending"} />}>
              <DetailList>
                <DetailRow label="Provider" value={d.provider} />
                <DetailRow label="DKIM key" value={<StatePill value={d.dkim_key_present ? "yes" : "no"} />} />
                <DetailRow label="Tracking subdomain" value={d.tracking_subdomain || "—"} />
                <DetailRow label="Registrar ID" value={d.registrar_id || "—"} />
              </DetailList>
            </Panel>
            <Panel title="Lifecycle">
              <DetailList>
                <DetailRow label="Purchased" value={fmt(d.purchased_at)} />
                <DetailRow label="Expires" value={fmt(d.expires_at)} />
                <DetailRow label="Last sync" value={fmt(d.last_sync_at)} />
                <DetailRow label="Created" value={fmt(d.created_at)} />
              </DetailList>
              {d.last_sync_error && (
                <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">
                  {d.last_sync_error}
                </p>
              )}
            </Panel>
          </div>

          {!d.dkim_key_present ? <DkimPanel domainId={id} onSaved={() => query.refetch()} /> : null}

          <h2 className="mt-8 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
            Mailboxes on this domain ({d.mailboxes.length})
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-softer bg-surface-soft/50">
                  <AdminTh className="pl-6">Mailbox</AdminTh>
                  <AdminTh>Warmup</AdminTh>
                  <AdminTh className="pr-6">Status</AdminTh>
                </tr>
              </thead>
              <tbody>
                {d.mailboxes.map((mb, i) => (
                  <tr key={i} className="border-b border-surface-softer/60">
                    <td className="py-3 pl-6 pr-4 font-medium text-ink">{mb.email}</td>
                    <td className="py-3 pr-4"><StatePill value={mb.warmup} /></td>
                    <td className="py-3 pr-6">
                      <Pill label={mb.status} tone={mb.status === "active" ? "success" : "danger"} />
                    </td>
                  </tr>
                ))}
                {d.mailboxes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-ink-soft">
                      No mailboxes on this domain.
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


function DkimPanel({ domainId, onSaved }: { domainId: string; onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: () => SetDomainDkimApi(domainId, value.trim()),
    onMutate: () => setError(""),
    onSuccess: onSaved,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't publish the DKIM key.")),
  });

  return (
    <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/5 p-6">
      <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink">
        DKIM key missing
      </p>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Generate the key in Google Admin (Apps → Google Workspace → Gmail → Authenticate email →
        select this domain → Generate new record), then paste the full TXT value below. It is
        published to the zone immediately.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        spellCheck={false}
        placeholder="v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC…"
        className="mt-3 w-full rounded-lg border border-surface-softer bg-white px-3 py-2 font-code text-xs leading-relaxed text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />
      {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending || !value.trim().toLowerCase().startsWith("v=dkim1")}
        className="mt-3 rounded-full bg-coral px-5 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
      >
        {save.isPending ? "Publishing…" : "Publish DKIM key"}
      </button>
      {!value.trim() || value.trim().toLowerCase().startsWith("v=dkim1") ? null : (
        <p className="mt-2 text-xs text-warning">The value must start with v=DKIM1</p>
      )}
    </div>
  );
}
