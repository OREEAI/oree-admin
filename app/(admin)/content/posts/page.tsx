"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  type BlogPost,
  ListPostsApi,
  POST_STATUSES,
  type PostStatus,
} from "@/service/content";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function PostsListPage() {
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");

  const postsQuery = useQuery({
    queryKey: ["admin-posts", statusFilter],
    queryFn: () => ListPostsApi(statusFilter === "all" ? undefined : statusFilter),
  });

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
        </div>
        <Link
          href="/content/posts/new"
          className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
        >
          New post
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {(["all", ...POST_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] transition-colors ${
              statusFilter === s
                ? "bg-coral text-white"
                : "border border-surface-softer text-ink-muted hover:border-coral hover:text-coral"
            }`}
          >
            {s}
          </button>
        ))}
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
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-softer bg-white shadow-soft-lift">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-softer bg-surface-soft/50">
                <Th className="pl-6">Title</Th>
                <Th>Status</Th>
                <Th>Category</Th>
                <Th>Author</Th>
                <Th className="pr-6 text-right">Published</Th>
              </tr>
            </thead>
            <tbody>
              {postsQuery.data.map((post: BlogPost) => (
                <tr
                  key={post.id}
                  className="border-b border-surface-softer/60 transition-colors hover:bg-surface-soft/40"
                >
                  <td className="py-3 pl-6 pr-4">
                    <Link
                      href={`/content/posts/${post.slug}/edit`}
                      className="font-medium text-ink hover:text-coral"
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span className="ml-2 font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-coral">
                        ★ featured
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-code text-[0.56rem] font-bold uppercase tracking-[0.14em] ${
                        post.status === "published"
                          ? "bg-success/10 text-success"
                          : post.status === "archived"
                            ? "bg-ink/5 text-ink-muted"
                            : "bg-warning/15 text-warning"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{post.category || "—"}</td>
                  <td className="py-3 pr-4 text-ink-muted">{post.author_name || "—"}</td>
                  <td className="py-3 pl-4 pr-6 text-right font-code text-[0.7rem] text-ink-soft">
                    {fmtDate(post.published_at)}
                  </td>
                </tr>
              ))}
              {postsQuery.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-ink-soft">
                    No posts {statusFilter !== "all" ? `with status “${statusFilter}”` : "yet"}.
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
