import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

// Super-admin cleanup runners, backed by Jude's admin_cleanup endpoints (#39):
//   GET  /api/admin/cleanup/actions
//   POST /api/admin/cleanup/<action>/preview   (dry-run, returns candidates)
//   POST /api/admin/cleanup/<action>/apply     (executes; writes an audit log)

export type CleanupAction = {
  name: string;
  description: string;
};

// Candidate rows are heterogeneous per action (mailboxes, companies,
// campaigns), so render them generically.
export type CleanupCandidate = Record<string, unknown>;

export type CleanupPreview = {
  action: string;
  candidates: CleanupCandidate[];
  count: number;
};

export type CleanupApplyResult = {
  action: string;
  applied_count: number;
  candidates: CleanupCandidate[];
};

export async function GetCleanupActionsApi(): Promise<CleanupAction[]> {
  const { data } = await apiClient.get<
    { actions: CleanupAction[] } | ApiEnvelope<{ actions: CleanupAction[] }>
  >("/api/admin/cleanup/actions");
  return unwrapApiEnvelope(data).actions ?? [];
}

export async function PreviewCleanupApi(action: string): Promise<CleanupPreview> {
  const { data } = await apiClient.post<CleanupPreview | ApiEnvelope<CleanupPreview>>(
    `/api/admin/cleanup/${action}/preview`,
  );
  return unwrapApiEnvelope(data);
}

export async function ApplyCleanupApi(action: string): Promise<CleanupApplyResult> {
  const { data } = await apiClient.post<CleanupApplyResult | ApiEnvelope<CleanupApplyResult>>(
    `/api/admin/cleanup/${action}/apply`,
  );
  return unwrapApiEnvelope(data);
}
