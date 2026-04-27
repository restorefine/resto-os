"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { MOCK_VIDEOS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  edit_requested: "bg-red-100 text-red-800",
};

export default function PortalVideosPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const videos = MOCK_VIDEOS.filter((v) => v.clientId === clientId);
  const [approvedIds, setApprovedIds] = useState<string[]>(
    videos.filter((v) => v.status === "approved").map((v) => v.id)
  );

  const handleApprove = (id: string, title: string) => {
    setApprovedIds((prev) => [...prev, id]);
    toast.success(`${title} approved`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href={`/portal/${clientId}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={13} /> Back
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 mb-1">Portal</p>
        <h1 className="text-2xl font-black tracking-tight text-black mb-5">Video Approvals</h1>
        <div className="space-y-3">
          {videos.length === 0 && (
            <div className="border border-gray-200 bg-white p-6 text-sm text-gray-400 text-center">
              No videos to review.
            </div>
          )}
          {videos.map((v) => {
            const approved = approvedIds.includes(v.id);
            return (
              <div key={v.id} className="border border-gray-200 bg-white p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{v.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{v.platform} · Due {new Date(v.dueDate).toLocaleDateString("en-GB")}</p>
                  {v.feedback && (
                    <p className="text-xs text-red-600 mt-1">Edit requested: {v.feedback}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                    <Play size={16} />
                  </a>
                  {!approved && v.status === "pending" ? (
                    <button
                      onClick={() => handleApprove(v.id, v.title)}
                      className="text-[10px] tracking-[0.14em] uppercase font-bold text-green-600 hover:text-green-800 transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className={cn("inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", STATUS[approved ? "approved" : v.status])}>
                      {approved ? "approved" : v.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
