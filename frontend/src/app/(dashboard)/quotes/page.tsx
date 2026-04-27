"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients } from "@/hooks/useClients";
import { MOCK_QUOTES } from "@/lib/mock-data";
import { Quote } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
  validDays: z.number().min(1),
});

type FormData = z.infer<typeof schema>;

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuotesPage() {
  const { data: clients = [] } = useClients();
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ description: "", quantity: 1, unitPrice: 0 }], validDays: 30, clientId: "" },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");
  const watchClientId = watch("clientId");

  const subtotal = useMemo(
    () => watchItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0),
    [watchItems]
  );
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  const selectedClient = clients.find((c) => c.id === watchClientId);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const ref = `QUO-${new Date().getFullYear()}-${String(quotes.length + 19).padStart(3, "0")}`;
      const newQuote: Quote = {
        id: `q${Date.now()}`,
        reference: ref,
        clientId: data.clientId,
        clientName: selectedClient?.name ?? "",
        items: data.items,
        subtotal,
        vat,
        total,
        validUntil: new Date(Date.now() + data.validDays * 86400000).toISOString().split("T")[0],
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      // await api.post("/api/quotes", { ...data, subtotal, vat, total, reference: ref });
      setQuotes((prev) => [newQuote, ...prev]);
      toast.success(`Quote ${ref} created`);
      reset({ items: [{ description: "", quantity: 1, unitPrice: 0 }], validDays: 30 });
    } catch {
      toast.error("Failed to generate quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title="Quote Builder" subtitle="Generate client quotations" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="border border-gray-200 p-5 space-y-4">
              <QField label="Client" error={errors.clientId?.message}>
                <select {...register("clientId")} className={inp}>
                  <option value="">Select client...</option>
                  {clients.filter(c => c.status === "active").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </QField>

              <QField label="Validity (days)" error={errors.validDays?.message}>
                <input {...register("validDays", { valueAsNumber: true })} type="number" className={`${inp} w-32`} />
              </QField>
            </div>

            {/* Line items */}
            <div className="border border-gray-200 p-5 space-y-3">
              <p className="text-[10px] tracking-[0.16em] uppercase text-gray-500 font-bold mb-3">
                Deliverables
              </p>

              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-start">
                  <div>
                    <input
                      {...register(`items.${i}.description`)}
                      placeholder="Description"
                      className={inp}
                    />
                  </div>
                  <input
                    {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                    type="number"
                    placeholder="Qty"
                    className={inp}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">£</span>
                    <input
                      {...register(`items.${i}.unitPrice`, { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      className={`${inp} pl-6`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    className="p-1.5 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-20 cursor-pointer mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Plus size={12} /> Add line item
              </button>
            </div>

            {/* Totals */}
            <div className="border border-gray-200 p-5 space-y-2">
              <TotalRow label="Subtotal" value={fmt(subtotal)} />
              <TotalRow label="VAT (20%)" value={fmt(vat)} />
              <div className="pt-2 border-t border-gray-200">
                <TotalRow label="Total" value={fmt(total)} bold />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-[11px] tracking-[0.22em] uppercase font-bold py-4 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Generating..." : "Generate Quote"}
            </button>
          </form>
        </div>

        {/* History */}
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase text-gray-500 font-bold mb-3">
            Quote History
          </p>
          <div className="border border-gray-200 divide-y divide-gray-100">
            {quotes.map((q) => (
              <div key={q.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-gray-600">{q.reference}</p>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5",
                    q.status === "accepted" ? "bg-green-100 text-green-800" :
                    q.status === "sent" ? "bg-blue-100 text-blue-800" :
                    q.status === "declined" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-600"
                  )}>{q.status}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.clientName}</p>
                <p className="text-sm font-black text-black font-mono">{fmt(q.total)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Valid until {new Date(q.validUntil).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 bg-white";

function QField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.16em] uppercase text-gray-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <p className={cn("text-sm", bold ? "font-black text-black" : "text-gray-600")}>{label}</p>
      <p className={cn("font-mono", bold ? "text-lg font-black text-black" : "text-sm text-gray-900")}>{value}</p>
    </div>
  );
}
