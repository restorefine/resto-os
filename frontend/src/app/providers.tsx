"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { getMe } from "@/lib/auth";
import { useStore } from "@/store/useStore";

function AuthInit() {
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  useEffect(() => {
    getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => {});
  }, [setCurrentUser]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "font-sans text-sm",
          },
        }}
      />
    </QueryClientProvider>
  );
}
