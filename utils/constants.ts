export const rqKeys = {
  auth: "auth",
  // Admin-scoped cookie names so the console never clobbers a customer-app
  // session that might be living on the same parent domain.
  accesstoken: "oree-admin-access-token",
  refreshtoken: "oree-admin-refresh-token",
  user: "user",
  session: "session",
  orgs: "orgs",
  adminUsers: "admin-users",
  platformStats: "platform-stats",
  mailboxes: "admin-mailboxes",
  domains: "admin-domains",
  campaigns: "admin-campaigns",
};

// The cookie key the topbar "Act as org" switcher writes. Set on the
// .oreeai.com parent domain so the backend (once it honours it) and any
// sibling app can read the impersonation target.
export const ACTING_AS_ORG_COOKIE = "acting_as_org_id";

// Cookie TTLs in days. Match the backend JWT exp claims (24h access,
// 30d refresh — see AuthenticationService) so the cookie outlives the
// JWT and the refresh flow can run.
export const accesstokenttl = 1;
export const refreshtokenttl = 30;

export const PAGINATION_DEFAULT_PAGE_SIZE = 10;
