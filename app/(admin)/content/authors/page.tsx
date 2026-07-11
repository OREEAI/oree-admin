"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit3, FiTrash2, FiUpload } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import {
  type BlogAuthor,
  type BlogAuthorInput,
  CreateAuthorApi,
  DeleteAuthorApi,
  ListAuthorsApi,
  UpdateAuthorApi,
  UploadCoverApi,
  resolveCoverUrl,
} from "@/service/content";
import { AvatarChip } from "../../_components/ui";
import { ContentTabs } from "../_components/content-tabs";

const EMPTY: BlogAuthorInput = { name: "", bio: "", avatar_url: "", linkedin_url: "" };

export default function AuthorsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogAuthor | "new" | null>(null);

  const authorsQuery = useQuery({
    queryKey: ["admin-authors"],
    queryFn: ListAuthorsApi,
  });
  const authors = authorsQuery.data ?? [];

  const del = useMutation({
    mutationFn: (slug: string) => DeleteAuthorApi(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-authors"] }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            Authors
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            The bylines available on blog posts and resources.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
        >
          New author
        </button>
      </div>

      <div className="mt-6">
        <ContentTabs />
      </div>

      {editing ? (
        <AuthorEditor
          author={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-authors"] });
          }}
        />
      ) : null}

      {authorsQuery.isPending && <p className="mt-6 text-sm text-ink-soft">Loading authors…</p>}
      {authorsQuery.isError && (
        <p className="mt-6 text-sm text-coral">Couldn&apos;t load authors.</p>
      )}

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {authors.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-4 rounded-2xl border border-surface-softer bg-white p-5 shadow-soft-lift"
          >
            {resolveCoverUrl(a.avatar_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveCoverUrl(a.avatar_url)}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <AvatarChip label={a.name} className="h-14 w-14 rounded-2xl text-xl" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{a.name}</p>
              <p className="font-code text-[0.6rem] text-ink-soft">{a.slug}</p>
              {a.bio ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{a.bio}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setEditing(a)}
                className="rounded-full border border-surface-softer p-2 text-ink-muted transition-colors hover:border-coral hover:text-coral"
                aria-label="Edit author"
              >
                <FiEdit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete author "${a.name}"? Their posts keep the byline text but lose the link.`)) {
                    del.mutate(a.slug);
                  }
                }}
                className="rounded-full border border-surface-softer p-2 text-ink-muted transition-colors hover:border-coral hover:bg-coral hover:text-white"
                aria-label="Delete author"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {!authorsQuery.isPending && authors.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-surface-softer bg-white px-6 py-12 text-center text-sm text-ink-soft">
            No authors yet — create the first one so posts can carry a byline.
          </p>
        )}
      </div>
    </div>
  );
}

function AuthorEditor({
  author,
  onClose,
  onSaved,
}: {
  author: BlogAuthor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BlogAuthorInput>(
    author
      ? {
          name: author.name,
          bio: author.bio ?? "",
          avatar_url: author.avatar_url ?? "",
          linkedin_url: author.linkedin_url ?? "",
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => UploadCoverApi(file),
    onSuccess: (url) => setForm((f) => ({ ...f, avatar_url: url })),
    onError: (e) => setError(getApiErrorMessage(e, "Avatar upload failed.")),
  });

  const save = useMutation({
    mutationFn: () => (author ? UpdateAuthorApi(author.slug, form) : CreateAuthorApi(form)),
    onMutate: () => setError(""),
    onSuccess: onSaved,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't save the author.")),
  });

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";
  const labelCls =
    "block font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft";

  return (
    <div className="mb-6 rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {author ? `Edit ${author.name}` : "New author"}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div>
            <label className={labelCls}>Name</label>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Kingsley Nnamonah"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea
              value={form.bio ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="One or two sentences shown on the blog."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>LinkedIn URL (optional)</label>
            <input
              value={form.linkedin_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/…"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Avatar</label>
          {resolveCoverUrl(form.avatar_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveCoverUrl(form.avatar_url)}
              alt=""
              className="mt-2 h-24 w-24 rounded-2xl border border-surface-softer object-cover"
            />
          ) : (
            <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-2xl bg-navy-900 font-code text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white/40">
              No avatar
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-navy-800 px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-700 disabled:cursor-wait disabled:opacity-60"
          >
            <FiUpload className="h-3.5 w-3.5" />
            {upload.isPending ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!String(form.name ?? "").trim() || save.isPending}
          className="rounded-full bg-coral px-5 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
        >
          {save.isPending ? "Saving…" : "Save author"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-surface-softer bg-white px-5 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
