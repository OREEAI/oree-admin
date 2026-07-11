"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStoredAuth } from "@/hooks/useAuth";
import { useUserQuery } from "@/hooks/useUser";
import { clearAuth } from "@/service/auth";
import { isUnauthorizedError } from "@/service/api";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

const SUPER_ADMIN_ROLE = "super_admin";
// Console-only content role (blog authors like Kingsley): may sign in,
// but only the Content section — everything else stays super-admin.
const CONTENT_ADMIN_ROLE = "content_admin";
const CONSOLE_ROLES: string[] = [SUPER_ADMIN_ROLE, CONTENT_ADMIN_ROLE];
const CONTENT_HOME = "/content/posts";

/**
 * Admin auth gate.
 *
 * Loads GET /api/users/me. While loading → skeleton. If there is no stored
 * session or the request 401s → /login. If the user's `role` is not
 * "super_admin" → /not-authorised. Otherwise render the shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  // Authenticated but not a console role → not authorised.
  useEffect(() => {
    if (!userQuery.isSuccess) return;
    if (!CONSOLE_ROLES.includes(userQuery.data.role)) {
      router.replace("/not-authorised");
    }
  }, [router, userQuery.data, userQuery.isSuccess]);

  // Content admins live in /content only — any other route bounces there.
  const isContentAdmin = userQuery.isSuccess && userQuery.data.role === CONTENT_ADMIN_ROLE;
  const contentAdminOffLimits = isContentAdmin && !pathname.startsWith("/content");
  useEffect(() => {
    if (contentAdminOffLimits) {
      router.replace(CONTENT_HOME);
    }
  }, [contentAdminOffLimits, router]);

  const isReady =
    hasStoredAuth &&
    userQuery.isSuccess &&
    CONSOLE_ROLES.includes(userQuery.data.role) &&
    !contentAdminOffLimits;

  if (!isReady) {
    return <AdminShellSkeleton />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft text-ink">
      <Sidebar role={userQuery.data.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={userQuery.data} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      <div className="w-60 shrink-0 border-r border-surface-softer bg-white p-3">
        <div className="mb-6 h-10 animate-pulse rounded-lg bg-surface-soft" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-xl bg-surface-soft"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-surface-softer bg-white px-6">
          <div className="h-6 w-24 animate-pulse rounded-md bg-surface-soft" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-soft" />
        </div>
        <div className="flex-1 space-y-4 p-8">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-softer" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-surface-softer" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-surface-softer bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
