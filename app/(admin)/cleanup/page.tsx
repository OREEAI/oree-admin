"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  ApplyCleanupApi,
  type CleanupAction,
  type CleanupApplyResult,
  type CleanupCandidate,
  type CleanupPreview,
  GetCleanupActionsApi,
  PreviewCleanupApi,
} from "@/service/cleanup";

const MAX_TABLE_ROWS = 50;

function titleize(name: string) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CleanupPage() {
  const actionsQuery = useQuery({
    queryKey: ["cleanup-actions"],
    queryFn: GetCleanupActionsApi,
  });

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">Cleanup runners</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">
        Preview the candidates a runner would affect, then apply. Apply is irreversible and writes an audit-log entry.
      </p>

      {actionsQuery.isPending && <p className="mt-8 text-sm text-ink-soft">Loading runners…</p>}
      {actionsQuery.isError && (
        <p className="mt-8 text-sm text-coral">Couldn&apos;t load cleanup actions. Check you&apos;re a super-admin.</p>
      )}

      <div className="mt-8 space-y-4">
        {actionsQuery.data?.map((action) => (
          <CleanupActionCard key={action.name} action={action} />
        ))}
      </div>
    </div>
  );
}

function CleanupActionCard({ action }: { action: CleanupAction }) {
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [result, setResult] = useState<CleanupApplyResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const previewMut = useMutation({
    mutationFn: () => PreviewCleanupApi(action.name),
    onMutate: () => {
      setError("");
      setResult(null);
    },
    onSuccess: setPreview,
    onError: () => setError("Preview failed. Try again."),
  });

  const applyMut = useMutation({
    mutationFn: () => ApplyCleanupApi(action.name),
    onSuccess: (r) => {
      setResult(r);
      setPreview(null);
      setConfirmOpen(false);
    },
    onError: () => {
      setError("Apply failed. Try again.");
      setConfirmOpen(false);
    },
  });

  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6 shadow-soft-lift">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-code text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral">
            {titleize(action.name)}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{action.description}</p>
        </div>
        <button
          type="button"
          onClick={() => previewMut.mutate()}
          disabled={previewMut.isPending}
          className="shrink-0 rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:text-ink-soft"
        >
          {previewMut.isPending ? "Previewing…" : "Preview"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      {result && (
        <p className="mt-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          Applied to {result.applied_count} {result.applied_count === 1 ? "item" : "items"}.
        </p>
      )}

      {preview && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {preview.count} {preview.count === 1 ? "candidate" : "candidates"}
            </p>
            {preview.count > 0 && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700"
              >
                Apply
              </button>
            )}
          </div>
          {preview.count > 0 && <CandidatesTable candidates={preview.candidates} />}
        </div>
      )}

      {confirmOpen && preview && (
        <ConfirmModal
          title={`Apply “${titleize(action.name)}”?`}
          body={`This will run the action on ${preview.count} ${
            preview.count === 1 ? "item" : "items"
          }. This can't be undone. An audit-log entry will be written.`}
          confirmLabel={applyMut.isPending ? "Applying…" : "Apply"}
          disabled={applyMut.isPending}
          onConfirm={() => applyMut.mutate()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function CandidatesTable({ candidates }: { candidates: CleanupCandidate[] }) {
  const rows = candidates.slice(0, MAX_TABLE_ROWS);
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  const render = (v: unknown) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-surface-softer">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-softer bg-surface-soft/50">
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-left font-code text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-soft"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-surface-softer/60">
              {columns.map((c) => (
                <td key={c} className="max-w-[22rem] truncate px-3 py-2 text-ink-muted" title={render(row[c])}>
                  {render(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {candidates.length > MAX_TABLE_ROWS && (
        <p className="px-3 py-2 text-xs text-ink-soft">
          Showing first {MAX_TABLE_ROWS} of {candidates.length}.
        </p>
      )}
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  disabled,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_25px_60px_-30px_rgba(11,39,64,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-coral hover:text-coral disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-full bg-coral px-4 py-2 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-coral/40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
