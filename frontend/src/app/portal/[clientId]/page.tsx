"use client";

import { use } from "react";
import Link from "next/link";
import { FileText, Receipt, Video, Calendar, LogOut } from "lucide-react";
import { useStore } from "@/store/useStore";
import { MOCK_CLIENTS, MOCK_INVOICES, MOCK_VIDEOS, MOCK_CONTENT_ITEMS } from "@/lib/mock-data";

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const { currentUser, setCurrentUser } = useStore();

  const client = MOCK_CLIENTS.find((c) => c.id === clientId);
  const invoices = MOCK_INVOICES.filter((i) => i.clientId === clientId);
  const videos = MOCK_VIDEOS.filter((v) => v.clientId === clientId);
  const content = MOCK_CONTENT_ITEMS.filter((i) => i.clientId === clientId);

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");
  const pendingVideos = videos.filter((v) => v.status === "pending");

  const name = currentUser?.name ?? client?.name ?? "Client";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Portal header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans">
            RestoRefine Studios
          </p>
          <p className="text-sm font-black text-black tracking-tight">
            CLIENT PORTAL
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentUser(null);
            window.location.href = "/portal/login";
          }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <LogOut size={13} /> Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-1">Welcome back</p>
          <h1 className="text-3xl font-black tracking-tight text-black">
            {name.split(" ")[0]}<span className="text-red-600">.</span>
          </h1>
          {client && (
            <p className="text-sm text-gray-500 mt-0.5">{client.package} · RestoRefine Studios</p>
          )}
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-4">
          <PortalCard
            icon={<FileText size={16} />}
            label="Contract"
            value={client?.contractUrl ? "Signed" : "Pending"}
            status={client?.contractUrl ? "ok" : "warn"}
            href={`/portal/${clientId}/contract`}
          />
          <PortalCard
            icon={<Receipt size={16} />}
            label="Invoices"
            value={unpaidInvoices.length > 0 ? `${unpaidInvoices.length} unpaid` : "All paid"}
            status={unpaidInvoices.length > 0 ? "warn" : "ok"}
            href={`/portal/${clientId}/invoices`}
          />
          <PortalCard
            icon={<Video size={16} />}
            label="Videos"
            value={pendingVideos.length > 0 ? `${pendingVideos.length} awaiting` : "Up to date"}
            status={pendingVideos.length > 0 ? "action" : "ok"}
            href={`/portal/${clientId}/videos`}
          />
          <PortalCard
            icon={<Calendar size={16} />}
            label="Content This Week"
            value={`${content.length} item${content.length !== 1 ? "s" : ""} scheduled`}
            status="ok"
            href={`/portal/${clientId}/content`}
          />
        </div>

        {/* Nav */}
        <div className="border border-gray-200 divide-y divide-gray-100">
          {[
            { href: `/portal/${clientId}/contract`, label: "Contract", sub: "View your signed agreement" },
            { href: `/portal/${clientId}/invoices`, label: "Invoices", sub: `${invoices.length} total · ${unpaidInvoices.length} unpaid` },
            { href: `/portal/${clientId}/videos`, label: "Video Approvals", sub: `${pendingVideos.length} pending your review` },
            { href: `/portal/${clientId}/content`, label: "Content Calendar", sub: `${content.length} items this month` },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
              <span className="text-gray-300 text-lg">→</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300">
          RestoRefine Studios · 24 Fairley Street, Glasgow · 0141 266 0065
        </p>
      </main>
    </div>
  );
}

function PortalCard({
  icon,
  label,
  value,
  status,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "ok" | "warn" | "action";
  href: string;
}) {
  const statusColor = { ok: "text-green-600", warn: "text-yellow-600", action: "text-red-600" }[status];
  return (
    <Link href={href} className="border border-gray-200 bg-white p-4 hover:border-gray-400 transition-colors block">
      <div className="flex items-center gap-2 mb-2 text-gray-400">{icon}
        <p className="text-[10px] tracking-[0.14em] uppercase text-gray-400 font-bold">{label}</p>
      </div>
      <p className={`text-sm font-bold ${statusColor}`}>{value}</p>
    </Link>
  );
}
