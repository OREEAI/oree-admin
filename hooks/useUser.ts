"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AuthUser, LoginRequest, LoginResponse } from "@/interface/auth";
import {
  clearAuth,
  isAuthenticated,
  LoginUserApi,
  saveAuth,
} from "@/service/auth";
import { GetCurrentUserApi } from "@/service/user";
import { clearActingAsOrg } from "@/lib/acting-as-org";
import { rqKeys } from "@/utils/constants";

const USER_STALE_TIME = 60_000;

export function useUserQuery(
  options?: Partial<UseQueryOptions<AuthUser, Error, AuthUser, readonly [string]>>,
) {
  return useQuery({
    queryKey: [rqKeys.user],
    queryFn: GetCurrentUserApi,
    staleTime: USER_STALE_TIME,
    enabled: options?.enabled ?? isAuthenticated(),
    ...options,
  });
}

function clearAuthQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ queryKey: [rqKeys.auth] });
  queryClient.removeQueries({ queryKey: [rqKeys.user] });
  queryClient.removeQueries({ queryKey: [rqKeys.session] });
  queryClient.removeQueries({ queryKey: [rqKeys.orgs] });
}

export const LoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [rqKeys.auth, "login"],
    mutationFn: (payload: LoginRequest) => LoginUserApi(payload),
    onSuccess: async (response: LoginResponse) => {
      saveAuth({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user: response.user,
      });
      queryClient.setQueryData([rqKeys.user], response.user);
    },
  });
};

export const LogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [rqKeys.auth, "logout"],
    mutationFn: async () => {
      clearAuth();
      clearActingAsOrg();
    },
    onSuccess: async () => {
      clearAuthQueries(queryClient);
      await queryClient.cancelQueries();
      router.replace("/login");
    },
  });
};
