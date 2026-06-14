"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ListPostsApi } from "@/service/content";
import { GetAdminOrgsApi } from "@/service/orgs";
import { rqKeys } from "@/utils/constants";

export default function AdminDashboardPage() {
  const orgsQuery = useQuery({
    queryKey: [rqKeys.orgs],
    queryFn: GetAdminOrgsApi,
    staleTime: 5 * 60_000,
  });
  const postsQuery = useQuery({
    queryKey: ["admin-posts", "all"],
    queryFn: () => ListPostsApi(),
    staleTime: 5 * 60_000,
  });

  const orgs = orgsQuery.data ?? [];
  const posts = postsQuery.data ?? [];

  const stats = useMemo(() => {
    const norm = (s?: string) => (s ?? "").toLowerCase();
    const activeOrgs = orgs.filter((o) => norm(o.status) === "active").length;
    const published = posts.filter((p) => p.status === "published").length;
    const byTier = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const o of orgs) {
      const t = o.tier || "—";
      const s = o.status || "—";
      byTier.set(t, (byTier.get(t) ?? 0) + 1);
      byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
    }
    return {
      totalOrgs: orgs.length,
      activeOrgs,
      totalPosts: posts.length,
      published,
      byTier: Array.from(byTier.entries()).sort((a, b) => b[1] - a[1]),
      byStatus: Array.from(byStatus.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [orgs, posts]);

  const loading = orgsQuery.isPending || postsQuery.isPending;

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Admin console
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Platform overview across every organisation.
      </p>

      {/* Top-line stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Organisations" value={stats.totalOrgs} loading={loading} href="/orgs" />
        <StatCard label="Active orgs" value={stats.activeOrgs} loading={loading} href="/orgs" />
        <StatCard label="Blog posts" value={stats.totalPosts} loading={loading} href="/content/posts" />
        <StatCard label="Published" value={stats.published} loading={loading} href="/content/posts" />
      </div>

      {/* Breakdowns */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard title="Organisations by tier" rows={stats.byTier} loading={loading} />
        <BreakdownCard title="Organisations by status" rows={stats.byStatus} loading={loading} />
      </div>

      {/* Section shortcuts */}
      <h2 className="mt-10 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
        Manage
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NavCard
          href="/orgs"
          title="Organisations"
          desc="Tier overrides, refunds, impersonation."
        />
        <NavCard href="/content/posts" title="Content" desc="Write, edit and publish blog posts." />
        <NavCard href="/cleanup" title="Cleanup" desc="Run data-integrity cleanup tasks." />
        <NavCard href="/webhooks" title="Webhooks" desc="Inspect & replay integration events." />
      </div>

      {(orgsQuery.isError || postsQuery.isError) && (
        <p className="mt-6 text-sm text-coral">
          Some data couldn&apos;t load. Check you&apos;re a super-admin and the API is reachable.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  href,
}: {
  label: string;
  value: number;
  loading: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-surface-softer bg-white p-5 shadow-soft-lift transition-colors hover:border-coral"
    >
      <div className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </div>
      <div className="mt-2 font-code text-2xl font-bold tabular-nums text-ink">
        {loading ? "…" : value.toLocaleString()}
      </div>
    </Link>
  );
}

function BreakdownCard({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: [string, number][];
  loading: boolean;
}) {
  const total = rows.reduce((sum, [, n]) => sum + n, 0) || 1;
  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral">
        {title}
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-ink-soft">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(([name, count]) => (
            <div key={name}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink">{name}</span>
                <span className="font-code tabular-nums text-ink-muted">{count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${Math.round((count / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift transition-colors hover:border-coral"
    >
      <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
        {title}
      </p>
      <p className="mt-2 text-sm text-ink-muted">{desc}</p>
      <span className="mt-4 inline-block font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-soft group-hover:text-coral">
        Open →
      </span>
    </Link>
  );
}
