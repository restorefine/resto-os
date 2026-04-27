"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck, Download } from "lucide-react";
import { MOCK_CLIENTS, MOCK_CONTRACTS } from "@/lib/mock-data";

export default function PortalContractPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId);
  const contract = MOCK_CONTRACTS.find((c) => c.clientId === clientId);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href={`/portal/${clientId}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={13} /> Back to overview
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">Contract</p>
        <h1 className="text-2xl font-black tracking-tight text-black mb-6">
          Service Agreement
        </h1>
        {contract ? (
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileCheck size={20} className="text-green-600" />
              <p className="text-sm font-bold text-green-700">Contract signed</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[
                { label: "Client", value: client?.name ?? "—" },
                { label: "Package", value: contract.package },
                { label: "Start Date", value: new Date(contract.startDate).toLocaleDateString("en-GB") },
                { label: "Duration", value: `${contract.duration} months` },
              ].map((row) => (
                <div key={row.label} className="border border-gray-100 p-3">
                  <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-0.5">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{row.value}</p>
                </div>
              ))}
            </div>
            {contract.fileUrl && (
              <a
                href={contract.fileUrl}
                className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-800 transition-colors mt-2"
              >
                <Download size={14} /> Download PDF
              </a>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 bg-white p-6 text-sm text-gray-400">
            No contract on file. Please contact RestoRefine Studios.
          </div>
        )}
      </main>
    </div>
  );
}
