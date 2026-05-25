"use client";

import { LogoutMutation } from "@/hooks/useUser";

export default function NotAuthorisedPage() {
  const { mutate: logout, isPending } = LogoutMutation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-6 text-ink">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2">
          <span className="font-code text-sm font-bold uppercase tracking-[0.22em] text-coral">
            Oree
          </span>
          <span className="rounded-md bg-coral px-2 py-1 font-code text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white">
            Admin
          </span>
        </div>
        <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight text-ink">
          You don&apos;t have access to the admin console.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          This console is restricted to Oree super-admins. If you think you
          should have access, contact the platform team.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-coral px-8 font-code text-xs font-bold uppercase tracking-[0.18em] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_20px_-8px_rgba(242,78,46,0.45)] transition-all duration-200 ease-smooth-out hover:-translate-y-px hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-soft/30 disabled:text-white"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
