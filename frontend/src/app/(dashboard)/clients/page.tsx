"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientTable } from "@/components/clients/ClientTable";
import { useClients } from "@/hooks/useClients";
import { useAllOnboardingProgress } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  const router = useRouter();
  const { data: clients = [], isLoading } = useClients();
  const onboardingData = useAllOnboardingProgress();
  const enrichedClients = clients.map((c) => ({
    ...c,
    onboardingProgress: onboardingData[c.id]?.progress ?? c.onboardingProgress,
    currentStepLabel: onboardingData[c.id]?.currentStepLabel ?? null,
  }));

  const active = enrichedClients.filter((c) => c.status === "active");
  const mrr = active.reduce((s, c) => s + c.monthlyValue, 0);

  return (
    <div className="max-w-[1400px]">
      <PageHeader
        title="Clients"
        subtitle={`${active.length} active clients · £${mrr.toLocaleString("en-GB")} MRR`}
        action={
          <button
            onClick={() => router.push("/clients/new")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            Add Client
          </button>
        }
      />

      {/* Summary pills */}
      <div className="flex gap-3 mb-6">
        {[
          { label: "Active", count: enrichedClients.filter((c) => c.status === "active").length, color: "bg-green-100 text-green-700" },
          { label: "Paused", count: enrichedClients.filter((c) => c.status === "paused").length, color: "bg-yellow-100 text-yellow-700" },
          { label: "Churned", count: enrichedClients.filter((c) => c.status === "churned").length, color: "bg-red-100 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold", s.color)}>
            {s.label}
            <span className="font-black">{s.count}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <ClientTable clients={enrichedClients} />
      )}

    </div>
  );
}
