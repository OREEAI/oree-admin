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

export async function ResetPromptApi(key: string): Promise<PromptTemplate> {
  const { data } = await apiClient.post<PromptTemplate | ApiEnvelope<PromptTemplate>>(
    `/api/admin/prompts/${key}/reset`,
    {},
  );
  return unwrapApiEnvelope(data) as PromptTemplate;
}
