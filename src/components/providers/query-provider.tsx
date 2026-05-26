"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV !== "production";
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data stays fresh for 1 minute
            refetchOnWindowFocus: false, // Prevents aggressive reloading in admin panels
            retry: 1, // Don't pound the database on errors
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {isDev ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
      </QueryClientProvider>
    </SessionProvider>
  )
}
