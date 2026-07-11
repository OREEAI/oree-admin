"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiDownload, FiEdit3, FiTrash2, FiUpload } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import {
  CreateResourceApi,
  DeleteResourceApi,
  ListAuthorsApi,
  ListResourcesApi,
  type MarketingResource,
  type MarketingResourceInput,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  UpdateResourceApi,
  UploadCoverApi,
  resolveCoverUrl,
} from "@/service/content";
import { StatePill } from "../../_components/ui";
import { ContentTabs } from "../_components/content-tabs";

const EMPTY: MarketingResourceInput = {
  title: "",
  slug: "",
  description: "",
  resource_type: "Guide",
  author_fk: null,
  file_url: "",
  cover_image_url: "",
  gated: false,
  estimated_time: "",
  status: "draft",
};

export default function ResourcesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MarketingResource | "new" | null>(null);

  const query = useQuery({ queryKey: ["admin-resources"], queryFn: ListResourcesApi });
  const rows = query.data ?? [];

  const del = useMutation({
    mutationFn: (slug: string) => DeleteResourceApi(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-resources"] }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
            Resources
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Lead magnets on the marketing site — guides, worksheets and playbooks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
        >
          New resource
        </button>
      </div>

      <div className="mt-6">
        <ContentTabs />
      </div>

      {editing ? (
        <ResourceEditor
          resource={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-resources"] });
          }}
        />
      ) : null}

      {query.isPending && <p className="mt-6 text-sm text-ink-soft">Loading resources…</p>}
      {query.isError && <p className="mt-6 text-sm text-coral">Couldn&apos;t load resources.</p>}

      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="overflow-hidden rounded-2xl border border-surface-softer bg-white shadow-soft-lift"
          >
            <div className="relative aspect-[16/7] bg-navy-900">
              {resolveCoverUrl(r.cover_image_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveCoverUrl(r.cover_image_url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-end p-3">
                  <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/40">
                    {r.resource_type}
                  </span>
                </div>
              )}
              <span className="absolute right-2.5 top-2.5">
                <StatePill value={r.status} />
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-code text-[0.55rem] font-bold uppercase tracking-[0.18em] text-coral">
                  {r.resource_type}
                  {r.gated ? " · gated" : ""}
                </span>
                {typeof r.download_count === "number" ? (
                  <span className="inline-flex items-center gap-1 font-code text-[0.6rem] tabular-nums text-ink-soft">
                    <FiDownload className="h-3 w-3" />
                    {r.download_count}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-ink">{r.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                {r.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="truncate text-xs text-ink-soft">{r.author_name || "—"}</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="rounded-full border border-surface-softer p-2 text-ink-muted transition-colors hover:border-coral hover:text-coral"
                    aria-label="Edit resource"
                  >
                    <FiEdit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${r.title}"?`)) del.mutate(r.slug);
                    }}
                    className="rounded-full border border-surface-softer p-2 text-ink-muted transition-colors hover:border-coral hover:bg-coral hover:text-white"
                    aria-label="Delete resource"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!query.isPending && rows.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-surface-softer bg-white px-6 py-12 text-center text-sm text-ink-soft">
            No resources yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ResourceEditor({
  resource,
  onClose,
  onSaved,
}: {
  resource: MarketingResource | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MarketingResourceInput>(
    resource
      ? {
          title: resource.title,
          slug: resource.slug,
          description: resource.description,
          resource_type: resource.resource_type,
          author_fk: resource.author_fk,
          file_url: resource.file_url,
          cover_image_url: resource.cover_image_url,
          gated: resource.gated,
          estimated_time: resource.estimated_time,
          status: resource.status,
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const authorsQuery = useQuery({ queryKey: ["admin-authors"], queryFn: ListAuthorsApi });

  const upload = useMutation({
    mutationFn: (file: File) => UploadCoverApi(file),
    onSuccess: (url) => setForm((f) => ({ ...f, cover_image_url: url })),
    onError: (e) => setError(getApiErrorMessage(e, "Cover upload failed.")),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      if (resource) delete payload.slug; // slug locked after create
      return resource ? UpdateResourceApi(resource.slug, payload) : CreateResourceApi(payload);
    },
    onMutate: () => setError(""),
    onSuccess: onSaved,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't save the resource.")),
  });

  const set = <K extends keyof MarketingResourceInput>(k: K, v: MarketingResourceInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-surface-softer bg-white px-3 py-2 text-sm text-ink focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";
  const labelCls =
    "block font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft";

  return (
    <div className="mb-6 rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
        {resource ? `Edit ${resource.title}` : "New resource"}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Slug {resource ? <span className="text-ink-soft/70">(locked)</span> : null}
              </label>
              <input
                value={form.slug ?? ""}
                onChange={(e) => set("slug", e.target.value)}
                disabled={Boolean(resource)}
                placeholder="auto from title"
                className={`${inputCls} disabled:bg-surface-soft disabled:text-ink-muted`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={form.resource_type ?? "Guide"}
                onChange={(e) => set("resource_type", e.target.value)}
                className={inputCls}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={form.status ?? "draft"}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
              >
                {RESOURCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Author</label>
              <select
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
              <label className={labelCls}>Est. time</label>
              <input
                value={form.estimated_time ?? ""}
                onChange={(e) => set("estimated_time", e.target.value)}
                placeholder="10 min"
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className={labelCls}>File URL (the download)</label>
              <input
                value={form.file_url ?? ""}
                onChange={(e) => set("file_url", e.target.value)}
                placeholder="/downloads/guide.pdf or https://…"
                className={inputCls}
              />
            </div>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={Boolean(form.gated)}
                onChange={(e) => set("gated", e.target.checked)}
                className="h-4 w-4 rounded border-surface-softer text-coral focus:ring-coral/30"
              />
              <span className="text-sm text-ink">Gated (email capture)</span>
            </label>
          </div>
        </div>

        <div>
          <label className={labelCls}>Cover</label>
          {resolveCoverUrl(form.cover_image_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveCoverUrl(form.cover_image_url)}
              alt=""
              className="mt-2 aspect-[16/9] w-full rounded-lg border border-surface-softer object-cover"
            />
          ) : (
            <div className="mt-2 flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-navy-900">
              <span className="font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/40">
                No cover set
              </span>
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
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy-700 disabled:cursor-wait disabled:opacity-60"
          >
            <FiUpload className="h-3.5 w-3.5" />
            {upload.isPending ? "Uploading…" : "Upload cover"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!String(form.title ?? "").trim() || save.isPending}
          className="rounded-full bg-coral px-5 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
        >
          {save.isPending ? "Saving…" : "Save resource"}
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
