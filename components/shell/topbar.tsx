"use client";

import type { AuthUser } from "@/interface/auth";
import { LogoutMutation } from "@/hooks/useUser";
import { ActAsOrg } from "@/components/shell/act-as-org";

export function Topbar({ user }: { user: AuthUser | null }) {
  const { mutate: logout, isPending } = LogoutMutation();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-softer bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="rounded-md bg-coral px-2 py-1 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white">
          Admin
        </span>
        {user && (
          <span className="hidden text-xs text-ink-muted sm:inline">
            {user.full_name || user.email}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ActAsOrg />
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="rounded-lg border border-surface-softer bg-white px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-ink-soft hover:text-ink disabled:cursor-not-allowed disabled:text-ink-soft"
        >
          {isPending ? "Signing out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
