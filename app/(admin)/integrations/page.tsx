"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { GetAdminCrmConnectionsApi } from "@/service/resources";
import { AdminTh } from "../_components/table";
import { AvatarChip, StatePill } from "../_components/ui";

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

export default function IntegrationsPage() {
  const query = useQuery({
    queryKey: ["admin-crm-connections"],
    queryFn: GetAdminCrmConnectionsApi,
    staleTime: 60_000,
  });
  const rows = query.data ?? [];

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Integrations
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        CRM connections across every organisation — provider, token health and last activity.
      </p>
      {query.data ? (
        <p className="mt-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          {rows.length.toLocaleString()} connection{rows.length === 1 ? "" : "s"} ·{" "}
          {rows.filter((r) => r.token_expired).length.toLocaleString()} with expired tokens
        </p>
      ) : null}

      {query.isPending && <p className="mt-8 text-sm text-ink-soft">Loading connections…</p>}
      {query.isError && <p className="mt-8 text-sm text-coral">Couldn&apos;t load connections.</p>}

      {query.data && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <AdminTh className="pl-6">Organisation</AdminTh>
                <AdminTh>Provider</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Region</AdminTh>
                <AdminTh>Token</AdminTh>
                <AdminTh className="pr-6">Updated</AdminTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                >
                  <td className="py-3 pl-6 pr-4">
                    {c.organization_id ? (
                      <Link href={`/orgs/${c.organization_id}`} className="group flex items-center gap-3">
                        <AvatarChip label={c.organization_name} />
                        <span className="font-medium text-ink transition-colors group-hover:text-coral">
                          {c.organization_name}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-ink-muted">{c.organization_name || "—"}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-code text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink">
                      {c.provider}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <StatePill value={c.status} />
                  </td>
                  <td className="py-3 pr-4 font-code text-xs uppercase text-ink-muted">
                    {c.region || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {c.token_expired ? (
                      <StatePill value="expired" />
                    ) : c.token_expiry ? (
                      <span className="font-code text-xs text-ink-muted">
                        expires {fmt(c.token_expiry)}
                      </span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-6 font-code text-xs text-ink-soft">{fmt(c.updated_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-soft">
                    No CRM connections yet — they appear as customers connect Zoho / HubSpot.
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
