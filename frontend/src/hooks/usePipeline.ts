"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Lead, PipelineStage } from "@/lib/types";
import { MOCK_LEADS } from "@/lib/mock-data";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLead(r: any): Lead {
  return {
    id: r.id,
    companyName: r.company_name ?? r.companyName ?? "",
    contactName: r.contact_name ?? r.contactName ?? "",
    contactEmail: r.contact_email ?? r.contactEmail,
    value: r.value ?? 0,
    stage: r.stage ?? "outreach",
    nextAction: r.next_action ?? r.nextAction ?? "",
    assignedTo: r.assigned_to ?? r.assignedTo ?? "",
    notes: r.notes,
    createdAt: r.created_at ?? r.createdAt ?? "",
    updatedAt: r.updated_at ?? r.updatedAt ?? "",
  };
}

async function fetchLeads(): Promise<Lead[]> {
  const res = await api.get("/api/pipeline");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  // handles { data: { leads: [] } } AND { data: [] } (direct array)
  const list: unknown[] =
    d?.data?.leads ?? (Array.isArray(d?.data) ? d.data : []);
  console.log("[usePipeline] GET →", list.length, "leads");
  return list.map(mapLead);
}

async function createLead(payload: Partial<Lead>): Promise<Lead> {
  const body = {
    company_name: payload.companyName,
    contact_name: payload.contactName,
    contact_email: payload.contactEmail,
    value: payload.value,
    stage: payload.stage,
    next_action: payload.nextAction,
    assigned_to: payload.assignedTo,  // stored as TEXT after migration 012
    notes: payload.notes,
  };
  const res = await api.post("/api/pipeline", body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return mapLead(d?.data?.lead ?? d?.data ?? d);
}

async function moveLead(id: string, stage: PipelineStage): Promise<Lead> {
  // backend route is PATCH /{id}/move  (not /stage)
  const res = await api.patch(`/api/pipeline/${id}/move`, { stage });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return mapLead(d?.data?.lead ?? d?.data ?? d);
}

async function updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
  // backend registers PATCH /{id}  (not PUT)
  const res = await api.patch(`/api/pipeline/${id}`, payload);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  return mapLead(d?.data?.lead ?? d?.data ?? d);
}

export function usePipeline() {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: fetchLeads,
    initialData: MOCK_LEADS,
    initialDataUpdatedAt: 0,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useMoveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      moveLead(id, stage),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["pipeline"] });
      const prev = qc.getQueryData<Lead[]>(["pipeline"]);
      qc.setQueryData<Lead[]>(["pipeline"], (old) =>
        old?.map((l) => (l.id === id ? { ...l, stage } : l))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["pipeline"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Lead> }) =>
      updateLead(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}
