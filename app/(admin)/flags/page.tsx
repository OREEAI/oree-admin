"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/service/api";
import {
  GetPlatformFlagsApi,
  SetPlatformFlagApi,
  type PlatformFlagRow,
} from "@/service/resources";

function fmt(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function FlagsPage() {
  const query = useQuery({
    queryKey: ["admin-platform-flags"],
    queryFn: GetPlatformFlagsApi,
  });

  const flags = query.data ?? [];

  return (
    <div>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink">
        Platform flags
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Platform-wide switches. These take effect immediately for every organisation — no
        deploy or restart.
      </p>

      <div className="mt-8 max-w-3xl space-y-4">
        {query.isPending ? (
          <div className="h-28 animate-pulse rounded-2xl bg-ink/5" />
        ) : null}
        {query.isError ? (
          <div className="rounded-2xl border border-coral/20 bg-coral-50/60 px-5 py-4 text-sm text-coral">
            {getApiErrorMessage(query.error, "Couldn't load platform flags.")}
          </div>
        ) : null}
        {flags.map((flag) => (
          <FlagCard key={flag.key} flag={flag} />
        ))}
      </div>
    </div>
  );
}

function FlagCard({ flag }: { flag: PlatformFlagRow }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const toggle = useMutation({
    mutationFn: () => SetPlatformFlagApi(flag.key, !flag.enabled),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-platform-flags"] });
    },
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't update this flag.")),
  });

  const updated = fmt(flag.updated_at);

  return (
    <div className="rounded-2xl border border-surface-softer bg-white p-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-ink">{flag.label}</h2>
            <span
              className={
                flag.enabled
                  ? "rounded-full bg-success/10 px-2.5 py-0.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-success"
                  : "rounded-full bg-ink/5 px-2.5 py-0.5 font-code text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-soft"
              }
            >
              {flag.enabled ? "On" : "Off"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{flag.description}</p>
          <p className="mt-2 font-code text-[0.62rem] uppercase tracking-[0.14em] text-ink-soft">
            {flag.source === "env"
              ? "Currently controlled by the server env var — flipping it here takes over."
              : updated
                ? `Last changed ${updated}${flag.updated_by ? ` by ${flag.updated_by}` : ""}`
                : "Controlled from this console."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          aria-pressed={flag.enabled}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            flag.enabled ? "bg-success" : "bg-ink/15"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              flag.enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-coral/20 bg-coral-50/60 px-4 py-2.5 text-sm text-coral">
          {error}
        </div>
      ) : null}
    </div>
  );
}
