"use client";

/**
 * Named prompt sets (Ben, 5 Sep): "we make them and name them. Org admin can
 * select the named prompt set not edit the prompts or see them."
 *
 * This is the authoring side. Master sets (no organization) are assignable to
 * any org's users; cloning one for a specific org is how a customer gets a
 * tweaked copy that affects nobody else. An org's detail screen links here
 * filtered to its own sets.
 *
 * A key left unset in a set simply falls through to the org/global/default
 * chain at generate time — a set only has to carry the prompts it wants to
 * change.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCopy, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import { GetAdminOrgsApi } from "@/service/orgs";
import {
  ClonePromptSetApi,
  CreatePromptSetApi,
  DeletePromptSetApi,
  GetPromptSetDetailApi,
  GetPromptSetsApi,
  SavePromptSetPromptApi,
  type PromptSetSummary,
} from "@/service/prompts";

const KEY_LABELS: Record<string, string> = {
  email: "Email sequence",
  linkedin: "LinkedIn sequence",
  video: "Voice note & video",
  call: "Call script",
  last_chance: "Last-chance message",
};

export default function PromptSetsPage() {
  return (
    <Suspense>
      <PromptSetsPageInner />
    </Suspense>
  );
}

function PromptSetsPageInner() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const orgFilter = searchParams.get("organization") ?? "";

  const setsQuery = useQuery({
    queryKey: ["admin-prompt-sets", orgFilter],
    queryFn: () => GetPromptSetsApi(orgFilter || undefined),
  });
  const sets = setsQuery.data ?? [];

  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const activeSet = sets.find((s) => s.id === activeSetId) ?? null;
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!activeSetId && sets.length) setActiveSetId(sets[0].id);
    if (activeSetId && sets.length && !sets.some((s) => s.id === activeSetId)) {
      setActiveSetId(sets[0]?.id ?? null);
    }
  }, [activeSetId, sets]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Prompt sets</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Named prompt bundles — e.g. Sales, Partnership. Org admins assign a set to each of
              their users by name; they never see or edit the prompts. Master sets work for every
              org; clone one for a single org to tweak it without affecting anyone else.
              {orgFilter ? " Showing one organisation's sets." : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            <FiPlus size={14} /> New set
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3">
          {setsQuery.isLoading ? (
            <p className="px-2 py-3 text-sm text-slate-400">Loading…</p>
          ) : sets.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-400">
              No sets yet. Create one to get started.
            </p>
          ) : (
            sets.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSetId(s.id)}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
                  activeSetId === s.id ? "bg-navy-900 text-white" : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <span className="block font-medium">{s.name}</span>
                <span
                  className={`block text-[0.68rem] ${
                    activeSetId === s.id ? "text-white/70" : "text-slate-400"
                  }`}
                >
                  {s.organization_name ?? "Master — all orgs"} · {s.assigned_users} user
                  {s.assigned_users === 1 ? "" : "s"}
                </span>
              </button>
            ))
          )}
        </nav>

        {activeSet ? (
          <SetEditor
            key={activeSet.id}
            set={activeSet}
            onChanged={() => qc.invalidateQueries({ queryKey: ["admin-prompt-sets"] })}
            onDeleted={() => {
              setActiveSetId(null);
              qc.invalidateQueries({ queryKey: ["admin-prompt-sets"] });
            }}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            {sets.length ? "Pick a set" : ""}
          </div>
        )}
      </div>

      {creating ? (
        <CreateSetModal
          defaultOrgId={orgFilter || null}
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setActiveSetId(created.id);
            qc.invalidateQueries({ queryKey: ["admin-prompt-sets"] });
          }}
        />
      ) : null}
    </div>
  );
}

function SetEditor({
  set,
  onChanged,
  onDeleted,
}: {
  set: PromptSetSummary;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["admin-prompt-set", set.id],
    queryFn: () => GetPromptSetDetailApi(set.id),
  });
  const prompts = detailQuery.data?.prompts ?? [];

  const [activeKey, setActiveKey] = useState<string>("email");
  const active = prompts.find((p) => p.key === activeKey) ?? null;

  const [systemText, setSystemText] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [cloning, setCloning] = useState(false);

  const lastFocused = useRef<"system" | "template">("template");
  const systemRef = useRef<HTMLTextAreaElement>(null);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (active) {
      setSystemText(active.system_prompt);
      setTemplateText(active.template);
      setError("");
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key, detailQuery.dataUpdatedAt]);

  const dirty = !!active && (systemText !== active.system_prompt || templateText !== active.template);

  const save = useMutation({
    mutationFn: () =>
      SavePromptSetPromptApi(set.id, activeKey, { system_prompt: systemText, template: templateText }),
    onSuccess: () => {
      setError("");
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-prompt-set", set.id] });
      onChanged();
    },
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't save.")),
  });

  const remove = useMutation({
    mutationFn: () => DeletePromptSetApi(set.id),
    onSuccess: onDeleted,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't delete the set.")),
  });

  function insertTag(tag: string) {
    const field = lastFocused.current;
    const ref = field === "system" ? systemRef.current : templateRef.current;
    const text = field === "system" ? systemText : templateText;
    const setText = field === "system" ? setSystemText : setTemplateText;
    const token = `{${tag}}`;
    if (!ref) {
      setText(text + token);
      return;
    }
    const start = ref.selectionStart ?? text.length;
    const end = ref.selectionEnd ?? text.length;
    setText(text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => {
      ref.focus();
      const pos = start + token.length;
      ref.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <span className="text-sm font-semibold text-slate-800">{set.name}</span>
          <span className="ml-2 text-xs text-slate-400">
            {set.organization_name ? `Bespoke to ${set.organization_name}` : "Master set — assignable to any org"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
          <button
            type="button"
            onClick={() => setCloning(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            title="Copy this set for one organisation so it can be tweaked without affecting anyone else"
          >
            <FiCopy size={14} /> Clone for an org
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${set.name}"? ${set.assigned_users} assigned user(s) will fall back to the default prompts.`,
                )
              ) {
                remove.mutate();
              }
            }}
            disabled={remove.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <FiTrash2 size={14} /> Delete
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-40"
          >
            <FiSave size={14} /> {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Key tabs */}
      <div className="flex gap-1.5 border-b border-slate-200 bg-white px-6 pt-3">
        {prompts.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActiveKey(p.key)}
            className={`rounded-t-lg px-3 py-2 text-sm ${
              activeKey === p.key
                ? "border border-b-0 border-slate-200 bg-slate-50 font-medium text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {KEY_LABELS[p.key] ?? p.key}
            {!p.is_set ? <span className="ml-1.5 text-[0.6rem] text-slate-400">unset</span> : null}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {active ? (
        <>
          {!active.is_set ? (
            <p className="mx-6 mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              This prompt is unset in the set — users assigned to it fall through to the normal
              default for this channel. Save something below to override it.
            </p>
          ) : null}

          <div className="px-6 pt-4">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Variables — click to insert
            </p>
            <div className="flex flex-wrap gap-1.5">
              {active.allowed_variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertTag(v)}
                  className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 hover:bg-navy-900 hover:text-white"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 px-6 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">System prompt</label>
              <textarea
                ref={systemRef}
                value={systemText}
                onChange={(e) => setSystemText(e.target.value)}
                onFocus={() => (lastFocused.current = "system")}
                spellCheck={false}
                className="h-64 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-[0.8rem] leading-relaxed text-slate-800 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Context template</label>
              <textarea
                ref={templateRef}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                onFocus={() => (lastFocused.current = "template")}
                spellCheck={false}
                className="h-80 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-[0.8rem] leading-relaxed text-slate-800 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Use the variable tags above. Literal curly braces (for JSON examples) must be
                doubled: {"{{"} and {"}}"}.
              </p>
            </div>
          </div>
        </>
      ) : null}

      {cloning ? (
        <CloneModal
          set={set}
          onClose={() => setCloning(false)}
          onCloned={() => {
            setCloning(false);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

function CreateSetModal({
  defaultOrgId,
  onClose,
  onCreated,
}: {
  defaultOrgId: string | null;
  onClose: () => void;
  onCreated: (created: PromptSetSummary) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [orgId, setOrgId] = useState(defaultOrgId ?? "");
  const [error, setError] = useState("");
  const orgsQuery = useQuery({ queryKey: ["admin-orgs-for-sets"], queryFn: GetAdminOrgsApi });

  const create = useMutation({
    mutationFn: () =>
      CreatePromptSetApi({ name: name.trim(), notes: notes.trim(), organization: orgId || null }),
    onSuccess: onCreated,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't create the set.")),
  });

  return (
    <ModalFrame title="New prompt set" onClose={onClose}>
      <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Partnership"
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
      />
      <label className="mb-1 block text-sm font-medium text-slate-700">Notes (internal)</label>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What this set is for"
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
      />
      <label className="mb-1 block text-sm font-medium text-slate-700">Scope</label>
      <select
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
      >
        <option value="">Master — assignable to every org</option>
        {(orgsQuery.data ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            Bespoke to {o.organization_name}
          </option>
        ))}
      </select>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || !name.trim()}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-40"
        >
          {create.isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </ModalFrame>
  );
}

function CloneModal({
  set,
  onClose,
  onCloned,
}: {
  set: PromptSetSummary;
  onClose: () => void;
  onCloned: () => void;
}) {
  const [orgId, setOrgId] = useState("");
  const [name, setName] = useState(set.name);
  const [error, setError] = useState("");
  const orgsQuery = useQuery({ queryKey: ["admin-orgs-for-sets"], queryFn: GetAdminOrgsApi });

  const clone = useMutation({
    mutationFn: () => ClonePromptSetApi(set.id, { organization: orgId, name: name.trim() || undefined }),
    onSuccess: onCloned,
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't clone the set.")),
  });

  return (
    <ModalFrame title={`Clone "${set.name}" for one org`} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">
        The org gets its own copy. Edits to the copy never touch the original or any other org.
      </p>
      <label className="mb-1 block text-sm font-medium text-slate-700">Organisation</label>
      <select
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
      >
        <option value="">Pick an organisation…</option>
        {(orgsQuery.data ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            {o.organization_name}
          </option>
        ))}
      </select>
      <label className="mb-1 block text-sm font-medium text-slate-700">Name for the copy</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none"
      />
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => clone.mutate()}
          disabled={clone.isPending || !orgId}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-40"
        >
          {clone.isPending ? "Cloning…" : "Clone"}
        </button>
      </div>
    </ModalFrame>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
