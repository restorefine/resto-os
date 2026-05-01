"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/lib/types";
import api from "@/lib/api";

export interface OnboardingStep {
  id: string;
  client_id: string;
  step: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const STEP_META: Record<string, { label: string; desc: string }> = {
  contract_signed: {
    label: "Contract Signed",
    desc: "Client has signed the service agreement",
  },
  payment_details: {
    label: "Payment Details Received",
    desc: "Payment method collected and confirmed",
  },
  brand_assets: {
    label: "Brand Assets Collected",
    desc: "Logo, fonts, and colour palette received",
  },
  social_access: {
    label: "Social Media Access",
    desc: "Social media credentials shared with the team",
  },
  kick_off_call: {
    label: "Kick-Off Call Completed",
    desc: "Strategy and expectations aligned with client",
  },
};

// Ordered keys matching the backend's EnsureDefaultSteps order
export const DEFAULT_STEP_KEYS = [
  "contract_signed",
  "payment_details",
  "brand_assets",
  "social_access",
  "kick_off_call",
] as const;

async function fetchAllSteps(): Promise<OnboardingStep[]> {
  const res = await api.get("/api/onboarding/all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return d?.data ?? d ?? [];
}

async function fetchSteps(clientId: string): Promise<OnboardingStep[]> {
  const res = await api.get(`/api/onboarding/${clientId}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return d?.data ?? d ?? [];
}

async function toggleStep(
  clientId: string,
  stepId: string,
  completed: boolean
): Promise<OnboardingStep> {
  const res = await api.patch(`/api/onboarding/${clientId}/step/${stepId}`, {
    completed,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return d?.data ?? d;
}

export interface OnboardingClientData {
  progress: number;
  currentStepLabel: string | null;
}

export function useAllOnboardingProgress(): Record<string, OnboardingClientData> {
  const qc = useQueryClient();
  const { data: allSteps = [] } = useQuery({
    queryKey: ["onboarding-all"],
    queryFn: fetchAllSteps,
    staleTime: 30_000,
  });

  const result: Record<string, OnboardingClientData> = {};
  const byClient: Record<string, OnboardingStep[]> = {};
  for (const step of allSteps) {
    (byClient[step.client_id] ??= []).push(step);
  }
  for (const [clientId, steps] of Object.entries(byClient)) {
    const live = qc.getQueryData<OnboardingStep[]>(["onboarding", clientId]) ?? steps;
    const progress = computeProgress(live);
    const firstIncomplete = DEFAULT_STEP_KEYS.find(
      (key) => !live.find((s) => s.step === key)?.completed
    );
    result[clientId] = {
      progress,
      currentStepLabel: firstIncomplete ? (STEP_META[firstIncomplete]?.label ?? null) : null,
    };
  }
  return result;
}

export function useOnboardingSteps(clientId: string) {
  return useQuery({
    queryKey: ["onboarding", clientId],
    queryFn: () => fetchSteps(clientId),
    enabled: !!clientId,
  });
}

export function useToggleOnboardingStep(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, completed }: { stepId: string; completed: boolean }) =>
      toggleStep(clientId, stepId, completed),
    onMutate: async ({ stepId, completed }) => {
      await qc.cancelQueries({ queryKey: ["onboarding", clientId] });
      const prev = qc.getQueryData<OnboardingStep[]>(["onboarding", clientId]);
      if (prev) {
        const updated = prev.map((s) =>
          s.id === stepId
            ? { ...s, completed, completed_at: completed ? new Date().toISOString() : null }
            : s
        );
        qc.setQueryData(["onboarding", clientId], updated);
        const newProgress = computeProgress(updated);
        qc.setQueryData<Client[]>(["clients"], (old) =>
          old?.map((c) => c.id === clientId ? { ...c, onboardingProgress: newProgress } : c) ?? old
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["onboarding", clientId], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding", clientId] });
      qc.invalidateQueries({ queryKey: ["onboarding-all"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function computeProgress(steps: OnboardingStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((s) => s.completed).length / steps.length) * 100);
}
