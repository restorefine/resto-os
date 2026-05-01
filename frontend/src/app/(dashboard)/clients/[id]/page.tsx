"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Globe, FileText, CheckCircle2, Circle, Mail, Phone,
  CalendarDays, Banknote, UserCircle2, Clock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient, useActivatePortal } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useVideos } from "@/hooks/useVideos";
import {
  useOnboardingSteps,
  useToggleOnboardingStep,
  computeProgress,
  STEP_META,
  DEFAULT_STEP_KEYS,
} from "@/hooks/useOnboarding";
import { ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES: Record<ClientStatus, { pill: string; dot: string }> = {
  active:  { pill: "bg-green-100 text-green-700 border border-green-200",  dot: "bg-green-500" },
  paused:  { pill: "bg-yellow-100 text-yellow-700 border border-yellow-200", dot: "bg-yellow-500" },
  churned: { pill: "bg-red-100 text-red-700 border border-red-200",        dot: "bg-red-500" },
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const client = useClient(id);
  const { data: invoices = [] } = useInvoices();
  const { data: videos = [] } = useVideos();
  const activatePortal = useActivatePortal();
  const { data: steps = [], isLoading: stepsLoading } = useOnboardingSteps(id);
  const toggleStep = useToggleOnboardingStep(id);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Client not found.</p>
      </div>
    );
  }

  const clientInvoices = invoices.filter((i) => i.clientId === id);
  const clientVideos = videos.filter((v) => v.clientId === id);
  const progress = computeProgress(steps);
  const completedCount = steps.filter((s) => s.completed).length;
  const st = STATUS_STYLES[client.status];

  const handleActivate = async () => {
    if (!confirm(`Activate portal for ${client.name}? This will send them a login email.`)) return;
    try {
      await activatePortal.mutateAsync(id);
      toast.success("Portal activated — login email sent.");
    } catch {
      toast.error("Failed to activate portal.");
    }
  };

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

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={13} /> Back to clients
      </button>

      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1 font-semibold">
              {client.package}
            </p>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">
              {client.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", st.pill)}>
                {client.status}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <UserCircle2 size={12} />
                {client.assignedTo}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-black text-gray-900 tabular-nums">
              £{client.monthlyValue.toLocaleString("en-GB")}
              <span className="text-sm font-semibold text-gray-400">/mo</span>
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <Globe size={12} className={client.portalActive ? "text-green-500" : "text-gray-300"} />
              <span className={cn("text-[11px] font-medium", client.portalActive ? "text-green-600" : "text-gray-400")}>
                {client.portalActive ? "Portal active" : "Portal inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-row: portal action + onboarding progress */}
        <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] tracking-[0.14em] uppercase text-gray-400 font-semibold">
                Onboarding
              </span>
              <span className="text-[11px] font-bold text-gray-600 tabular-nums">
                {completedCount}/{steps.length} steps · {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  progress === 100 ? "bg-green-500" : "bg-red-600"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!client.portalActive && (
            <button
              onClick={handleActivate}
              disabled={progress < 100 || activatePortal.isPending}
              title={progress < 100 ? "Complete all onboarding steps first" : undefined}
              className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] tracking-[0.18em] uppercase font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Activate Portal
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column: Details + Checklist ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

        {/* Client details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-gray-400">
              Client Details
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            <DetailRow icon={<Mail size={13} />} label="Email" value={client.email} />
            <DetailRow icon={<Phone size={13} />} label="Phone" value={client.phone ?? "—"} />
            <DetailRow icon={<Banknote size={13} />} label="Monthly Value" value={`£${client.monthlyValue.toLocaleString("en-GB")}`} />
            <DetailRow icon={<CalendarDays size={13} />} label="Invoice Day" value={`Day ${client.invoiceDay} of each month`} />
            <DetailRow
              icon={<Clock size={13} />}
              label="Client Since"
              value={new Date(client.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            />
            {client.contractUrl && (
              <div className="px-5 py-3.5 flex items-center gap-3">
                <span className="text-gray-300 shrink-0"><FileText size={13} /></span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.12em] uppercase font-semibold text-gray-400 mb-0.5">Contract</p>
                  <a
                    href={client.contractUrl}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                  >
                    View Contract →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Onboarding checklist card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-gray-400">
              Onboarding Checklist
            </p>
            {progress === 100 ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                <CheckCircle2 size={14} className="text-green-500" /> Complete
              </span>
            ) : (
              <span className="text-[11px] font-bold text-gray-500">
                {completedCount} of {steps.length} done
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-50">
              {DEFAULT_STEP_KEYS.map((key, i) => {
                const meta = STEP_META[key];
                // Match to real backend step if available
                const step = steps.find((s) => s.step === key);
                const done = step?.completed ?? false;
                const isLoading = stepsLoading;
                const isStub = !stepsLoading && !step; // backend hasn't seeded yet

                return (
                  <button
                    key={key}
                    onClick={() => step && handleToggle(step.id, done)}
                    disabled={!step || toggleStep.isPending || isLoading}
                    title={isStub ? "Restart the backend to activate this checklist" : undefined}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors group",
                      !step || isLoading ? "cursor-default" : "cursor-pointer",
                      done ? "bg-green-50/60 hover:bg-green-50" : step ? "hover:bg-gray-50" : ""
                    )}
                  >
                    {/* Step number */}
                    <span className="text-[10px] font-mono text-gray-300 w-4 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Icon */}
                    {isLoading ? (
                      <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    ) : done ? (
                      <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    ) : (
                      <Circle size={20} className={cn("shrink-0", isStub ? "text-gray-100" : "text-gray-200 group-hover:text-gray-300 transition-colors")} />
                    )}

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      {isLoading ? (
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-gray-100 rounded animate-pulse w-36" />
                          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-52" />
                        </div>
                      ) : (
                        <>
                          <p className={cn(
                            "text-sm font-semibold leading-tight",
                            done ? "text-green-700 line-through decoration-green-300"
                              : isStub ? "text-gray-300"
                              : "text-gray-800"
                          )}>
                            {meta.label}
                          </p>
                          <p className={cn("text-[11px] mt-0.5 leading-snug", done ? "text-green-500" : isStub ? "text-gray-200" : "text-gray-400")}>
                            {meta.desc}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Right side */}
                    {!isLoading && (
                      done && step?.completed_at ? (
                        <span className="text-[10px] text-green-500 font-medium shrink-0 bg-green-50 px-2 py-0.5 rounded-full">
                          {new Date(step.completed_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      ) : step ? (
                        <span className="text-[10px] text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Click to mark done
                        </span>
                      ) : null
                    )}
                  </button>
                );
              })}
            </div>
        </div>
      </div>

      {/* ── Invoices + Videos tabs ───────────────────────────────── */}
      <Tabs defaultValue="invoices">
        <TabsList className="border-b border-gray-200 bg-transparent rounded-none p-0 h-auto gap-0">
          {[
            { value: "invoices", label: `Invoices${clientInvoices.length ? ` (${clientInvoices.length})` : ""}` },
            { value: "videos",   label: `Videos${clientVideos.length ? ` (${clientVideos.length})` : ""}` },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 pb-2.5 px-4 text-xs uppercase tracking-[0.14em] font-bold text-gray-400 data-[state=active]:bg-transparent"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Reference", "Amount", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] tracking-[0.14em] uppercase text-gray-400 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                      No invoices yet.
                    </td>
                  </tr>
                ) : clientInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{inv.reference}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">£{inv.amount.toLocaleString("en-GB")}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(inv.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos" className="mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Title", "Platform", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] tracking-[0.14em] uppercase text-gray-400 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientVideos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                      No videos yet.
                    </td>
                  </tr>
                ) : clientVideos.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{v.title}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-500 text-xs">{v.platform}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(v.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <span className="text-gray-300 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.12em] uppercase font-semibold text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:          "bg-green-100 text-green-700 border border-green-200",
    unpaid:        "bg-yellow-100 text-yellow-700 border border-yellow-200",
    overdue:       "bg-red-100 text-red-700 border border-red-200",
    approved:      "bg-green-100 text-green-700 border border-green-200",
    pending:       "bg-yellow-100 text-yellow-700 border border-yellow-200",
    edit_requested:"bg-orange-100 text-orange-700 border border-orange-200",
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
      styles[status] ?? "bg-gray-100 text-gray-600"
    )}>
      {status.replace("_", " ")}
    </span>
  );
}
