import { z } from "zod";

export const contractSchema = z.object({
  clientId:        z.string().min(1, "Select a client"),
  clientName:      z.string().min(1, "Required"),
  clientCompany:   z.string().min(1, "Required"),
  clientAddress:   z.string().min(1, "Required"),
  clientPhone:     z.string().min(1, "Required"),
  startDate:       z.string().min(1, "Required"),
  videoCount:      z.number().min(1),
  photoCount:      z.number().min(1),
  totalInvestment: z.number().min(1),
  payment1:        z.number().min(1),
  payment2:        z.number().min(1),
  serviceProvider: z.enum(["Harpreet Singh", "Rohit Acharya"]).default("Harpreet Singh"),
});

export type ContractFormData = z.infer<typeof contractSchema>;

export interface ContractSignature {
  dataUrl: string;
  signedAt: string;
}

export interface ContractSignatures {
  client?: ContractSignature;
}

export interface ContractLinkRecord {
  id: string;
  token: string;
  contractData: ContractFormData;
  clientName: string;
  clientCompany: string;
  clientSignature?: string;
  signedAt?: string;
  expiresAt: string;
  createdAt: string;
  status: "pending" | "signed" | "expired";
}
