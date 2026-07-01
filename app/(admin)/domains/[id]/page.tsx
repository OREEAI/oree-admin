"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { GetAdminDomainDetailApi } from "@/service/resources";
import { AdminTh, Pill } from "../../_components/table";

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

  return (
    <div>
      <Link href="/domains" className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral">
        ← Domains
      </Link>

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load domain.</p>}

      {d && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{d.domain_name}</h1>
            <Pill label={d.status} tone={d.status === "active" ? "success" : "warning"} />
            <Pill label={d.dns_verified ? "DNS verified" : "DNS unverified"} tone={d.dns_verified ? "success" : "warning"} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {d.organization_name} · {d.provider}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
              <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">DNS &amp; provider</p>
              <dl className="mt-4 space-y-2">
                <KV k="Provider" v={d.provider} />
                <KV k="DNS verified" v={d.dns_verified ? "Yes" : "No"} />
                <KV k="DKIM key" v={d.dkim_key_present ? "Present" : "—"} />
                <KV k="Tracking subdomain" v={d.tracking_subdomain || "—"} />
                <KV k="Registrar ID" v={d.registrar_id || "—"} />
              </dl>
            </div>
            <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
              <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">Lifecycle</p>
              <dl className="mt-4 space-y-2">
                <KV k="Purchased" v={fmt(d.purchased_at)} />
                <KV k="Expires" v={fmt(d.expires_at)} />
                <KV k="Last sync" v={fmt(d.last_sync_at)} />
                <KV k="Created" v={fmt(d.created_at)} />
              </dl>
              {d.last_sync_error && (
                <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">
                  {d.last_sync_error}
                </p>
              )}
            </div>
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
                    <td className="py-3 pr-4 text-ink-muted">{mb.warmup}</td>
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

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}
