"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetAdminOrgsApi } from "@/service/orgs";
import { rqKeys } from "@/utils/constants";
import { StatusBadge, TierBadge } from "./badges";

export default function OrgsPage() {
  const [search, setSearch] = useState("");

  const orgsQuery = useQuery({
    queryKey: [rqKeys.orgs],
    queryFn: GetAdminOrgsApi,
    staleTime: 5 * 60_000,
  });

  const orgs = useMemo(() => {
    const all = orgsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((o) => o.organization_name.toLowerCase().includes(q));
  }, [orgsQuery.data, search]);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Organisations
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every organisation on the platform. Open one to override its tier or
        issue a refund.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search organisations…"
        className="mt-6 w-72 rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />

      {orgsQuery.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading organisations…</p>
      )}
      {orgsQuery.isError && (
        <p className="mt-8 text-sm text-coral">
          Couldn&apos;t load organisations. Check you&apos;re a super-admin.
        </p>
      )}

      {orgsQuery.data && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <Th className="pl-6">Organisation</Th>
                <Th>Tier</Th>
                <Th>Status</Th>
                <Th className="pr-6 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                >
                  <td className="py-3 pl-6 pr-4">
                    <Link
                      href={`/orgs/${org.id}`}
                      className="font-medium text-ink hover:text-coral"
                    >
                      {org.organization_name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <TierBadge tier={org.tier} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={org.status} />
                  </td>
                  <td className="py-3 pl-4 pr-6 text-right">
                    <Link
                      href={`/orgs/${org.id}`}
                      className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral hover:text-coral-700"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-ink-soft"
                  >
                    {search
                      ? `No organisations match “${search}”.`
                      : "No organisations found."}
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

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-2.5 text-left font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft ${className}`}
    >
      {children}
    </th>
  );
}
