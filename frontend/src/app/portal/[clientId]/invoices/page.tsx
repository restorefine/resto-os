"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MOCK_INVOICES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

export default function PortalInvoicesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const invoices = MOCK_INVOICES.filter((i) => i.clientId === clientId);
  const unpaidTotal = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href={`/portal/${clientId}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={13} /> Back
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">Portal</p>
        <h1 className="text-2xl font-black tracking-tight text-black mb-1">Invoices</h1>
        {unpaidTotal > 0 && (
          <p className="text-sm text-red-600 font-semibold mb-5">
            £{unpaidTotal.toLocaleString("en-GB")} outstanding
          </p>
        )}
        <div className="border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Reference", "Amount", "Due Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-[0.14em] uppercase text-gray-500 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No invoices.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{inv.reference}</td>
                  <td className="px-4 py-3 font-mono font-semibold">£{inv.amount.toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(inv.dueDate).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", STATUS[inv.status])}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
