"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Lead, PipelineStage } from "@/lib/types";
import { MOCK_LEADS } from "@/lib/mock-data";

async function fetchLeads(): Promise<Lead[]> {
  const { data } = await api.get<{ leads: Lead[] }>("/api/pipeline");
  return data.leads;
}

async function createLead(payload: Partial<Lead>): Promise<Lead> {
  const { data } = await api.post<{ lead: Lead }>("/api/pipeline", payload);
  return data.lead;
}

async function moveLead(id: string, stage: PipelineStage): Promise<Lead> {
  const { data } = await api.patch<{ lead: Lead }>(`/api/pipeline/${id}/stage`, { stage });
  return data.lead;
}

async function updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
  const { data } = await api.put<{ lead: Lead }>(`/api/pipeline/${id}`, payload);
  return data.lead;
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
