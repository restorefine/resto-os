"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ContractLinkRecord, ContractFormData } from "@/lib/contract";

type W<T> = { data: T; message: string };

async function fetchLinks(): Promise<ContractLinkRecord[]> {
  const res = await api.get<W<ContractLinkRecord[]>>("/api/contracts/links");
  return res.data.data ?? [];
}

async function shareContract(contractData: ContractFormData): Promise<ContractLinkRecord> {
  const res = await api.post<W<ContractLinkRecord>>("/api/contracts/share", { contractData });
  return res.data.data;
}

async function deleteLink(id: string): Promise<void> {
  await api.delete(`/api/contracts/links/${id}`);
}

export function useContractLinks() {
  return useQuery({
    queryKey: ["contract-links"],
    queryFn: fetchLinks,
  });
}

export function useShareContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shareContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-links"] }),
  });
}

export function useDeleteContractLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLink,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-links"] }),
  });
}
