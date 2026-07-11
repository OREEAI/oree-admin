"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { GetAdminUsersApi } from "@/service/users";
import { rqKeys } from "@/utils/constants";
import { StatusBadge, TierBadge } from "../orgs/badges";

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const usersQuery = useQuery({
    queryKey: [rqKeys.adminUsers],
    queryFn: () => GetAdminUsersApi(),
    staleTime: 5 * 60_000,
  });

  const users = useMemo(() => {
    const all = usersQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        u.organization_name.toLowerCase().includes(q),
    );
  }, [usersQuery.data, search]);

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Users
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Every user across the platform, with their account status and
        subscription tier.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, or organisation…"
        className="mt-6 w-80 rounded-full border border-surface-softer bg-white px-4 py-2 text-sm placeholder:text-ink-soft/70 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
      />

      {usersQuery.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading users…</p>
      )}
      {usersQuery.isError && (
        <p className="mt-8 text-sm text-coral">
          Couldn&apos;t load users. Check you&apos;re a super-admin.
        </p>
      )}

      {usersQuery.data && (
        <>
          <p className="mt-6 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            {users.length} user{users.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-softer bg-surface-soft/50">
                  <Th className="pl-6">User</Th>
                  <Th>Organisation</Th>
                  <Th>Role</Th>
                  <Th>Subscription</Th>
                  <Th>Billing</Th>
                  <Th className="pr-6">Status</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                  >
                    <td className="py-3 pl-6 pr-4">
                      <Link href={`/users/${u.id}`} className="font-medium text-ink hover:text-coral">
                        {u.full_name || u.email}
                      </Link>
                      {u.full_name ? (
                        <div className="text-xs text-ink-soft">{u.email}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {u.organization_name || "—"}
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{u.role}</td>
                    <td className="py-3 pr-4">
                      <TierBadge tier={u.tier} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.subscription_status} />
                    </td>
                    <td className="py-3 pr-6">
                      <StatusBadge status={u.status} />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-ink-soft"
                    >
                      {search
                        ? `No users match “${search}”.`
                        : "No users found."}
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
