"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MOCK_CONTENT_ITEMS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  post: "bg-blue-100 text-blue-800",
  reel: "bg-purple-100 text-purple-800",
  shoot: "bg-orange-100 text-orange-800",
  upload: "bg-gray-100 text-gray-800",
};

export default function PortalContentPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const items = MOCK_CONTENT_ITEMS.filter((i) => i.clientId === clientId);
  const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href={`/portal/${clientId}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={13} /> Back
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">Portal</p>
        <h1 className="text-2xl font-black tracking-tight text-black mb-5">Content Calendar</h1>
        <div className="space-y-2">
          {sorted.length === 0 && (
            <div className="border border-gray-200 bg-white p-6 text-sm text-gray-400 text-center">
              No content scheduled.
            </div>
          )}
          {sorted.map((item) => (
            <div key={item.id} className="border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-xs text-gray-500">
                  {new Date(item.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
                <span className={cn("inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", TYPE_COLORS[item.type])}>
                  {item.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
