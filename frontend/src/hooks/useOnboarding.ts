"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function computeProgress(steps: OnboardingStep[]): number {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((s) => s.completed).length / steps.length) * 100);
}
