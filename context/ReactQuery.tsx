"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { isUnauthorizedError } from "@/service/api";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            retryOnMount: false,
            retry: (failureCount, error) => {
              if (failureCount >= 2) return false;
              if (isUnauthorizedError(error)) return false;

              const status =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { status?: number } }).response?.status === "number"
                  ? (error as { response?: { status?: number } }).response?.status
                  : null;

              if (typeof status === "number" && status >= 400 && status < 500) {
                return false;
              }

              return true;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
