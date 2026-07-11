"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { FiClock, FiStar } from "react-icons/fi";

import { OreeMark } from "@/components/brand/oree-logo";
import { useUserQuery } from "@/hooks/useUser";
import { getApiErrorMessage } from "@/service/api";
import {
  type BlogPost,
  ListPostsApi,
  POST_STATUSES,
  type PostStatus,
  resolveCoverUrl,
} from "@/service/content";
import { InviteContentAdminApi } from "@/service/users";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PostsListPage() {
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const userQuery = useUserQuery();
  const isSuperAdmin = userQuery.data?.role === "super_admin";

  const postsQuery = useQuery({
    queryKey: ["admin-posts", statusFilter],
    queryFn: () => ListPostsApi(statusFilter === "all" ? undefined : statusFilter),
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const post of postsQuery.data ?? []) if (post.category) set.add(post.category);
    return Array.from(set).sort();
  }, [postsQuery.data]);

  const posts = useMemo(() => {
    let all = postsQuery.data ?? [];
    if (categoryFilter !== "all") all = all.filter((post) => post.category === categoryFilter);
    // Featured first, then newest.
    return [...all].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return String(b.published_at ?? b.created_at ?? "").localeCompare(
        String(a.published_at ?? a.created_at ?? ""),
      );
    });
  }, [postsQuery.data, categoryFilter]);

  const publishedCount = useMemo(
    () => (postsQuery.data ?? []).filter((post) => post.status === "published").length,
    [postsQuery.data],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            Blog posts
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Create, edit and publish marketing blog posts.
          </p>
          {postsQuery.data ? (
            <p className="mt-2 font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {postsQuery.data.length} posts · {publishedCount} live on the blog
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={() => setInviteOpen((v) => !v)}
              className="rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral"
            >
              Invite writer
            </button>
          ) : null}
          <Link
            href="/content/posts/new"
            className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
          >
            New post
          </Link>
        </div>
      </div>

      {isSuperAdmin && inviteOpen ? <InviteWriterPanel /> : null}

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          {(["all", ...POST_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
                statusFilter === s
                  ? "bg-coral text-white"
                  : "border border-surface-softer bg-white text-ink-muted hover:border-coral hover:text-coral"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {categories.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
              Category
            </span>
            {["all", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
                  categoryFilter === c
                    ? "bg-navy-800 text-white"
                    : "border border-surface-softer bg-white text-ink-muted hover:border-navy-300 hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {postsQuery.isPending && (
        <p className="mt-8 text-sm text-ink-soft">Loading posts…</p>
      )}
      {postsQuery.isError && (
        <p className="mt-8 text-sm text-coral">
          Couldn&apos;t load posts. Check you&apos;re a super-admin.
        </p>
      )}

      {postsQuery.data && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post: BlogPost) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-surface-softer bg-white px-6 py-12 text-center text-sm text-ink-soft">
              No posts match the current filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const statusTone =
    post.status === "published"
      ? "bg-success/90 text-white"
      : post.status === "archived"
        ? "bg-ink/60 text-white"
        : "bg-warning/90 text-white";

  return (
    <Link
      href={`/content/posts/${post.slug}/edit`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift transition-all hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-lg"
    >
      {/* Cover — real image when set, branded navy fallback when not. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-navy-900">
        {resolveCoverUrl(post.cover_image_url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveCoverUrl(post.cover_image_url)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="relative flex h-full w-full items-end p-4">
            <OreeMark className="absolute -right-8 -top-10 h-40 w-40 opacity-[0.12]" />
            <span className="relative font-code text-[0.6rem] font-bold uppercase tracking-[0.22em] text-white/50">
              {post.category || "Oree blog"}
            </span>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] ${statusTone}`}
        >
          {post.status}
        </span>
        {post.featured ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white">
            <FiStar className="h-3 w-3" />
            Featured
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-code text-[0.58rem] font-bold uppercase tracking-[0.18em] text-coral">
            {post.category || "Uncategorised"}
          </span>
          {post.reading_time_min ? (
            <span className="inline-flex items-center gap-1 font-code text-[0.6rem] tabular-nums text-ink-soft">
              <FiClock className="h-3 w-3" />
              {post.reading_time_min} min
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-snug text-ink transition-colors group-hover:text-coral">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-ink-soft">
          <span className="truncate">{post.author_name || "—"}</span>
          <span className="shrink-0 font-code tabular-nums">{fmtDate(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function InviteWriterPanel() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [copied, setCopied] = useState(false);

  const invite = useMutation({
    mutationFn: () => InviteContentAdminApi(email.trim(), firstName.trim()),
  });

  const inviteUrl = invite.data?.invite_url ?? "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the URL is visible to copy manually.
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-surface-softer bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Invite a writer</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Writers get a content-admin login: they can create, edit and publish blog posts, and
        see nothing else in this console. The invite link is shown once — copy it and send it
        to them directly.
      </p>

      {inviteUrl ? (
        <div className="mt-4">
          <p className="text-xs text-ink-muted">
            Invite created for <span className="font-medium text-ink">{invite.data?.email}</span>
            {" "}(expires {new Date(invite.data?.expires_at ?? "").toLocaleDateString()}):
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-surface-softer bg-surface-soft px-3 py-2 text-xs text-ink">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="writer@example.com"
              className="w-64 rounded-lg border border-surface-softer px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              First name (optional)
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Kingsley"
              className="w-44 rounded-lg border border-surface-softer px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => invite.mutate()}
            disabled={!email.trim() || invite.isPending}
            className="rounded-full bg-coral px-5 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
          >
            {invite.isPending ? "Creating…" : "Create invite"}
          </button>
        </div>
      )}

      {invite.isError ? (
        <p className="mt-3 text-xs text-coral">
          {getApiErrorMessage(invite.error, "Couldn't create the invite. Try again.")}
        </p>
      ) : null}
    </div>
  );
}

