"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { renderMarkdown } from "@/lib/markdown";
import { getApiErrorMessage } from "@/service/api";
import {
  type BlogPost,
  type BlogPostInput,
  CreatePostApi,
  DeletePostApi,
  GetPostApi,
  ListAuthorsApi,
  POST_CATEGORIES,
  PublishPostApi,
  UnpublishPostApi,
  UpdatePostApi,
} from "@/service/content";

const labelCls =
  "block font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft";
const inputCls =
  "mt-1.5 w-full rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

type FormState = BlogPostInput;

const EMPTY: FormState = {
  title: "",
  slug: "",
  body_mdx: "",
  author_fk: null,
  cover_image_url: "",
  excerpt: "",
  category: "",
  tags: [],
  featured: false,
  seo_title: "",
  seo_description: "",
};

function fromPost(p: BlogPost): FormState {
  return {
    title: p.title,
    slug: p.slug,
    body_mdx: p.body_mdx,
    author_fk: p.author_fk,
    cover_image_url: p.cover_image_url ?? "",
    excerpt: p.excerpt ?? "",
    category: p.category ?? "",
    tags: p.tags ?? [],
    featured: p.featured ?? false,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
  };
}

export function PostEditor({ slug }: { slug?: string }) {
  const router = useRouter();
  const isEdit = Boolean(slug);

  const postQuery = useQuery({
    queryKey: ["admin-post", slug],
    queryFn: () => GetPostApi(slug as string),
    enabled: isEdit,
  });
  const authorsQuery = useQuery({
    queryKey: ["admin-authors"],
    queryFn: ListAuthorsApi,
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState<FormState | null>(isEdit ? null : EMPTY);
  const [tagsText, setTagsText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Hydrate the form once the post loads (edit mode).
  const loaded = postQuery.data;
  if (isEdit && loaded && form === null) {
    setForm(fromPost(loaded));
    setTagsText((loaded.tags ?? []).join(", "));
  }

  const status = loaded?.status ?? "draft";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const previewHtml = useMemo(
    () => renderMarkdown(form?.body_mdx ?? ""),
    [form?.body_mdx],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("not ready");
      const payload: BlogPostInput = {
        ...form,
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        author_fk: form.author_fk || null,
        slug: form.slug?.trim() || undefined,
      };
      if (isEdit) return UpdatePostApi(slug as string, payload);
      return CreatePostApi(payload);
    },
    onMutate: () => {
      setError("");
      setNotice("");
    },
    onSuccess: (post) => {
      setNotice("Saved.");
      if (!isEdit) router.replace(`/content/posts/${post.slug}/edit`);
    },
    onError: (e) => setError(getApiErrorMessage(e, "Save failed.")),
  });

  const publishMut = useMutation({
    mutationFn: () =>
      status === "published"
        ? UnpublishPostApi(slug as string)
        : PublishPostApi(slug as string),
    onMutate: () => setError(""),
    onSuccess: (post) => {
      setNotice(post.status === "published" ? "Published — live site revalidating." : "Reverted to draft.");
      postQuery.refetch();
    },
    onError: (e) => setError(getApiErrorMessage(e, "Action failed.")),
  });

  const deleteMut = useMutation({
    mutationFn: () => DeletePostApi(slug as string),
    onSuccess: () => router.push("/content/posts"),
    onError: (e) => setError(getApiErrorMessage(e, "Delete failed.")),
  });

  if (isEdit && postQuery.isPending) {
    return <p className="text-sm text-ink-soft">Loading post…</p>;
  }
  if (isEdit && postQuery.isError) {
    return <p className="text-sm text-coral">Couldn&apos;t load this post.</p>;
  }
  if (!form) return null;

  const canSave = form.title.trim().length > 0 && !saveMut.isPending;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/content/posts")}
            className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft hover:text-coral"
          >
            ← Posts
          </button>
          <h1 className="text-[1.6rem] font-semibold tracking-tight text-ink">
            {isEdit ? "Edit post" : "New post"}
          </h1>
          {isEdit && (
            <span
              className={`rounded-full px-2.5 py-0.5 font-code text-[0.58rem] font-bold uppercase tracking-[0.16em] ${
                status === "published"
                  ? "bg-success/10 text-success"
                  : "bg-warning/15 text-warning"
              }`}
            >
              {status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={() => publishMut.mutate()}
              disabled={publishMut.isPending}
              className="rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed"
            >
              {publishMut.isPending
                ? "Working…"
                : status === "published"
                  ? "Unpublish"
                  : "Publish"}
            </button>
          )}
          <button
            type="button"
            onClick={() => saveMut.mutate()}
            disabled={!canSave}
            className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
          >
            {saveMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}
      {notice && (
        <p className="mt-4 rounded-xl border border-success/20 bg-success/10 px-4 py-2.5 text-sm text-success">
          {notice}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: meta fields */}
        <div className="space-y-4 lg:col-span-1">
          <div>
            <label className={labelCls} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="slug">
              Slug {isEdit && <span className="text-ink-soft/70">(locked)</span>}
            </label>
            <input
              id="slug"
              value={form.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              disabled={isEdit}
              placeholder="auto-generated from title"
              className={`${inputCls} disabled:bg-surface-soft disabled:text-ink-muted`}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="author">
              Author
            </label>
            <select
              id="author"
              value={form.author_fk ?? ""}
              onChange={(e) => set("author_fk", e.target.value || null)}
              className={inputCls}
            >
              <option value="">— None —</option>
              {(authorsQuery.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              <option value="">— None —</option>
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="tags">
              Tags <span className="text-ink-soft/70">(comma-separated)</span>
            </label>
            <input
              id="tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="cold-email, frameworks"
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 rounded border-surface-softer text-coral focus:ring-coral/30"
            />
            <span className="text-sm text-ink">Featured (blog index hero)</span>
          </label>

          <div>
            <label className={labelCls} htmlFor="cover">
              Cover image URL
            </label>
            <input
              id="cover"
              value={form.cover_image_url}
              onChange={(e) => set("cover_image_url", e.target.value)}
              placeholder="/cover.jpeg or https://…"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="excerpt">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>

          <div className="rounded-xl border border-surface-softer p-3">
            <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              SEO
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className={labelCls} htmlFor="seo-title">
                  Meta title
                </label>
                <input
                  id="seo-title"
                  value={form.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  maxLength={70}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="seo-desc">
                  Meta description
                </label>
                <textarea
                  id="seo-desc"
                  value={form.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  rows={2}
                  maxLength={160}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this post? This soft-deletes it.")) deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
              className="text-xs font-medium text-coral hover:text-coral-700 disabled:cursor-not-allowed"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete post"}
            </button>
          )}
        </div>

        {/* Right: split-pane MDX editor + live preview */}
        <div className="lg:col-span-2">
          <label className={labelCls}>Body (MDX)</label>
          <div className="mt-1.5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <textarea
              value={form.body_mdx}
              onChange={(e) => set("body_mdx", e.target.value)}
              spellCheck={false}
              placeholder="# Write your post in Markdown / MDX…"
              className="h-[32rem] w-full resize-none rounded-lg border border-surface-softer bg-white px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
            />
            <div
              className="md-preview h-[32rem] overflow-y-auto rounded-lg border border-surface-softer bg-surface-soft/30 px-4 py-3 text-sm leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          <p className="mt-2 text-[0.7rem] text-ink-soft">
            Preview is a lightweight approximation. The live site compiles the
            full MDX on publish.
          </p>
        </div>
      </div>
    </div>
  );
}
