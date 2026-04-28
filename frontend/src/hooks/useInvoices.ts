"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "@/lib/types";
import { MOCK_INVOICES } from "@/lib/mock-data";

type W<T> = { data: T; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(r: any): Invoice {
  return {
    id: r.id,
    reference: r.reference ?? "",
    clientId: r.client_id ?? r.clientId ?? "",
    clientName: r.client_name ?? r.clientName ?? "",
    amount: r.amount ?? 0,
    dueDate: r.due_date ?? r.dueDate ?? "",
    status: r.status ?? "unpaid",
    paidAt: r.paid_at ?? r.paidAt,
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
}

async function fetchInvoices(): Promise<Invoice[]> {
  const { data } = await api.get<W<{ invoices: unknown[] }>>("/api/invoices");
  return (data.data.invoices ?? []).map(mapInvoice);
}

async function markPaid(id: string): Promise<Invoice> {
  const { data } = await api.post<W<{ invoice: unknown }>>(`/api/invoices/${id}/mark-paid`);
  return mapInvoice(data.data.invoice);
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
    initialData: MOCK_INVOICES,
    initialDataUpdatedAt: 0,
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markPaid,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["invoices"] });
      const prev = qc.getQueryData<Invoice[]>(["invoices"]);
      qc.setQueryData<Invoice[]>(["invoices"], (old) =>
        old?.map((inv) =>
          inv.id === id
            ? { ...inv, status: "paid", paidAt: new Date().toISOString() }
            : inv
        )
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["invoices"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
