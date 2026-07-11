"use client";

import type { AuthUser } from "@/interface/auth";
import { LogoutMutation } from "@/hooks/useUser";
import { ActAsOrg } from "@/components/shell/act-as-org";

function roleLabel(role?: string) {
  if (role === "content_admin") return "Content admin";
  if (role === "super_admin") return "Super admin";
  return role ?? "";
}

export function Topbar({ user }: { user: AuthUser | null }) {
  const { mutate: logout, isPending } = LogoutMutation();

  const displayName = user?.full_name || user?.email || "";
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-softer bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 font-code text-xs font-bold text-white">
          {initial}
        </span>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-medium text-ink">{displayName}</div>
          <div className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
            {roleLabel(user?.role)}
          </div>
        </div>
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
