"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { DropResult } from "@hello-pangea/dnd";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePipeline, useMoveLead, useCreateLead } from "@/hooks/usePipeline";
import { Lead, PipelineStage } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const DragDropContext = dynamic(
  () => import("@hello-pangea/dnd").then((m) => m.DragDropContext),
  { ssr: false }
);
const KanbanColumn = dynamic(
  () => import("@/components/pipeline/KanbanColumn").then((m) => m.KanbanColumn),
  { ssr: false }
);

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
  const moveLead = useMoveLead();
  const createLead = useCreateLead();
  const [mounted, setMounted] = useState(false);
  const [addStage, setAddStage] = useState<PipelineStage | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => setMounted(true), []);

  const pipelineValue = leads.reduce((s, l) => s + l.value, 0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
  });

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
    try {
      await createLead.mutateAsync({ ...data, stage: addStage! });
      toast.success(`${data.companyName} added to pipeline`);
      setAddStage(null);
      reset();
    } catch {
      toast.error("Failed to add lead");
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-full">
      <PageHeader
        title="Pipeline"
        subtitle={`£${pipelineValue.toLocaleString("en-GB")} total pipeline value · ${leads.length} leads`}
      />

      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max">
            {STAGES.map(({ id, label }) => (
              <KanbanColumn
                key={id}
                stage={id}
                label={label}
                leads={leads.filter((l) => l.stage === id)}
                onAddLead={(s) => { setAddStage(s); reset(); }}
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
            <DialogTitle className="font-black tracking-tight">
              Add Lead — {STAGES.find((s) => s.id === addStage)?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddLead)} className="space-y-4 mt-2">
            <PField label="Company Name" error={errors.companyName?.message}>
              <input {...register("companyName")} className={inp} placeholder="Partick Brewing Co." />
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
                  {TEAM.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </PField>
            </div>
            <PField label="Next Action" error={errors.nextAction?.message}>
              <input {...register("nextAction")} className={inp} placeholder="Send proposal" />
            </PField>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] tracking-[0.2em] uppercase font-bold py-3 transition-colors disabled:opacity-50 cursor-pointer"
            >
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
                <DialogTitle className="font-black tracking-tight">
                  {selectedLead.companyName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Contact" value={selectedLead.contactName} />
                  <InfoRow label="Value" value={`£${selectedLead.value.toLocaleString("en-GB")}`} />
                  <InfoRow label="Stage" value={selectedLead.stage} />
                  <InfoRow label="Assigned" value={selectedLead.assignedTo} />
                </div>
                <InfoRow label="Next Action" value={selectedLead.nextAction} />
                {selectedLead.contactEmail && (
                  <InfoRow label="Email" value={selectedLead.contactEmail} />
                )}
                {selectedLead.notes && (
                  <InfoRow label="Notes" value={selectedLead.notes} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inp = "w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 bg-white";

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
