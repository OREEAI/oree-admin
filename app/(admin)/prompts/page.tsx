"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlay, FiRotateCcw, FiSave, FiX } from "react-icons/fi";

import { getApiErrorMessage } from "@/service/api";
import {
  GetPromptsApi,
  RenderPromptSampleApi,
  ResetPromptApi,
  SavePromptApi,
  type PromptSample,
  type PromptTemplate,
} from "@/service/prompts";

function fmt(iso: string | null) {
  if (!iso) return "code default";
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function PromptsPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-prompts"], queryFn: GetPromptsApi });
  const prompts: PromptTemplate[] = query.data ?? [];

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = prompts.find((p) => p.key === activeKey) ?? prompts[0] ?? null;

  const [systemText, setSystemText] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const lastFocused = useRef<"system" | "template">("template");
  const systemRef = useRef<HTMLTextAreaElement>(null);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  // Default selection.
  useEffect(() => {
    if (!activeKey && prompts.length) setActiveKey(prompts[0].key);
  }, [activeKey, prompts]);

  // Sync edit buffers when the active prompt (or a fresh fetch) changes.
  useEffect(() => {
    if (active) {
      setSystemText(active.system_prompt);
      setTemplateText(active.template);
      setError("");
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key, query.dataUpdatedAt]);

  const dirty =
    !!active && (systemText !== active.system_prompt || templateText !== active.template);

  const save = useMutation({
    mutationFn: () =>
      SavePromptApi(active!.key, { system_prompt: systemText, template: templateText }),
    onSuccess: () => {
      setError("");
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-prompts"] });
    },
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't save.")),
  });

  const reset = useMutation({
    mutationFn: () => ResetPromptApi(active!.key),
    onSuccess: () => {
      setError("");
      qc.invalidateQueries({ queryKey: ["admin-prompts"] });
    },
    onError: (e) => setError(getApiErrorMessage(e, "Couldn't reset.")),
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
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Content prompts</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Edit the email, LinkedIn, video and call prompts. Changes take effect immediately, with
              the built-in defaults as a safety net if a prompt is ever cleared.
            </p>
          </div>
          <SampleRunner />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Prompt list */}
        <nav className="w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-3">
          {query.isLoading ? (
            <p className="px-2 py-3 text-sm text-slate-400">Loading…</p>
          ) : (
            prompts.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setActiveKey(p.key)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  active?.key === p.key
                    ? "bg-navy-900 text-white"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <span>{p.label}</span>
                {p.using_default ? (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium ${
                      active?.key === p.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    default
                  </span>
                ) : null}
              </button>
            ))
          )}
        </nav>

        {/* Editor */}
        {active ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
              <div className="text-sm text-slate-500">
                {active.using_default ? (
                  <span>Serving the built-in default</span>
                ) : (
                  <span>Last edited {fmt(active.updated_at)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
                <button
                  type="button"
                  onClick={() => reset.mutate()}
                  disabled={reset.isPending || active.using_default}
                  title="Reset to the built-in default"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <FiRotateCcw size={14} /> Reset
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

            {error ? (
              <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Variable palette */}
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Context template
                </label>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** "Test on a lead" (Ben Aug 2: "all prompts for one lead") — renders every
 * prompt's REAL output for one researched lead: existing email drafts, the
 * live LinkedIn generator, the on-demand call script, and the voice/video
 * script (no HeyGen spend). Takes up to ~1 min — the Claude calls run live. */
function SampleRunner() {
  const [leadRef, setLeadRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PromptSample | null>(null);

  const run = async () => {
    if (!leadRef.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      setResult(await RenderPromptSampleApi(leadRef.trim()));
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't render samples for that lead."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={leadRef}
          onChange={(e) => setLeadRef(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void run();
          }}
          placeholder="Lead email or id…"
          className="h-9 w-64 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !leadRef.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
        >
          <FiPlay size={13} />
          {busy ? "Rendering… (~1 min)" : "Test on a lead"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Prompt samples — {result.lead_name}
                </h2>
                <p className="text-xs text-slate-500">{result.organization}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(result.markdown)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Copy markdown
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-slate-800">
              {result.markdown}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
