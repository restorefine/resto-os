"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Client } from "@/lib/types";
import { MOCK_CLIENTS } from "@/lib/mock-data";

type W<T> = { data: T; message: string };


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.contact_email ?? r.email ?? "",
    phone: r.contact_phone ?? r.phone,
    package: r.package,
    monthlyValue: r.monthly_value ?? r.monthlyValue ?? 0,
    status: r.status ?? "active",
    invoiceDay: r.invoice_day ?? r.invoiceDay ?? 1,
    assignedTo: r.assigned_to ?? r.assignedTo ?? "",
    portalActive: !!(r.portal_activated_at ?? r.portalActive),
    onboardingProgress: r.onboarding_progress ?? r.onboardingProgress ?? 0,
    monthlyProgress: r.monthly_progress ?? r.monthlyProgress ?? 0,
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
}

async function fetchClients(): Promise<Client[]> {
  const res = await api.get("/api/clients");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  const list: unknown[] = d?.data?.clients ?? (Array.isArray(d?.data) ? d.data : []);
  console.log("[useClients] GET /api/clients →", list.length, "clients");
  return list.map(mapClient);
}

async function createClient(payload: Partial<Client>): Promise<Client> {
  const body = {
    name: payload.name,
    contact_email: payload.email,
    contact_phone: payload.phone,
    package: payload.package,
    monthly_value: payload.monthlyValue,
    invoice_day: payload.invoiceDay,
    assigned_to: payload.assignedTo,   // account manager — stored as TEXT after migration 012
  };
  console.log("[useClients] POST body:", body);
  const res = await api.post("/api/clients", body);
  console.log("[useClients] POST response:", res.status, res.data);

  // Backend may return { data: { client: {...} } } or { data: clientObj } directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  const raw = d?.data?.client ?? d?.data ?? d;
  console.log("[useClients] raw client extracted:", raw);

  if (raw?.id) return mapClient(raw);

  // 201 succeeded but unexpected shape — return stub so onSuccess fires and
  // invalidateQueries refetches the real list
  console.warn("[useClients] unexpected response shape, using form-data stub");
  return {
    id: raw?.id ?? crypto.randomUUID(),
    name: payload.name ?? "",
    email: payload.email ?? "",
    phone: payload.phone,
    package: payload.package ?? "",
    monthlyValue: payload.monthlyValue ?? 0,
    status: "active",
    invoiceDay: payload.invoiceDay ?? 1,
    assignedTo: payload.assignedTo ?? "",
    portalActive: false,
    onboardingProgress: 0,
    monthlyProgress: 0,
    createdAt: new Date().toISOString(),
  };
}

async function updateClient(id: string, payload: Partial<Client>): Promise<Client> {
  const res = await api.patch("/api/clients/" + id, payload);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = res.data as any;
  const raw = d?.data?.client ?? d?.data ?? d;
  return mapClient(raw);
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
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Client> }) => updateClient(id, payload),
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
