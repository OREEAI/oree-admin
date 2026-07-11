"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FiGlobe, FiZap } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import { ConfigureDomainDnsApi, GetAdminDomainDetailApi } from "@/service/resources";
import { AdminTh, Pill } from "../../_components/table";
import { BackLink, DetailList, DetailRow, HeaderAction, Panel, StatePill } from "../../_components/ui";

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
              <HeaderAction
                icon={FiZap}
                label={
                  configure.isPending
                    ? "Configuring…"
                    : d.dns_verified
                      ? "Re-run DNS sync"
                      : "Finish DNS setup"
                }
                disabled={configure.isPending}
                onClick={() => configure.mutate()}
              />
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

