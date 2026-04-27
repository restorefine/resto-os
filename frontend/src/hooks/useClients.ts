"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Client } from "@/lib/types";
import { MOCK_CLIENTS } from "@/lib/mock-data";

async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<{ clients: Client[] }>("/api/clients");
  return data.clients;
}

async function createClient(payload: Partial<Client>): Promise<Client> {
  const { data } = await api.post<{ client: Client }>("/api/clients", payload);
  return data.client;
}

async function updateClient(id: string, payload: Partial<Client>): Promise<Client> {
  const { data } = await api.put<{ client: Client }>(`/api/clients/${id}`, payload);
  return data.client;
}

async function activatePortal(clientId: string): Promise<void> {
  await api.post(`/api/clients/${clientId}/activate-portal`);
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    initialData: MOCK_CLIENTS,
    initialDataUpdatedAt: 0,
  });
}

export function useClient(id: string) {
  const { data: clients } = useClients();
  return clients?.find((c) => c.id === id) ?? null;
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Client> }) =>
      updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useActivatePortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activatePortal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
