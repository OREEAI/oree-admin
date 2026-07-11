"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetAdminDomainsApi } from "@/service/resources";
import { rqKeys } from "@/utils/constants";
import { AdminTh, Pill } from "../_components/table";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function DomainsPage() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: [rqKeys.domains],
    queryFn: () => GetAdminDomainsApi(),
    staleTime: 60_000,
  });

  const rows = useMemo(() => {
    const all = query.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (d) =>
        d.domain_name.toLowerCase().includes(q) ||
        d.organization_name.toLowerCase().includes(q),
    );
  }, [query.data, search]);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Domains
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every sending domain across the platform — DNS verification, provider,
        and expiry.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search domain or org…"
        className="mt-6 w-72 rounded-full border border-surface-softer bg-white px-4 py-2 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />

      {query.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading domains…</p>
      )}
      {query.isError && (
        <p className="mt-8 text-sm text-coral">Couldn&apos;t load domains.</p>
      )}

      {query.data && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <AdminTh className="pl-6">Domain</AdminTh>
                <AdminTh>Organisation</AdminTh>
                <AdminTh>Provider</AdminTh>
                <AdminTh>DNS</AdminTh>
                <AdminTh>Expires</AdminTh>
                <AdminTh className="pr-6">Status</AdminTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                >
                  <td className="py-3 pl-6 pr-4">
                    <Link href={`/domains/${d.id}`} className="font-medium text-ink hover:text-coral">
                      {d.domain_name}
                    </Link>
                    {d.last_sync_error && (
                      <div className="max-w-xs truncate text-xs text-coral" title={d.last_sync_error}>
                        {d.last_sync_error}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{d.organization_name}</td>
                  <td className="py-3 pr-4 text-ink-muted">{d.provider}</td>
                  <td className="py-3 pr-4">
                    <Pill
                      label={d.dns_verified ? "Verified" : "Unverified"}
                      tone={d.dns_verified ? "success" : "warning"}
                    />
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{fmtDate(d.expires_at)}</td>
                  <td className="py-3 pr-6">
                    <Pill
                      label={d.status}
                      tone={d.status === "active" ? "success" : d.status?.includes("fail") ? "danger" : "warning"}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-ink-soft">
                    No domains found.
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
