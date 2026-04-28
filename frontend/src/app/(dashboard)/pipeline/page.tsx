"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { DropResult } from "@hello-pangea/dnd";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePipeline, useMoveLead, useCreateLead } from "@/hooks/usePipeline";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { Client, Lead, PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const DragDropContext = dynamic(() => import("@hello-pangea/dnd").then((m) => m.DragDropContext), { ssr: false });
const KanbanColumn = dynamic(() => import("@/components/pipeline/KanbanColumn").then((m) => m.KanbanColumn), { ssr: false });

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "outreach", label: "Outreach" },
  { id: "meeting", label: "Meeting" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "signed", label: "Signed" },
];

const leadSchema = z.object({
  companyName: z.string().min(1, "Company name required"),
  contactName: z.string().min(1, "Contact name required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  value: z.number().min(1, "Value required"),
  nextAction: z.string().min(1, "Next action required"),
  assignedTo: z.string().min(1, "Assign to team member"),
});
type LeadForm = z.infer<typeof leadSchema>;

const TEAM = ["Rohit", "Rohin", "Harpreet"];

export default function PipelinePage() {
  const { data: leads = [] } = usePipeline();
  const { data: clients = [] } = useClients();
  const moveLead = useMoveLead();
  const createLead = useCreateLead();
  const createClient = useCreateClient();
  const [addStage, setAddStage] = useState<PipelineStage | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const pipelineValue = leads.reduce((s, l) => s + l.value, 0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
  });
  const watchedCompany = watch("companyName", "");

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId as PipelineStage;
    try {
      await moveLead.mutateAsync({ id: draggableId, stage: newStage });
    } catch {
      toast.error("Failed to move lead");
    }
  };

  const onAddLead = async (data: LeadForm) => {
    const companyName = data.companyName.trim();
    try {
      await createLead.mutateAsync({ ...data, companyName, stage: addStage! });

      if (addStage === "outreach") {
        const existingClient = clients.find((c) => c.name.trim().toLowerCase() === companyName.toLowerCase());

        if (!existingClient) {
          try {
            await createClient.mutateAsync({
              name: companyName,
              email: data.contactEmail || "",
              package: "Starter",
              monthlyValue: data.value,
              invoiceDay: 1,
            });
            toast.success(`${companyName} added to pipeline and clients`);
          } catch {
            toast.warning("Lead added, but client auto-create failed");
          }
        } else {
          toast.success(`${companyName} added to pipeline`);
        }
      } else {
        toast.success(`${companyName} added to pipeline`);
      }

      setAddStage(null);
      reset();
    } catch {
      toast.error("Failed to add lead");
    }
  };

  return (
    <div className="max-w-full">
      <PageHeader title="Pipeline" subtitle={`£${pipelineValue.toLocaleString("en-GB")} total pipeline value · ${leads.length} leads`} />

      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max">
            {STAGES.map(({ id, label }) => (
              <KanbanColumn
                key={id}
                stage={id}
                label={label}
                leads={leads.filter((l) => l.stage === id)}
                onAddLead={(s) => {
                  setAddStage(s);
                  reset();
                }}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={!!addStage} onOpenChange={(o) => !o && setAddStage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">Add Lead — {STAGES.find((s) => s.id === addStage)?.label}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddLead)} className="space-y-4 mt-2">
            <PField label="Company Name" error={errors.companyName?.message}>
              <>
                <CompanyCombobox
                  clients={clients}
                  value={watchedCompany}
                  onChange={(v) => setValue("companyName", v, { shouldValidate: true })}
                  hasError={!!errors.companyName}
                />
                <p className="mt-1 text-[11px] text-gray-400">Choose an existing client or type a new company name.</p>
              </>
            </PField>
            <div className="grid grid-cols-2 gap-3">
              <PField label="Contact Name" error={errors.contactName?.message}>
                <input {...register("contactName")} className={inp} />
              </PField>
              <PField label="Email (optional)" error={errors.contactEmail?.message}>
                <input {...register("contactEmail")} type="email" className={inp} />
              </PField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PField label="Value (£)" error={errors.value?.message}>
                <input {...register("value", { valueAsNumber: true })} type="number" className={inp} />
              </PField>
              <PField label="Assigned To" error={errors.assignedTo?.message}>
                <select {...register("assignedTo")} className={inp}>
                  <option value="">Select...</option>
                  {TEAM.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </PField>
            </div>
            <PField label="Next Action" error={errors.nextAction?.message}>
              <input {...register("nextAction")} className={inp} placeholder="Send proposal" />
            </PField>
            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] tracking-[0.2em] uppercase font-bold py-3 transition-colors disabled:opacity-50 cursor-pointer">
              {isSubmitting ? "Adding..." : "Add Lead"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="font-black tracking-tight">{selectedLead.companyName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Contact" value={selectedLead.contactName} />
                  <InfoRow label="Value" value={`£${selectedLead.value.toLocaleString("en-GB")}`} />
                  <InfoRow label="Stage" value={selectedLead.stage} />
                  <InfoRow label="Assigned" value={selectedLead.assignedTo} />
                </div>
                <InfoRow label="Next Action" value={selectedLead.nextAction} />
                {selectedLead.contactEmail && <InfoRow label="Email" value={selectedLead.contactEmail} />}
                {selectedLead.notes && <InfoRow label="Notes" value={selectedLead.notes} />}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inp = "w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 bg-white";

/* ── Company combobox ── */
function CompanyCombobox({
  clients,
  value,
  onChange,
  hasError,
}: {
  clients: Client[];
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = clients
    .filter((c) => c.name.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  const exactMatch = clients.some(
    (c) => c.name.toLowerCase() === value.trim().toLowerCase()
  );
  const showNewOption = value.trim().length > 0 && !exactMatch;
  const options = [...filtered, ...(showNewOption ? [null] : [])]; // null = "new" sentinel

  const select = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
      setFocused(0);
    },
    [onChange]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, options.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[focused];
      if (opt === null) { setOpen(false); } // keep typed value
      else if (opt) select(opt.name);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setFocused(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        autoComplete="off"
        placeholder="e.g. Partick Brewing Co."
        className={cn(
          inp,
          hasError && "border-red-400 focus:border-red-600"
        )}
      />

      {open && options.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {filtered.map((client, i) => (
            <button
              key={client.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(client.name); }}
              onMouseEnter={() => setFocused(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors",
                focused === i ? "bg-gray-50" : "hover:bg-gray-50"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Building2 size={12} className="text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                {client.email && (
                  <p className="text-xs text-gray-400 truncate">{client.email}</p>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0",
                client.status === "active"   ? "bg-green-100 text-green-700" :
                client.status === "paused"   ? "bg-yellow-100 text-yellow-700" :
                                               "bg-red-100 text-red-600"
              )}>
                {client.status}
              </span>
              {client.name.toLowerCase() === value.trim().toLowerCase() && (
                <Check size={13} className="text-green-600 shrink-0" />
              )}
            </button>
          ))}

          {showNewOption && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
              onMouseEnter={() => setFocused(filtered.length)}
              className={cn(
                "w-full text-left px-3 py-2.5 border-t border-gray-100 flex items-center gap-3 transition-colors",
                focused === filtered.length ? "bg-gray-50" : "hover:bg-gray-50"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600 font-black text-xs">
                +
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Add <span className="font-bold text-gray-900">"{value.trim()}"</span>
                </p>
                <p className="text-xs text-gray-400">New company — not in client list</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 p-3">
      <p className="text-[10px] tracking-[0.14em] uppercase text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}
