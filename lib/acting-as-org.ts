import Cookies from "js-cookie";
import { ACTING_AS_ORG_COOKIE } from "@/utils/constants";

// Share the impersonation target across every *.oreeai.com app. In local
// dev (localhost) a leading-dot domain is invalid, so we fall back to a
// host-only cookie there.
function actingAsOrgCookieOptions() {
  const onOreeDomain =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("oreeai.com");
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isHttps,
    ...(onOreeDomain ? { domain: ".oreeai.com" } : {}),
  };
}

export function getActingAsOrg(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(ACTING_AS_ORG_COOKIE) ?? null;
}

export function setActingAsOrg(orgId: string) {
  if (typeof window === "undefined") return;
  Cookies.set(ACTING_AS_ORG_COOKIE, orgId, {
    ...actingAsOrgCookieOptions(),
    expires: 1,
  });
}

export function clearActingAsOrg() {
  if (typeof window === "undefined") return;
  // Remove with both the scoped-domain and host-only variants so we don't
  // leave a stale cookie behind regardless of which one was written.
  Cookies.remove(ACTING_AS_ORG_COOKIE, actingAsOrgCookieOptions());
  Cookies.remove(ACTING_AS_ORG_COOKIE, { path: "/" });
}
