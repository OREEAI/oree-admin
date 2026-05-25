"use client";

import { LogoutMutation } from "@/hooks/useUser";

export default function NotAuthorisedPage() {
  const { mutate: logout, isPending } = LogoutMutation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-6 text-navy-50">
      <div className="w-full max-w-md text-center">
        <span className="font-code text-xs font-bold uppercase tracking-[0.22em] text-coral">
          Oree · Internal
        </span>
        <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight text-white">
          You don&apos;t have access to the admin console.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-navy-200">
          This console is restricted to Oree super-admins. If you think you
          should have access, contact the platform team.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-coral px-8 font-code text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-200 ease-smooth-out hover:-translate-y-px hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-navy-600 disabled:text-navy-300"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
