"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoredAuth } from "@/hooks/useAuth";
import { useUserQuery } from "@/hooks/useUser";
import { clearAuth } from "@/service/auth";
import { isUnauthorizedError } from "@/service/api";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

const SUPER_ADMIN_ROLE = "super_admin";

/**
 * Admin auth gate.
 *
 * Loads GET /api/users/me. While loading → skeleton. If there is no stored
 * session or the request 401s → /login. If the user's `role` is not
 * "super_admin" → /not-authorised. Otherwise render the shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const storedAuth = useStoredAuth();
  const hasStoredAuth = Boolean(storedAuth?.refresh_token);

  const userQuery = useUserQuery({ enabled: hasStoredAuth });

  // No session at all → straight to login.
  useEffect(() => {
    if (!hasStoredAuth) {
      router.replace("/login");
    }
  }, [hasStoredAuth, router]);

  // Session present but the /me call rejected as unauthorised → clear and
  // bounce to login.
  useEffect(() => {
    if (!hasStoredAuth) return;
    if (!userQuery.isError) return;
    if (!isUnauthorizedError(userQuery.error)) return;

    clearAuth();
    router.replace("/login");
  }, [hasStoredAuth, router, userQuery.error, userQuery.isError]);

  // Authenticated but not a super-admin → not authorised.
  useEffect(() => {
    if (!userQuery.isSuccess) return;
    if (userQuery.data.role !== SUPER_ADMIN_ROLE) {
      router.replace("/not-authorised");
    }
  }, [router, userQuery.data, userQuery.isSuccess]);

  const isReady =
    hasStoredAuth &&
    userQuery.isSuccess &&
    userQuery.data.role === SUPER_ADMIN_ROLE;

  if (!isReady) {
    return <AdminShellSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900 text-navy-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={userQuery.data} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <div className="w-60 shrink-0 border-r border-navy-700 bg-navy-900 p-3">
        <div className="mb-6 h-10 animate-pulse rounded-lg bg-navy-800" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-navy-800" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-navy-700 px-6">
          <div className="h-6 w-24 animate-pulse rounded-md bg-navy-800" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-navy-800" />
        </div>
        <div className="flex-1 space-y-4 p-8">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-navy-800" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-navy-800" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-navy-800"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
