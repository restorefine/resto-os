"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { getMe } from "@/lib/auth";
import { useStore } from "@/store/useStore";

const PUBLIC_PATHS = ["/login", "/portal/login"];

function AuthInit() {
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const pathname = usePathname();

  useEffect(() => {
    // Don't attempt session restore on login pages — would cause an infinite 401 loop
    if (PUBLIC_PATHS.includes(pathname)) return;

    getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => {});
  }, [pathname, setCurrentUser]);

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
