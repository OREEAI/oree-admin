import type { ApiEnvelope } from "@/interface/general";
import { apiClient, unwrapApiEnvelope } from "@/service/api";

// ---------------------------------------------------------------------------
// Content-prompt editor (super-admin). Backs /prompts.
//   GET  /api/admin/prompts
//   PUT  /api/admin/prompts/<key>
//   POST /api/admin/prompts/<key>/reset
// The four prompts (email / linkedin / video / call) are served DB-first by the
// pipeline with the code defaults as the fallback, so editing here never risks
// breaking generation.
// ---------------------------------------------------------------------------

export type PromptTemplate = {
  key: string;
  label: string;
  system_prompt: string;
  template: string;
  allowed_variables: string[];
  rag_document_ids: string[];
  is_active: boolean;
  using_default: boolean;
  updated_at: string | null;
};

export async function GetPromptsApi(): Promise<PromptTemplate[]> {
  const { data } = await apiClient.get<PromptTemplate[] | ApiEnvelope<PromptTemplate[]>>(
    "/api/admin/prompts",
  );
  const value = unwrapApiEnvelope(data);
  return Array.isArray(value) ? value : [];
}

export async function SavePromptApi(
  key: string,
  body: {
    system_prompt: string;
    template: string;
    is_active?: boolean;
    rag_document_ids?: string[];
  },
): Promise<PromptTemplate> {
  const { data } = await apiClient.put<PromptTemplate | ApiEnvelope<PromptTemplate>>(
    `/api/admin/prompts/${key}`,
    body,
  );
  return unwrapApiEnvelope(data) as PromptTemplate;
}

export type PromptSample = {
  markdown: string;
  lead_name: string;
  organization: string;
};

/** Render every prompt's real output for one lead (Ben Aug 2: "all prompts
 * for one lead"). Synchronous on the backend — the Claude calls make it take
 * up to ~1 minute, so give axios a long timeout. */
export async function RenderPromptSampleApi(
  lead: string,
  organizationId?: string,
): Promise<PromptSample> {
  const { data } = await apiClient.post<PromptSample | ApiEnvelope<PromptSample>>(
    "/api/admin/prompts/sample",
    { lead, ...(organizationId ? { organization: organizationId } : {}) },
    { timeout: 180_000 },
  );
  return unwrapApiEnvelope(data);
}

export async function ResetPromptApi(key: string): Promise<PromptTemplate> {
  const { data } = await apiClient.post<PromptTemplate | ApiEnvelope<PromptTemplate>>(
    `/api/admin/prompts/${key}/reset`,
    {},
  );
  return unwrapApiEnvelope(data) as PromptTemplate;
}

// ---------------------------------------------------------------------------
// Named prompt sets (Ben, 5 Sep). OREE authors and names them ('Sales',
// 'Partnership'); org admins only ever assign them by name. Master sets
// (organization: null) are assignable everywhere; a clone owned by one org is
// how a customer gets a tweaked copy that affects nobody else.
//   GET    /api/admin/prompt-sets            (?organization=<id>)
//   POST   /api/admin/prompt-sets            {name, notes?, organization?}
//   DELETE /api/admin/prompt-sets/<id>
//   GET    /api/admin/prompt-sets/<id>/prompts
//   PUT    /api/admin/prompt-sets/<id>/prompts/<key>
//   POST   /api/admin/prompt-sets/<id>/clone  {organization, name?}
// ---------------------------------------------------------------------------

export type PromptSetSummary = {
  id: string;
  name: string;
  notes: string;
  organization: string | null;
  organization_name: string | null;
  assigned_users: number;
  prompt_count: number;
  updated_at: string | null;
};

export type PromptSetPrompt = {
  key: string;
  system_prompt: string;
  template: string;
  allowed_variables: string[];
  is_active: boolean;
  /** false = this key is unset in the set and falls through to the defaults. */
  is_set: boolean;
  updated_at: string | null;
};

export type PromptSetDetail = {
  set: PromptSetSummary;
  prompts: PromptSetPrompt[];
};

export async function GetPromptSetsApi(organizationId?: string): Promise<PromptSetSummary[]> {
  const { data } = await apiClient.get<PromptSetSummary[] | ApiEnvelope<PromptSetSummary[]>>(
    "/api/admin/prompt-sets",
    { params: organizationId ? { organization: organizationId } : undefined },
  );
  const value = unwrapApiEnvelope(data);
  return Array.isArray(value) ? value : [];
}

export async function CreatePromptSetApi(body: {
  name: string;
  notes?: string;
  organization?: string | null;
}): Promise<PromptSetSummary> {
  const { data } = await apiClient.post<PromptSetSummary | ApiEnvelope<PromptSetSummary>>(
    "/api/admin/prompt-sets",
    body,
  );
  return unwrapApiEnvelope(data) as PromptSetSummary;
}

export async function DeletePromptSetApi(setId: string): Promise<{ released_users: number }> {
  const { data } = await apiClient.delete<ApiEnvelope<{ released_users: number }>>(
    `/api/admin/prompt-sets/${setId}`,
  );
  return unwrapApiEnvelope(data) as { released_users: number };
}

export async function GetPromptSetDetailApi(setId: string): Promise<PromptSetDetail> {
  const { data } = await apiClient.get<PromptSetDetail | ApiEnvelope<PromptSetDetail>>(
    `/api/admin/prompt-sets/${setId}/prompts`,
  );
  return unwrapApiEnvelope(data) as PromptSetDetail;
}

export async function SavePromptSetPromptApi(
  setId: string,
  key: string,
  body: { system_prompt: string; template: string; is_active?: boolean },
): Promise<PromptSetPrompt> {
  const { data } = await apiClient.put<PromptSetPrompt | ApiEnvelope<PromptSetPrompt>>(
    `/api/admin/prompt-sets/${setId}/prompts/${key}`,
    body,
  );
  return unwrapApiEnvelope(data) as PromptSetPrompt;
}

export async function ClonePromptSetApi(
  setId: string,
  body: { organization: string; name?: string },
): Promise<PromptSetSummary> {
  const { data } = await apiClient.post<PromptSetSummary | ApiEnvelope<PromptSetSummary>>(
    `/api/admin/prompt-sets/${setId}/clone`,
    body,
  );
  return unwrapApiEnvelope(data) as PromptSetSummary;
}
