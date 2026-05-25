import type { Role } from "@/interface/session";

export type AuthUser = {
  id: string;
  organization: string | null;
  organization_name: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  dashboard_enabled?: boolean;
  writing_style: string;
  linkedin_url: string;
  linkedin_summary: string;
  linkedin_last_scraped: string | null;
  last_login: string | null;
  member_onboarded_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type LoginEnvelope = {
  message: string;
  data: LoginResponse;
};

export type TokenRefreshRequest = {
  refresh_token: string;
};

export type TokenPairResponse = {
  access_token: string;
  refresh_token: string;
};

export type TokenPairEnvelope = {
  message?: string;
  data: TokenPairResponse;
};

export type StoredAuth = {
  access_token: string;
  refresh_token: string;
  user: AuthUser | null;
};

export type AuthTokens = StoredAuth;
