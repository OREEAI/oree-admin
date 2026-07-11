"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useUserQuery } from "@/hooks/useUser";
import { type BlogPost, ListPostsApi } from "@/service/content";
import { GetAdminOrgsApi } from "@/service/orgs";
import { GetPlatformStatsApi } from "@/service/resources";
import { rqKeys } from "@/utils/constants";

export default function AdminDashboardPage() {
  const userQuery = useUserQuery();
  const isContentAdmin = userQuery.data?.role === "content_admin";

  if (userQuery.isPending) return null;
  if (isContentAdmin) return <ContentDashboard />;
  return <PlatformDashboard />;
}

function PlatformDashboard() {
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
  const platformQuery = useQuery({
    queryKey: [rqKeys.platformStats],
    queryFn: GetPlatformStatsApi,
    staleTime: 60_000,
  });
  const p = platformQuery.data;

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

      {/* Platform resources — what's actually in the system */}
      <h2 className="mt-10 font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
        Platform
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads in DB" value={p?.leads.total ?? 0} loading={!p} href="/orgs" />
        <StatCard label="Unlinked pool" value={p?.leads.unlinked_pool ?? 0} loading={!p} href="/orgs" />
        <StatCard
          label="Mailboxes (active)"
          value={p?.mailboxes.active ?? 0}
          loading={!p}
          href="/mailboxes"
        />
        <StatCard label="Domains" value={p?.domains.total ?? 0} loading={!p} href="/domains" />
        <StatCard
          label="Campaigns running"
          value={p?.campaigns.running ?? 0}
          loading={!p}
          href="/campaigns"
        />
        <StatCard
          label="Campaigns failed today"
          value={p?.campaigns.failed_today ?? 0}
          loading={!p}
          href="/campaigns"
        />
        <StatCard
          label="Sent today"
          value={p?.mailboxes.sent_today ?? 0}
          loading={!p}
          href="/mailboxes"
        />
        <StatCard label="Warming" value={p?.mailboxes.warming ?? 0} loading={!p} href="/mailboxes" />
      </div>

      {/* Deliverability pulse — today's email events */}
      {p && (
        <div className="mt-4 flex flex-wrap gap-6 rounded-2xl border border-surface-softer bg-white px-6 py-4 shadow-soft-lift">
          <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            Email today
          </span>
          <MiniStat label="Sent" value={p.email_today.SENT ?? 0} />
          <MiniStat label="Opened" value={p.email_today.OPEN ?? 0} />
          <MiniStat label="Replied" value={p.email_today.REPLY ?? 0} />
          <MiniStat label="Bounced" value={p.email_today.BOUNCE ?? 0} />
        </div>
      )}

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
        <NavCard href="/mailboxes" title="Mailboxes" desc="Warmup, send load, deliverability." />
        <NavCard href="/domains" title="Domains" desc="DNS verification, provider, expiry." />
        <NavCard href="/campaigns" title="Campaigns" desc="Live runs, queued, failures." />
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

function ContentDashboard() {
  const postsQuery = useQuery({
    queryKey: ["admin-posts", "all"],
    queryFn: () => ListPostsApi(),
    staleTime: 5 * 60_000,
  });
  const posts = postsQuery.data ?? [];
  const loading = postsQuery.isPending;

  const counts = useMemo(() => {
    const by = (s: string) => posts.filter((p) => p.status === s).length;
    return {
      total: posts.length,
      published: by("published"),
      draft: by("draft"),
      archived: by("archived"),
    };
  }, [posts]);

  const recent: BlogPost[] = useMemo(
    () =>
      [...posts]
        .sort((a, b) =>
          String(b.published_at ?? b.created_at ?? "").localeCompare(
            String(a.published_at ?? a.created_at ?? ""),
          ),
        )
        .slice(0, 6),
    [posts],
  );

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Content dashboard
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Your writing at a glance — posts, drafts and what&apos;s live on the blog.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Blog posts" value={counts.total} loading={loading} href="/content/posts" />
        <StatCard label="Published" value={counts.published} loading={loading} href="/content/posts" />
        <StatCard label="Drafts" value={counts.draft} loading={loading} href="/content/posts" />
        <StatCard label="Archived" value={counts.archived} loading={loading} href="/content/posts" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-code text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
          Recent posts
        </h2>
        <Link
          href="/content/posts/new"
          className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
        >
          New post
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
        {loading ? (
          <p className="px-6 py-6 text-sm text-ink-soft">Loading posts…</p>
        ) : recent.length === 0 ? (
          <p className="px-6 py-6 text-sm text-ink-soft">
            No posts yet. Your first one starts with the button above.
          </p>
        ) : (
          recent.map((post) => (
            <Link
              key={post.slug}
              href={`/content/posts/${post.slug}`}
              className="flex items-center justify-between gap-4 border-b border-surface-softer/60 px-6 py-3.5 transition-colors last:border-b-0 hover:bg-surface-soft/50"
            >
              <span className="min-w-0 truncate text-sm font-medium text-ink">{post.title}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] ${
                  post.status === "published"
                    ? "bg-success/10 text-success"
                    : post.status === "draft"
                      ? "bg-coral/10 text-coral"
                      : "bg-ink/5 text-ink-soft"
                }`}
              >
                {post.status}
              </span>
            </Link>
          ))
        )}
      </div>

      {postsQuery.isError ? (
        <p className="mt-6 text-sm text-coral">Couldn&apos;t load posts. Refresh to try again.</p>
      ) : null}
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-code text-lg font-bold tabular-nums text-ink">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-ink-soft">{label}</span>
    </span>
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
