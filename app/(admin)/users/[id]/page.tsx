"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { GetAdminUserDetailApi } from "@/service/users";
import { rqKeys } from "@/utils/constants";
import { StatusBadge, TierBadge } from "../../orgs/badges";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const userQuery = useQuery({
    queryKey: [rqKeys.adminUsers, userId],
    queryFn: () => GetAdminUserDetailApi(userId),
    staleTime: 5 * 60_000,
  });

  const user = userQuery.data;
  const stats = user?.activity?.stats ?? {};
  const mailboxes = user?.activity?.mailboxes ?? [];
  const icps = user?.activity?.icps ?? [];
  const recent = user?.activity?.recent_activity ?? [];

  return (
    <div>
      <Link
        href="/users"
        className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral"
      >
        ← All users
      </Link>

      {userQuery.isPending && (
        <p className="mt-6 text-sm text-ink-soft">Loading user…</p>
      )}
      {userQuery.isError && (
        <p className="mt-6 text-sm text-coral">Couldn&apos;t load this user.</p>
      )}
      {userQuery.data === null && (
        <p className="mt-6 text-sm text-coral">User not found.</p>
      )}

      {user && (
        <>
          <h1 className="mt-4 text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            {user.full_name || user.email}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">{user.email}</span>
            <span className="text-ink-soft">·</span>
            <span className="text-sm text-ink-muted">{user.role}</span>
            <TierBadge tier={user.tier} />
            <StatusBadge status={user.status} />
            {user.organization_id ? (
              <Link
                href={`/orgs/${user.organization_id}`}
                className="text-sm text-coral hover:text-coral-700"
              >
                {user.organization_name}
              </Link>
            ) : null}
          </div>

          {/* Stat cards (last 30 days) */}
          <p className="mt-8 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            Last 30 days
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat
              label="Lead cap"
              value={
                user.monthly_lead_limit != null
                  ? `${(user.leads_used_this_month ?? 0).toLocaleString()} / ${user.monthly_lead_limit.toLocaleString()}`
                  : "—"
              }
            />
            <Stat label="Leads owned" value={stats.leads_assigned_total} />
            <Stat label="New leads (30d)" value={stats.leads_assigned_window} />
            <Stat label="In sequence" value={stats.leads_in_sequence} />
            <Stat label="Emails sent" value={stats.emails_sent_window} />
            <Stat label="Opened" value={stats.emails_opened_window} />
            <Stat label="Replied" value={stats.emails_replied_window} />
            <Stat label="LinkedIn actions" value={stats.linkedin_actions_window} />
          </div>

          {/* Mailboxes */}
          <Section title={`Mailboxes (${mailboxes.length})`}>
            {mailboxes.length === 0 ? (
              <Empty>No mailboxes assigned.</Empty>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-surface-softer bg-surface-soft/50">
                    <Th className="pl-6">Address</Th>
                    <Th>Provider</Th>
                    <Th>Today</Th>
                    <Th className="pr-6">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxes.map((m) => (
                    <tr key={m.id} className="border-b border-surface-softer/60">
                      <td className="py-3 pl-6 pr-4 text-ink">{m.email_address}</td>
                      <td className="py-3 pr-4 uppercase text-ink-muted">{m.provider}</td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {m.daily_send_count} / {m.daily_send_limit}
                      </td>
                      <td className="py-3 pr-6">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ICPs */}
          <Section title={`ICPs (${icps.length})`}>
            {icps.length === 0 ? (
              <Empty>No ICPs configured.</Empty>
            ) : (
              <ul className="px-6 py-4">
                {icps.map((icp) => (
                  <li key={icp.id} className="py-1 text-sm text-ink">
                    {icp.name}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Recent activity */}
          <Section title="Recent activity">
            {recent.length === 0 ? (
              <Empty>Nothing logged yet.</Empty>
            ) : (
              <ul className="divide-y divide-surface-softer/60">
                {recent.map((a, i) => (
                  <li key={i} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span className="text-ink">
                      <span className="font-medium">{a.title}</span>
                      {a.summary ? <span className="text-ink-muted"> — {a.summary}</span> : null}
                    </span>
                    <span className="font-code text-[0.65rem] text-ink-soft">
                      {a.occurred_at ? new Date(a.occurred_at).toLocaleDateString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="rounded-xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
      <p className="font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-ink">
        {typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
      <p className="px-6 py-4 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
        {title}
      </p>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-8 text-center text-sm text-ink-soft">{children}</p>;
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
