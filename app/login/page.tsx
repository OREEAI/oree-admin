"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OreeMark, OreeWordmark } from "@/components/brand/oree-logo";
import { useStoredAuth } from "@/hooks/useAuth";
import { LoginMutation } from "@/hooks/useUser";
import { getApiErrorMessage } from "@/service/api";

/**
 * /login — internal admin sign-in.
 *
 * Hits the same backend endpoint as the customer app
 * (POST /api/auth/login via LoginUserApi) and stores tokens through the
 * shared auth-storage helper. On success it redirects to "/", where the
 * admin auth gate verifies the super-admin role.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: login, isPending } = LoginMutation();
  const storedAuth = useStoredAuth();
  const hasStoredAuth = Boolean(storedAuth?.refresh_token);

  useEffect(() => {
    if (hasStoredAuth) {
      router.replace("/");
    }
  }, [hasStoredAuth, router]);

  const ready = /^\S+@\S+\.\S+$/.test(email) && password.length >= 6;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || isPending) return;
    setError(null);

    try {
      await login({ email, password });
      router.replace("/");
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "That email and password did not match. Try again.",
        ),
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-ink">
      {/* Brand panel — echoes the console's navy sidebar. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex lg:w-[44%]">
        <div className="flex items-center gap-2.5">
          <OreeWordmark className="h-8 w-auto text-white" />
          <span className="rounded bg-coral px-1.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white">
            Admin
          </span>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            The platform, from the inside.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Organisations, sending infrastructure, campaigns and content —
            everything OREE runs on, in one console.
          </p>
        </div>

        <p className="relative z-10 font-code text-[0.55rem] uppercase tracking-[0.2em] text-white/30">
          Internal tooling · Oree Technologies
        </p>

        {/* Oversized O mark as a quiet watermark. */}
        <OreeMark className="absolute -bottom-24 -right-24 h-96 w-96 opacity-[0.07]" />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2.5">
              <OreeWordmark className="h-8 w-auto" />
              <span className="rounded bg-coral px-1.5 py-0.5 font-code text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white">
                Admin
              </span>
            </div>
          </div>

          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Internal team access only.
          </p>

          <form onSubmit={onSubmit} className="mt-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-coral/40 bg-coral-50/70 px-4 py-3 text-sm text-coral-700"
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <div className="mb-2 font-code text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
                  Work email
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@oreeai.com"
                  className="w-full rounded-xl border border-surface-softer bg-white px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-all focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                />
              </label>

              <label className="block">
                <div className="mb-2 font-code text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
                  Password
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-surface-softer bg-white px-4 py-3 pr-16 text-base text-ink placeholder:text-ink-soft/70 transition-all focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isPending}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-medium text-ink-soft transition-colors hover:text-coral disabled:cursor-not-allowed disabled:text-ink-soft/60"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={!ready || isPending}
              className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-full font-code text-xs font-bold uppercase tracking-[0.18em] transition-all duration-200 ease-smooth-out ${
                !ready || isPending
                  ? "cursor-not-allowed bg-ink-soft/30 text-white"
                  : "bg-coral text-white shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_20px_-8px_rgba(242,78,46,0.45)] hover:-translate-y-px hover:bg-coral-600"
              }`}
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
