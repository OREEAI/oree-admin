"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronDown } from "react-icons/fi";
import { GetAdminOrgsApi } from "@/service/orgs";
import {
  clearActingAsOrg,
  getActingAsOrg,
  setActingAsOrg,
} from "@/lib/acting-as-org";
import { rqKeys } from "@/utils/constants";
import { cn } from "@/lib/utils";

/**
 * "Act as org" switcher.
 *
 * Selecting an org writes the `acting_as_org_id` cookie (scoped to
 * .oreeai.com) and reloads so every request picks up the impersonation
 * target. "Stop impersonating" clears the cookie and reloads.
 */
export function ActAsOrg() {
  const [open, setOpen] = useState(false);
  const [actingOrgId, setActingOrgId] = useState<string | null>(null);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: [rqKeys.orgs],
    queryFn: GetAdminOrgsApi,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    setActingOrgId(getActingAsOrg());
  }, []);

  const activeOrg = orgs.find((org) => org.id === actingOrgId);

  const handleSelect = (orgId: string) => {
    setActingAsOrg(orgId);
    // Reload so the new acting-as-org cookie is applied platform-wide.
    window.location.reload();
  };

  const handleStop = () => {
    clearActingAsOrg();
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-surface-softer bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink-soft",
          activeOrg ? "text-coral-700" : "text-ink-muted",
        )}
      >
        <span className="font-code text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft">
          Act as
        </span>
        <span className="max-w-[12rem] truncate">
          {activeOrg
            ? activeOrg.organization_name
            : actingOrgId
              ? actingOrgId
              : "Select org"}
        </span>
        <FiChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-1 cursor-default"
          />
          <div className="absolute right-0 z-2 mt-2 w-72 overflow-hidden rounded-xl border border-surface-softer bg-white shadow-soft-lift">
            <div className="border-b border-surface-softer px-4 py-2.5">
              <p className="font-code text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
                Impersonate an organisation
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {isLoading && (
                <p className="px-4 py-3 text-xs text-ink-soft">Loading orgs…</p>
              )}

              {!isLoading && orgs.length === 0 && (
                <p className="px-4 py-3 text-xs text-ink-soft">
                  No organisations available.
                </p>
              )}

              {orgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelect(org.id)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-soft",
                    org.id === actingOrgId
                      ? "text-coral-700"
                      : "text-ink",
                  )}
                >
                  <span className="truncate">{org.organization_name}</span>
                  {org.id === actingOrgId && (
                    <span className="font-code text-[0.6rem] uppercase tracking-[0.16em] text-coral">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>

            {actingOrgId && (
              <div className="border-t border-surface-softer p-2">
                <button
                  type="button"
                  onClick={handleStop}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-coral-700 transition-colors hover:bg-surface-soft"
                >
                  Stop impersonating
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
