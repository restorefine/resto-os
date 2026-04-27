"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, FileText, CheckCircle2, Circle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient, useActivatePortal } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useVideos } from "@/hooks/useVideos";
import { MOCK_ONBOARDING } from "@/lib/mock-data";
import { ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES: Record<ClientStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  churned: "bg-red-100 text-red-800",
};

const ONBOARDING_STEPS = [
  { key: "contract", label: "Contract signed" },
  { key: "payment", label: "First payment received" },
  { key: "brandAssets", label: "Brand assets collected" },
  { key: "accessGranted", label: "Account access granted" },
  { key: "kickOffCall", label: "Kick-off call completed" },
  { key: "questionnaire", label: "Questionnaire returned" },
  { key: "firstDraft", label: "First content draft approved" },
  { key: "firstPost", label: "First post published" },
] as const;

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

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Client not found.</p>
      </div>
    );
  }

  const clientInvoices = invoices.filter((i) => i.clientId === id);
  const clientVideos = videos.filter((v) => v.clientId === id);
  const onboarding = MOCK_ONBOARDING[id] ?? null;

  const handleActivate = async () => {
    if (!confirm(`Activate portal for ${client.name}? This will send them a login email.`)) return;
    try {
      await activatePortal.mutateAsync(id);
      toast.success("Portal activated — login email sent.");
    } catch {
      toast.error("Failed to activate portal.");
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft size={13} /> Back to clients
      </button>

      {/* Header */}
      <div className="border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">
              {client.package}
            </p>
            <h1 className="text-2xl font-black tracking-tight text-black">
              {client.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Assigned to {client.assignedTo}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                STATUS_STYLES[client.status]
              )}
            >
              {client.status}
            </span>
            <span className="text-lg font-black text-black font-mono">
              £{client.monthlyValue.toLocaleString("en-GB")}/mo
            </span>
          </div>
        </div>

        {/* Portal status */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Globe size={14} className={client.portalActive ? "text-green-600" : "text-gray-400"} />
            <span className={client.portalActive ? "text-green-700" : "text-gray-500"}>
              {client.portalActive ? "Portal active" : "Portal inactive"}
            </span>
          </div>
          {!client.portalActive && (
            <button
              onClick={handleActivate}
              disabled={client.onboardingProgress < 100 || activatePortal.isPending}
              className="flex items-center gap-1.5 bg-black hover:bg-gray-900 text-white text-[10px] tracking-[0.18em] uppercase font-bold px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Activate Portal
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="border-b border-gray-200 bg-transparent rounded-none p-0 h-auto mb-6 gap-0">
          {["overview", "invoices", "videos", "onboarding"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 pb-2.5 px-4 text-xs uppercase tracking-[0.14em] font-bold text-gray-400 data-[state=active]:bg-transparent"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoBlock label="Email" value={client.email} />
            <InfoBlock label="Phone" value={client.phone ?? "—"} />
            <InfoBlock label="Invoice Day" value={`Day ${client.invoiceDay} of each month`} />
            <InfoBlock label="Monthly Value" value={`£${client.monthlyValue.toLocaleString("en-GB")}`} />
            <InfoBlock label="Client Since" value={new Date(client.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
            {client.contractUrl && (
              <InfoBlock label="Contract">
                <a href={client.contractUrl} className="flex items-center gap-1 text-sm text-red-600 hover:underline">
                  <FileText size={13} /> View Contract
                </a>
              </InfoBlock>
            )}
          </div>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Reference", "Amount", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-[0.14em] uppercase text-gray-500 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientInvoices.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No invoices.</td></tr>
                )}
                {clientInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-mono text-xs">{inv.reference}</td>
                    <td className="px-4 py-3 font-mono">£{inv.amount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(inv.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos">
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {["Title", "Platform", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-[0.14em] uppercase text-gray-500 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientVideos.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No videos.</td></tr>
                )}
                {clientVideos.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{v.title}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{v.platform}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(v.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Onboarding */}
        <TabsContent value="onboarding">
          <div className="border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">
                Onboarding Progress
              </p>
              <span className="text-sm font-black text-black">
                {client.onboardingProgress}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 mb-5">
              <div
                className="h-full bg-red-600 transition-all"
                style={{ width: `${client.onboardingProgress}%` }}
              />
            </div>
            <div className="space-y-3">
              {ONBOARDING_STEPS.map((step) => {
                const done = onboarding?.[step.key] ?? false;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 shrink-0" />
                    )}
                    <span className={cn("text-sm", done ? "text-gray-900" : "text-gray-400")}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] tracking-[0.16em] uppercase text-gray-400 mb-1">{label}</p>
      {children ?? <p className="text-sm font-medium text-gray-900">{value}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    approved: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    edit_requested: "bg-red-100 text-red-800",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", styles[status] ?? "bg-gray-100 text-gray-800")}>
      {status.replace("_", " ")}
    </span>
  );
}
