import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

export type AdminOrg = {
  id: string;
  organization_name: string;
};

/**
 * List every organisation for the "Act as org" switcher.
 *
 * TODO(backend): there is currently NO cross-org admin list endpoint.
 * `GET /api/organization` only returns the requesting user's own org, and
 * the only place to see all orgs today is Django admin at `/admin/`. Once a
 * super-admin "list all orgs" endpoint exists, point this at it (expected
 * shape below) and delete the stub fallback.
 *
 * Expected endpoint: GET /api/admin/organizations
 * Expected payload : { data: AdminOrg[] } | AdminOrg[]
 */
const ADMIN_ORGS_ENDPOINT = "/api/admin/organizations";

const STUB_ORGS: AdminOrg[] = [
  { id: "stub-org-1", organization_name: "Momentum Outbound (stub)" },
  { id: "stub-org-2", organization_name: "Acme Corp (stub)" },
];

export async function GetAdminOrgsApi(): Promise<AdminOrg[]> {
  try {
    const { data } = await apiClient.get<AdminOrg[] | ApiEnvelope<AdminOrg[]>>(
      ADMIN_ORGS_ENDPOINT,
    );
    return unwrapApiEnvelope(data);
  } catch {
    // The admin orgs endpoint does not exist yet — fall back to a clearly
    // labelled stub so the switcher's selection behaviour is still testable.
    // TODO(backend): remove once the real endpoint ships.
    return STUB_ORGS;
  }
}
