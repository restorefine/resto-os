"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Invoice } from "@/lib/types";
import { MOCK_INVOICES } from "@/lib/mock-data";

async function fetchInvoices(): Promise<Invoice[]> {
  const { data } = await api.get<{ invoices: Invoice[] }>("/api/invoices");
  return data.invoices;
}

async function markPaid(id: string): Promise<Invoice> {
  const { data } = await api.post<{ invoice: Invoice }>(`/api/invoices/${id}/mark-paid`);
  return data.invoice;
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
