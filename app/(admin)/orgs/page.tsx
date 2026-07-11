"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiSearch } from "react-icons/fi";

import { GetAdminOrgsApi } from "@/service/orgs";
import { rqKeys } from "@/utils/constants";
import { StatusBadge, TierBadge } from "./badges";

export default function OrgsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const orgsQuery = useQuery({
    queryKey: [rqKeys.orgs],
    queryFn: GetAdminOrgsApi,
    staleTime: 5 * 60_000,
  });

  const all = useMemo(() => orgsQuery.data ?? [], [orgsQuery.data]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const o of all) if (o.status) set.add(o.status.toLowerCase());
    return Array.from(set).sort();
  }, [all]);

  const orgs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((o) => {
      if (statusFilter !== "all" && (o.status ?? "").toLowerCase() !== statusFilter) return false;
      if (q && !o.organization_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, search, statusFilter]);

  const activeCount = useMemo(
    () => all.filter((o) => (o.status ?? "").toLowerCase() === "active").length,
    [all],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            Organisations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Every organisation on the platform. Open one to override its tier or issue a refund.
          </p>
          {orgsQuery.data ? (
            <p className="mt-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {all.length.toLocaleString()} total · {activeCount.toLocaleString()} active
            </p>
          ) : null}
        </div>

        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations…"
            className="w-72 rounded-full border border-surface-softer bg-white py-2 pl-9 pr-4 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
          />
        </label>
      </div>

      {statuses.length > 1 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["all", ...statuses].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
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
      ) : null}

      {orgsQuery.isPending && <p className="mt-8 text-sm text-ink-soft">Loading organisations…</p>}
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
                    <Link href={`/orgs/${org.id}`} className="group flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 font-code text-xs font-bold text-white">
                        {org.organization_name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <span className="font-medium text-ink transition-colors group-hover:text-coral">
                        {org.organization_name}
                      </span>
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-surface-softer px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral"
                    >
                      Manage
                      <FiArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-ink-soft">
                    {search || statusFilter !== "all"
                      ? "No organisations match the current filters."
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
      className={`py-3 pr-4 text-left font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft ${className}`}
    >
      {children}
    </th>
  );
}
