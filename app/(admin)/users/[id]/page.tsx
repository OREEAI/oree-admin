"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  FiCheckCircle,
  FiDatabase,
  FiInbox,
  FiLinkedin,
  FiMail,
  FiSend,
  FiTarget,
  FiUsers,
} from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import { GetAdminUserDetailApi, UpdateAdminUserApi } from "@/service/users";
import { rqKeys } from "@/utils/constants";
import { AvatarChip, BackLink, Panel, RoleBadge, Stat, UsageBar } from "../../_components/ui";
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
      <BackLink href="/users" label="All users" />

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
          <div className="mt-5 flex items-center gap-4">
            <AvatarChip
              label={user.full_name || user.email}
              className="h-14 w-14 rounded-2xl text-xl"
            />
            <div>
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
                {user.full_name || user.email}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-muted">{user.email}</span>
                <RoleBadge role={user.role} />
                <TierBadge tier={user.tier} />
                <StatusBadge status={user.status} />
                {user.organization_id ? (
                  <Link
                    href={`/orgs/${user.organization_id}`}
                    className="font-code text-[0.65rem] font-bold uppercase tracking-[0.16em] text-coral hover:text-coral-700"
                  >
                    {user.organization_name} →
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {/* Lead allowance as a real usage bar. */}
          {user.monthly_lead_limit != null ? (
            <div className="mt-6 max-w-md rounded-xl border border-surface-softer bg-white px-4 py-3 shadow-soft-lift">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
                  Lead allowance this month
                </span>
                <span className="font-code text-xs tabular-nums text-ink">
                  {(user.leads_used_this_month ?? 0).toLocaleString()} /{" "}
                  {user.monthly_lead_limit.toLocaleString()}
                </span>
              </div>
              <UsageBar used={user.leads_used_this_month ?? 0} cap={user.monthly_lead_limit} />
            </div>
          ) : null}

          <AccountOpsPanel
            userId={userId}
            isActive={user.status === "active"}
            role={user.role}
            monthlyLeadLimit={user.monthly_lead_limit ?? null}
            onSaved={() => userQuery.refetch()}
          />

          {/* Stat cards (last 30 days) */}
          <p className="mt-8 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            Last 30 days
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat icon={FiUsers} label="Leads owned" value={stats.leads_assigned_total} />
            <Stat icon={FiDatabase} label="New leads (30d)" value={stats.leads_assigned_window} />
            <Stat icon={FiTarget} label="In sequence" value={stats.leads_in_sequence} />
            <Stat icon={FiSend} label="Emails sent" value={stats.emails_sent_window} />
            <Stat icon={FiInbox} label="Opened" value={stats.emails_opened_window} />
            <Stat
              icon={FiCheckCircle}
              label="Replied"
              value={stats.emails_replied_window}
              tone={stats.emails_replied_window ? "success" : undefined}
            />
            <Stat icon={FiLinkedin} label="LinkedIn actions" value={stats.linkedin_actions_window} />
            <Stat icon={FiMail} label="Mailboxes" value={mailboxes.length} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
      <p className="px-6 py-4 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
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

function AccountOpsPanel({
  userId,
  isActive,
  role,
  monthlyLeadLimit,
  onSaved,
}: {
  userId: string;
  isActive: boolean;
  role: string;
  monthlyLeadLimit: number | null;
  onSaved: () => void;
}) {
  const [roleValue, setRoleValue] = useState(role);
  const [capValue, setCapValue] = useState(monthlyLeadLimit != null ? String(monthlyLeadLimit) : "");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: (payload: Parameters<typeof UpdateAdminUserApi>[1]) =>
      UpdateAdminUserApi(userId, payload),
    onMutate: () => {
      setNotice("");
      setError("");
    },
    onSuccess: () => {
      setNotice("Saved.");
      setPassword("");
      onSaved();
    },
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't save. Try again.")),
  });

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let out = "";
    const buf = new Uint32Array(14);
    crypto.getRandomValues(buf);
    buf.forEach((n) => {
      out += chars[n % chars.length];
    });
    setPassword(out);
  };

  return (
    <div className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
      <Panel title="Account">
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-surface-softer px-3 py-2.5">
            <div>
              <p className="text-sm text-ink">Account active</p>
              <p className="text-[0.7rem] text-ink-soft">Inactive users cannot sign in anywhere.</p>
            </div>
            <button
              type="button"
              onClick={() => mut.mutate({ is_active: !isActive })}
              disabled={mut.isPending}
              className={`rounded-full px-4 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] transition-colors disabled:opacity-50 ${
                isActive
                  ? "border border-coral/40 bg-white text-coral hover:bg-coral hover:text-white"
                  : "bg-success text-white hover:bg-success/80"
              }`}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          <div>
            <p className="mb-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              Role
            </p>
            <div className="flex gap-2">
              <select
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                className="flex-1 rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="org_admin">Org admin</option>
                <option value="content_admin">Content admin</option>
                <option value="super_admin">Super admin</option>
              </select>
              <button
                type="button"
                onClick={() => mut.mutate({ role: roleValue })}
                disabled={mut.isPending || roleValue === role}
                className="rounded-full bg-navy-800 px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Set password">
        <p className="mt-2 text-[0.7rem] text-ink-soft">
          Sets a new password immediately — share it with the user over a safe channel.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="min-w-0 flex-1 rounded-lg border border-surface-softer bg-white px-3 py-2 font-code text-xs text-ink focus:border-coral focus:outline-none"
          />
          <button
            type="button"
            onClick={genPassword}
            className="shrink-0 rounded-full border border-surface-softer bg-white px-3 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-coral hover:text-coral"
          >
            Generate
          </button>
        </div>
        <button
          type="button"
          onClick={() => mut.mutate({ password })}
          disabled={mut.isPending || password.length < 8}
          className="mt-3 w-full rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
        >
          {mut.isPending ? "Saving…" : "Set password"}
        </button>
      </Panel>

      <Panel title="Lead allowance">
        <p className="mt-2 text-[0.7rem] text-ink-soft">
          Custom monthly lead cap for this seat — drives their meter and sourcing limit. Blank =
          inherit tier default.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={0}
            value={capValue}
            onChange={(e) => setCapValue(e.target.value)}
            placeholder="e.g. 700"
            className="min-w-0 flex-1 rounded-lg border border-surface-softer bg-white px-3 py-2 font-code text-sm tabular-nums text-ink focus:border-coral focus:outline-none"
          />
          <button
            type="button"
            onClick={() =>
              mut.mutate({
                monthly_lead_limit: capValue.trim() === "" ? null : Number(capValue),
              })
            }
            disabled={mut.isPending}
            className="shrink-0 rounded-full bg-navy-800 px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Panel>

      {(notice || error) && (
        <p
          className={`xl:col-span-3 ${error ? "text-coral" : "text-success"} text-sm`}
        >
          {error || notice}
        </p>
      )}
    </div>
  );
}
