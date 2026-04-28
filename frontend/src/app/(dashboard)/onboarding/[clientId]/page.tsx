"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import {
  useOnboardingSteps,
  useToggleOnboardingStep,
  computeProgress,
  STEP_META,
  DEFAULT_STEP_KEYS,
} from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const router = useRouter();
  const client = useClient(clientId);
  const { data: steps = [], isLoading } = useOnboardingSteps(clientId);
  const toggleStep = useToggleOnboardingStep(clientId);

  const progress = computeProgress(steps);
  const completedCount = steps.filter((s) => s.completed).length;

  const handleToggle = async (stepId: string, current: boolean) => {
    const step = steps.find((s) => s.id === stepId);
    const label = step ? (STEP_META[step.step]?.label ?? step.step) : "Step";
    try {
      await toggleStep.mutateAsync({ stepId, completed: !current });
      toast.success(!current ? `✓ ${label}` : `Unchecked: ${label}`);
    } catch {
      toast.error("Failed to update step.");
    }
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 mb-5 transition-colors cursor-pointer"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-6">
        <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">Onboarding</p>
        <h1 className="text-2xl font-black tracking-tight text-black">{client.name}</h1>
      </div>

      {/* Progress */}
      <div className="border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-gray-900">Progress</p>
          <p className="text-2xl font-black text-black">{progress}%</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progress === 100 ? "bg-green-600" : "bg-red-600"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completedCount} of {DEFAULT_STEP_KEYS.length} steps complete
          {progress === 100 && " — ready to activate portal"}
        </p>
      </div>

      {/* Steps — always shows all 5 */}
      <div className="border border-gray-200 divide-y divide-gray-100">
        {DEFAULT_STEP_KEYS.map((key, i) => {
          const meta = STEP_META[key];
          const step = steps.find((s) => s.step === key);
          const done = step?.completed ?? false;
          const isStub = !isLoading && !step;

          return (
            <button
              key={key}
              onClick={() => step && handleToggle(step.id, done)}
              disabled={!step || toggleStep.isPending || isLoading}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left disabled:cursor-default"
            >
              <span className="text-[11px] font-mono text-gray-300 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              {isLoading ? (
                <div className="w-[18px] h-[18px] rounded-full bg-gray-100 animate-pulse shrink-0" />
              ) : done ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              ) : (
                <Circle size={18} className={cn("shrink-0", isStub ? "text-gray-100" : "text-gray-300")} />
              )}

              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-36" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-52" />
                  </div>
                ) : (
                  <>
                    <p className={cn(
                      "text-sm font-semibold",
                      done ? "text-gray-900" : isStub ? "text-gray-300" : "text-gray-600"
                    )}>
                      {meta.label}
                    </p>
                    <p className={cn("text-xs mt-0.5", isStub ? "text-gray-200" : "text-gray-400")}>
                      {meta.desc}
                    </p>
                  </>
                )}
              </div>

              {!isLoading && done && step?.completed_at && (
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(step.completed_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short",
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
