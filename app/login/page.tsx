"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-6 text-navy-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-code text-xs font-bold uppercase tracking-[0.22em] text-coral">
            Oree · Internal
          </span>
          <h1 className="mt-3 text-[2rem] font-semibold leading-[1.1] tracking-tight text-white">
            Admin console.
          </h1>
          <p className="mt-3 text-sm text-navy-200">
            Super-admin access only.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-navy-600 bg-navy-800 p-8 shadow-soft-lift"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-coral/40 bg-coral-900/40 px-4 py-3 text-sm text-coral-200"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <div className="mb-2 font-code text-[0.7rem] font-bold uppercase tracking-[0.18em] text-navy-200">
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
                className="w-full rounded-xl border border-navy-600 bg-navy-900 px-4 py-3 text-base text-white placeholder:text-navy-300 transition-all focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
              />
            </label>

            <label className="block">
              <div className="mb-2 font-code text-[0.7rem] font-bold uppercase tracking-[0.18em] text-navy-200">
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
                  className="w-full rounded-xl border border-navy-600 bg-navy-900 px-4 py-3 pr-16 text-base text-white placeholder:text-navy-300 transition-all focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-medium text-navy-200 transition-colors hover:text-coral disabled:cursor-not-allowed disabled:text-navy-300"
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
                ? "cursor-not-allowed bg-navy-600 text-navy-300"
                : "bg-coral text-white hover:-translate-y-px hover:bg-coral-600"
            }`}
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
