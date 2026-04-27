"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInvoices, useMarkPaid } from "@/hooks/useInvoices";
import { Invoice, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, CheckCircle } from "lucide-react";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

type SortField = "dueDate" | "amount" | "clientName";

export default function InvoicesPage() {
  const { data: invoices = [] } = useInvoices();
  const markPaid = useMarkPaid();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" }>({ field: "dueDate", dir: "asc" });

  const filtered = useMemo(() => {
    let list = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sort.field === "dueDate") cmp = a.dueDate.localeCompare(b.dueDate);
      if (sort.field === "amount") cmp = a.amount - b.amount;
      if (sort.field === "clientName") cmp = a.clientName.localeCompare(b.clientName);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [invoices, statusFilter, sort]);

  const unpaidTotal = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const toggleSort = (field: SortField) =>
    setSort((s) => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await markPaid.mutateAsync(inv.id);
      toast.success(`${inv.reference} marked as paid`);
    } catch {
      toast.error("Failed to update invoice");
    }
  };

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        title="Invoices"
        subtitle={unpaidTotal > 0 ? `£${unpaidTotal.toLocaleString("en-GB")} outstanding${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}` : "All invoices up to date"}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Outstanding", value: `£${invoices.filter(i => i.status !== "paid").reduce((s,i) => s+i.amount,0).toLocaleString("en-GB")}`, color: "text-red-600" },
          { label: "Overdue", value: invoices.filter(i => i.status === "overdue").length.toString(), color: "text-red-600" },
          { label: "Paid This Month", value: invoices.filter(i => i.status === "paid").length.toString(), color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "unpaid", "overdue", "paid"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors capitalize cursor-pointer",
              statusFilter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <Th label="Reference" />
              <Th label="Client" field="clientName" sort={sort} onSort={toggleSort} />
              <Th label="Amount" field="amount" sort={sort} onSort={toggleSort} />
              <Th label="Due Date" field="dueDate" sort={sort} onSort={toggleSort} />
              <Th label="Status" />
              <Th label="" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <tr key={inv.id} className={cn("hover:bg-gray-50 transition-colors group", inv.status === "overdue" && "bg-red-50/30")}>
                <td className="px-5 py-4 font-mono text-xs text-gray-500">{inv.reference}</td>
                <td className="px-5 py-4 font-semibold text-gray-900">{inv.clientName}</td>
                <td className="px-5 py-4 font-mono font-bold text-gray-900">£{inv.amount.toLocaleString("en-GB")}</td>
                <td className="px-5 py-4 text-gray-600">{new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-5 py-4">
                  <span className={cn("inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full", STATUS_STYLES[inv.status])}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {inv.status !== "paid" && (
                    <button
                      onClick={() => handleMarkPaid(inv)}
                      disabled={markPaid.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-green-700 transition-colors disabled:opacity-50 cursor-pointer ml-auto group-hover:opacity-100"
                    >
                      <CheckCircle size={14} />
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">
                  No invoices match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label, field, sort, onSort }: {
  label: string; field?: SortField;
  sort?: { field: SortField; dir: "asc" | "desc" };
  onSort?: (f: SortField) => void;
}) {
  const active = sort?.field === field;
  return (
    <th onClick={() => field && onSort?.(field)}
      className={cn("px-5 py-3 text-left text-[11px] tracking-widest uppercase text-gray-400 font-semibold select-none", field && "cursor-pointer hover:text-gray-700")}>
      <span className="flex items-center gap-1">
        {label}
        {active && sort?.dir === "asc" && <ChevronUp size={11} />}
        {active && sort?.dir === "desc" && <ChevronDown size={11} />}
      </span>
    </th>
  );
}
