"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { MOCK_ONBOARDING } from "@/lib/mock-data";
import { OnboardingChecklist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS: { key: keyof Omit<OnboardingChecklist, "clientId">; label: string; desc: string }[] = [
  { key: "contract", label: "Contract Signed", desc: "Client has signed the service agreement" },
  { key: "payment", label: "First Payment Received", desc: "Initial invoice has been settled" },
  { key: "brandAssets", label: "Brand Assets Collected", desc: "Logo, fonts, colour palette received" },
  { key: "accessGranted", label: "Account Access Granted", desc: "Social media credentials shared" },
  { key: "kickOffCall", label: "Kick-Off Call Completed", desc: "Strategy and expectations aligned" },
  { key: "questionnaire", label: "Questionnaire Returned", desc: "Brand questionnaire completed by client" },
  { key: "firstDraft", label: "First Content Draft Approved", desc: "Initial content batch signed off" },
  { key: "firstPost", label: "First Post Published", desc: "Live on social — onboarding complete" },
];

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const router = useRouter();
  const client = useClient(clientId);

  const [checklist, setChecklist] = useState<OnboardingChecklist>(
    MOCK_ONBOARDING[clientId] ?? {
      clientId,
      contract: false,
      payment: false,
      brandAssets: false,
      accessGranted: false,
      kickOffCall: false,
      questionnaire: false,
      firstDraft: false,
      firstPost: false,
    }
  );

  const completedCount = STEPS.filter((s) => checklist[s.key]).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  const toggle = (key: keyof Omit<OnboardingChecklist, "clientId">) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    // await api.put(`/api/clients/${clientId}/onboarding`, next);
    const label = STEPS.find((s) => s.key === key)?.label ?? key;
    toast.success(next[key] ? `✓ ${label}` : `Unchecked: ${label}`);
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
        <div className="h-2 bg-gray-100">
          <div
            className={cn(
              "h-full transition-all duration-500",
              progress === 100 ? "bg-green-600" : "bg-red-600"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completedCount} of {STEPS.length} steps complete
          {progress === 100 && " — ready to activate portal"}
        </p>
      </div>

      {/* Steps */}
      <div className="border border-gray-200 divide-y divide-gray-100">
        {STEPS.map((step, i) => {
          const done = checklist[step.key];
          return (
            <button
              key={step.key}
              onClick={() => toggle(step.key)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
            >
              <span className="text-[11px] font-mono text-gray-300 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {done ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-300 shrink-0" />
              )}
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", done ? "text-gray-900" : "text-gray-500")}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
