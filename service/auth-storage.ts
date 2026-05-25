import Cookies from "js-cookie";
import type { AuthTokens, AuthUser, StoredAuth } from "@/interface/auth";
import { accesstokenttl, refreshtokenttl, rqKeys } from "@/utils/constants";

const AUTH_EVENT = "oree-admin-auth-changed";
const AUTH_USER_STORAGE_KEY = "oree-admin-auth-user";
let cachedAuthRaw: string | null = null;
let cachedAuth: StoredAuth | null = null;
let authHeaderSync: ((token: string | null) => void) | null = null;

function canUseStorage() {
  return typeof window !== "undefined";
}

function emitAuthChange() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function getCookieSettings(expires: number) {
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  return {
    expires,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
  };
}

function saveUser(user: AuthUser | null) {
  if (!canUseStorage()) return;

  if (!user) {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function loadUser() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function removeUser() {
  if (!canUseStorage()) return;
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function saveAuth(auth: StoredAuth) {
  if (!canUseStorage()) return;
  cachedAuth = auth;
  cachedAuthRaw = JSON.stringify(auth);
  Cookies.set(
    rqKeys.accesstoken,
    auth.access_token,
    getCookieSettings(accesstokenttl),
  );
  Cookies.set(
    rqKeys.refreshtoken,
    auth.refresh_token,
    getCookieSettings(refreshtokenttl),
  );
  saveUser(auth.user);
  authHeaderSync?.(auth.access_token || null);
  emitAuthChange();
}

export function loadAuth(): StoredAuth | null {
  if (!canUseStorage()) return null;
  const accessToken = Cookies.get(rqKeys.accesstoken) ?? "";
  const refreshToken = Cookies.get(rqKeys.refreshtoken) ?? "";
  const user = loadUser();

  // The refresh token is the real session — if it's gone we're logged
  // out for good. The access token can legitimately be absent (e.g. it
  // aged out of its cookie earlier than the refresh) and the axios
  // interceptor should still be able to see the refresh_token so it can
  // mint a fresh access token on the next 401.
  if (!refreshToken) {
    cachedAuthRaw = null;
    cachedAuth = null;
    return null;
  }

  const raw = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    user,
  });

  if (raw === cachedAuthRaw) {
    return cachedAuth;
  }

  try {
    cachedAuthRaw = raw;
    cachedAuth = JSON.parse(raw) as StoredAuth;
    return cachedAuth;
  } catch {
    cachedAuthRaw = null;
    cachedAuth = null;
    return null;
  }
}

export function clearAuth() {
  if (!canUseStorage()) return;
  cachedAuth = null;
  cachedAuthRaw = null;
  Cookies.remove(rqKeys.accesstoken, { path: "/" });
  Cookies.remove(rqKeys.refreshtoken, { path: "/" });
  removeUser();
  authHeaderSync?.(null);
  emitAuthChange();
}

export function isAuthenticated() {
  // Only the refresh token gates "logged in" — the access token is
  // disposable and can be re-minted any time the refresh is still valid.
  const auth = loadAuth();
  return Boolean(auth?.refresh_token);
}

export function hasAccessToken() {
  const auth = loadAuth();
  return Boolean(auth?.access_token);
}

export function subscribeToAuthChanges(onChange: () => void) {
  if (!canUseStorage()) return () => undefined;

  const handler = () => onChange();
  const storageHandler = (event: StorageEvent) => {
    if (event.key === AUTH_USER_STORAGE_KEY) onChange();
  };

  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function getAuthSnapshot() {
  return loadAuth();
}

export function registerAuthHeaderSync(sync: (token: string | null) => void) {
  authHeaderSync = sync;
}

export function mergeAuth(
  current: StoredAuth | null,
  next: Partial<AuthTokens>,
): StoredAuth | null {
  if (!current && (!next.access_token || !next.refresh_token)) return null;

  return {
    access_token: next.access_token ?? current?.access_token ?? "",
    refresh_token: next.refresh_token ?? current?.refresh_token ?? "",
    user: next.user ?? current?.user ?? null,
  };
}
