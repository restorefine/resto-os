"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients } from "@/hooks/useClients";
import { MOCK_CONTRACTS } from "@/lib/mock-data";
import { Contract } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Download } from "lucide-react";

const PACKAGES = ["Starter", "Social Growth", "Brand Builder", "Enterprise"];

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  package: z.string().min(1, "Select a package"),
  startDate: z.string().min(1, "Start date required"),
  duration: z.number().min(1, "Duration required"),
  specialTerms: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContractsPage() {
  const { data: clients = [] } = useClients();
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 12 },
  });

  const watchClientId = watch("clientId");
  const selectedClient = clients.find((c) => c.id === watchClientId);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const newContract: Contract = {
        id: `con${Date.now()}`,
        clientId: data.clientId,
        clientName: selectedClient?.name ?? "",
        package: data.package,
        startDate: data.startDate,
        duration: data.duration,
        specialTerms: data.specialTerms,
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      // await api.post("/api/contracts", data);
      setContracts((prev) => [newContract, ...prev]);
      toast.success("Contract generated successfully");
      reset({ duration: 12 });
    } catch {
      toast.error("Failed to generate contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title="Contracts" subtitle="Generate client contracts" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="border border-gray-200 p-5 space-y-4">
              <CField label="Client" error={errors.clientId?.message}>
                <select {...register("clientId")} className={inp}>
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </CField>

              {selectedClient && (
                <div className="bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 space-y-0.5">
                  <p><strong>Email:</strong> {selectedClient.email}</p>
                  {selectedClient.phone && <p><strong>Phone:</strong> {selectedClient.phone}</p>}
                </div>
              )}

              <CField label="Package" error={errors.package?.message}>
                <select {...register("package")} className={inp}>
                  <option value="">Select package...</option>
                  {PACKAGES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </CField>

              <div className="grid grid-cols-2 gap-4">
                <CField label="Start Date" error={errors.startDate?.message}>
                  <input {...register("startDate")} type="date" className={inp} />
                </CField>
                <CField label="Duration (months)" error={errors.duration?.message}>
                  <input {...register("duration", { valueAsNumber: true })} type="number" className={inp} />
                </CField>
              </div>

              <CField label="Special Terms (optional)" error={errors.specialTerms?.message}>
                <textarea
                  {...register("specialTerms")}
                  rows={3}
                  placeholder="Any additional terms or conditions..."
                  className={`${inp} resize-none`}
                />
              </CField>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] tracking-[0.22em] uppercase font-bold py-4 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Generating..." : "Generate Contract"}
            </button>
          </form>
        </div>

        {/* History */}
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase text-gray-500 font-bold mb-3">
            Contract History
          </p>
          <div className="border border-gray-200 divide-y divide-gray-100">
            {contracts.map((c) => (
              <div key={c.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.clientName}</p>
                    <p className="text-xs text-gray-500">{c.package} · {c.duration}mo</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      From {new Date(c.startDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5",
                      c.status === "signed" ? "bg-green-100 text-green-800" :
                      c.status === "sent" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-600"
                    )}>{c.status}</span>
                    {c.fileUrl && (
                      <a href={c.fileUrl} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <Download size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 bg-white";

function CField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.16em] uppercase text-gray-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
