"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login, portalLogin, logout, getMe } from "@/lib/auth";
import { useStore } from "@/store/useStore";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCurrentUser } = useStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.setQueryData(["me"], user);
      router.push("/");
    },
  });

  const portalLoginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      portalLogin(email, password),
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.setQueryData(["me"], user);
      router.push(`/portal/${user.id}`);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    portalLogin: portalLoginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isPortalLoginPending: portalLoginMutation.isPending,
    loginError: loginMutation.error,
    portalLoginError: portalLoginMutation.error,
  };
}
