"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiUpload } from "react-icons/fi";

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
  resolveCoverUrl,
  UploadCoverApi,
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
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [tagsText, setTagsText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const coverFileRef = useRef<HTMLInputElement>(null);

  const coverUploadMut = useMutation({
    mutationFn: (file: File) => UploadCoverApi(file),
    onMutate: () => setError(""),
    onSuccess: (url) => {
      set("cover_image_url", url);
      setNotice("Cover uploaded.");
    },
    onError: (e) => setError(getApiErrorMessage(e, "Cover upload failed.")),
  });

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

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main: title + MDX editor. The content is the page. */}
        <div className="min-w-0">
          <input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Post title"
            className="w-full border-0 border-b-2 border-surface-softer bg-transparent pb-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-ink placeholder:text-ink-soft/50 focus:border-coral focus:outline-none focus:ring-0"
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
              Slug
            </span>
            <input
              id="slug"
              value={form.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              disabled={isEdit}
              placeholder="auto-generated from title"
              className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-code text-xs text-ink-muted focus:border-surface-softer focus:bg-white focus:outline-none disabled:text-ink-soft"
            />
            {isEdit ? (
              <span className="rounded bg-ink/5 px-1.5 py-0.5 font-code text-[0.5rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
                locked
              </span>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg border border-surface-softer bg-surface-soft/40 p-1.5">
            <MdxToolbar
              taRef={bodyRef}
              value={form.body_mdx}
              onChange={(v) => set("body_mdx", v)}
            />
          </div>
          <div className="mt-1.5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Write (MDX)
              </p>
              <textarea
                ref={bodyRef}
                value={form.body_mdx}
                onChange={(e) => set("body_mdx", e.target.value)}
                spellCheck={false}
                placeholder="# Write your post in Markdown / MDX…"
                className="h-[36rem] w-full resize-none rounded-lg border border-surface-softer bg-white px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
              />
            </div>
            <div>
              <p className="mb-1.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Preview
              </p>
              <div
                className="md-preview h-[36rem] overflow-y-auto rounded-lg border border-surface-softer bg-white px-5 py-4 text-sm leading-relaxed text-ink"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
          <p className="mt-2 text-[0.7rem] text-ink-soft">
            Use the toolbar to format — or drop in a Stat / Callout / Pull block.
            The preview is an approximation; the live site compiles the full MDX
            on publish.
          </p>
        </div>

        {/* Side rail: publishing settings, grouped. */}
        <div className="space-y-4">
          <SidePanel title="Publishing">
            <div className="space-y-3">
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
              <label className="flex items-center justify-between gap-2 rounded-lg border border-surface-softer px-3 py-2.5">
                <span className="text-sm text-ink">Featured (blog index hero)</span>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-surface-softer text-coral focus:ring-coral/30"
                />
              </label>
            </div>
          </SidePanel>

          <SidePanel title="Cover">
            {resolveCoverUrl(form.cover_image_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveCoverUrl(form.cover_image_url)}
                alt=""
                className="mb-3 aspect-[16/9] w-full rounded-lg border border-surface-softer object-cover"
              />
            ) : (
              <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-navy-900">
                <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/40">
                  No cover set
                </span>
              </div>
            )}
            <input
              ref={coverFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) coverUploadMut.mutate(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              disabled={coverUploadMut.isPending}
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-4 py-2.5 font-code text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-700 disabled:cursor-wait disabled:opacity-60"
            >
              {coverUploadMut.isPending ? (
                "Uploading…"
              ) : (
                <>
                  <FiUpload className="h-3.5 w-3.5" />
                  Upload image from computer
                </>
              )}
            </button>
            <label className={labelCls} htmlFor="cover">
              Or paste an image URL
            </label>
            <input
              id="cover"
              value={form.cover_image_url}
              onChange={(e) => set("cover_image_url", e.target.value)}
              placeholder="/cover.jpeg or https://…"
              className={inputCls}
            />
          </SidePanel>

          <SidePanel title="Listing">
            <div className="space-y-3">
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
            </div>
          </SidePanel>

          <SidePanel title="SEO">
            <div className="space-y-3">
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
          </SidePanel>

          {isEdit && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this post? This soft-deletes it.")) deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
              className="w-full rounded-full border border-coral/40 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-coral transition-colors hover:bg-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete post"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-5 shadow-soft-lift">
      <p className="mb-3 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {title}
      </p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatting toolbar for the MDX body. Operates on the textarea's current
// selection and inserts Markdown / MDX so the author never hand-types syntax —
// while keeping the raw MDX (custom <Stat>/<Callout>/<Pull> components) intact,
// which a plain rich-text/HTML editor would destroy (Cyrus Jul 1).
// ---------------------------------------------------------------------------

type EditFn = (v: string, s: number, e: number) => { value: string; selStart: number; selEnd: number };

const STAT_SNIPPET = '\n<Stat value="25 min" label="Label here" />\n';
const CALLOUT_SNIPPET = '\n<Callout type="tip" title="Title">\n  Body text.\n</Callout>\n';
const PULL_SNIPPET = '\n<Pull cite="Name, Role">\n  Quote text goes here.\n</Pull>\n';

function MdxToolbar({
  taRef,
  value,
  onChange,
}: {
  taRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
}) {
  const run = (fn: EditFn) => {
    const ta = taRef.current;
    if (!ta) return;
    const { value: nv, selStart, selEnd } = fn(value, ta.selectionStart, ta.selectionEnd);
    onChange(nv);
    // Restore focus + selection after React re-renders with the new value.
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const wrap =
    (before: string, after: string, placeholder: string): EditFn =>
    (v, s, e) => {
      const sel = v.slice(s, e) || placeholder;
      const value = v.slice(0, s) + before + sel + after + v.slice(e);
      return { value, selStart: s + before.length, selEnd: s + before.length + sel.length };
    };

  const linePrefix =
    (prefix: string): EditFn =>
    (v, s, e) => {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const block = v.slice(lineStart, e);
      const prefixed = block
        .split("\n")
        .map((l) => prefix + l)
        .join("\n");
      const value = v.slice(0, lineStart) + prefixed + v.slice(e);
      // No selection → drop the cursor after the prefix so the author just
      // types (avoids inserting a "## ##" placeholder). Else select the block.
      if (s === e) {
        const pos = lineStart + prefixed.length;
        return { value, selStart: pos, selEnd: pos };
      }
      return { value, selStart: lineStart, selEnd: lineStart + prefixed.length };
    };

  const insert =
    (text: string): EditFn =>
    (v, s, e) => {
      const value = v.slice(0, s) + text + v.slice(e);
      return { value, selStart: s + text.length, selEnd: s + text.length };
    };

  const link: EditFn = (v, s, e) => {
    const sel = v.slice(s, e) || "text";
    const snippet = `[${sel}](url)`;
    const value = v.slice(0, s) + snippet + v.slice(e);
    const urlPos = s + sel.length + 3; // inside (url)
    return { value, selStart: urlPos, selEnd: urlPos + 3 };
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Tb label="B" title="Bold" bold onClick={() => run(wrap("**", "**", "bold text"))} />
      <Tb label="I" title="Italic" italic onClick={() => run(wrap("*", "*", "italic text"))} />
      <Divider />
      <Tb label="H2" title="Heading 2" onClick={() => run(linePrefix("## "))} />
      <Tb label="H3" title="Heading 3" onClick={() => run(linePrefix("### "))} />
      <Tb label="• List" title="Bulleted list" onClick={() => run(linePrefix("- "))} />
      <Tb label="1. List" title="Numbered list" onClick={() => run(linePrefix("1. "))} />
      <Tb label="❝ Quote" title="Blockquote" onClick={() => run(linePrefix("> "))} />
      <Tb label="Link" title="Insert link" onClick={() => run(link)} />
      <Tb label="― Divider" title="Horizontal rule" onClick={() => run(insert("\n---\n"))} />
      <Divider />
      <Tb label="+ Stat" title="Insert Stat block" onClick={() => run(insert(STAT_SNIPPET))} />
      <Tb label="+ Callout" title="Insert Callout block" onClick={() => run(insert(CALLOUT_SNIPPET))} />
      <Tb label="+ Pull" title="Insert Pull quote" onClick={() => run(insert(PULL_SNIPPET))} />
    </div>
  );
}

function Tb({
  label,
  title,
  onClick,
  bold,
  italic,
}: {
  label: string;
  title: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-7 items-center justify-center rounded border border-surface-softer bg-white px-2 font-code text-[0.68rem] text-ink-muted transition-colors hover:border-coral hover:text-coral ${
        bold ? "font-extrabold" : italic ? "font-semibold italic" : "font-bold"
      }`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-surface-softer" />;
}
