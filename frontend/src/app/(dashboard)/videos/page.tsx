"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Play, Plus } from "lucide-react";

function getDriveFileId(url: string): string | null {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function hasDriveLink(url?: string): boolean {
  return !!url && url !== "" && url !== "#";
}
import { PageHeader } from "@/components/layout/PageHeader";
import { useVideos } from "@/hooks/useVideos";
import { VideoProductionStage, VideoStatus } from "@/lib/types";
import { MOCK_VIDEO_COMMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { CreateVideoTaskModal } from "@/components/videos/CreateVideoTaskModal";

const STAGES: VideoProductionStage[] = [
  "scripting",
  "filming",
  "editing",
  "review",
  "approved",
];

const STAGE_IDX: Record<VideoProductionStage, number> = {
  scripting: 0,
  filming: 1,
  editing: 2,
  review: 3,
  approved: 4,
};

const STAGE_DISPLAY: Record<VideoProductionStage, string> = {
  scripting: "Pre-Production",
  filming: "Production",
  editing: "Post-Production",
  review: "Client Review",
  approved: "Approved",
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

const MEMBER_COLOR: Record<string, string> = {
  Rohit: "bg-red-600",
  Rohin: "bg-blue-600",
  Harpreet: "bg-emerald-600",
  Kreshina: "bg-purple-600",
  Arpan: "bg-orange-500",
};

// Users who can create video tasks
const VIDEO_CREATORS = ["rohit", "rohin", "harpreet", "kreshina"];

function canCreateVideoTask(name?: string): boolean {
  if (!name) return false;
  return VIDEO_CREATORS.includes(name.trim().split(" ")[0].toLowerCase());
}

function getDueLabel(dueDate: string): string {
  if (!dueDate) return "";
  const dueMidnight = new Date(dueDate);
  dueMidnight.setHours(0, 0, 0, 0);
  const nowMidnight = new Date();
  nowMidnight.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (dueMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff === -1) return "1 day overdue";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

type FilterOption = VideoProductionStage | "all";

export default function VideosPage() {
  const router = useRouter();
  const { data: videos = [] } = useVideos();
  const { currentUser } = useStore();
  const [filter, setFilter] = useState<FilterOption>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const showCreate = canCreateVideoTask(currentUser?.name);

  const filtered =
    filter === "all" ? videos : videos.filter((v) => v.productionStage === filter);

  // Group videos by client
  const clientGroups = filtered.reduce<
    Record<string, { clientName: string; videos: typeof filtered }>
  >((acc, v) => {
    if (!acc[v.clientId]) {
      acc[v.clientId] = { clientName: v.clientName, videos: [] };
    }
    acc[v.clientId].videos.push(v);
    return acc;
  }, {});

  const pendingCount = videos.filter((v) => v.status === "pending").length;
  const reviewCount = videos.filter((v) => v.productionStage === "review").length;

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Video Production"
          subtitle={`${pendingCount} pending · ${reviewCount} in review · ${videos.length} total`}
        />
        {showCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors cursor-pointer shrink-0 mt-1"
          >
            <Plus size={15} />
            Create Video Task
          </button>
        )}
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {(["all", ...STAGES] as FilterOption[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer capitalize",
              filter === s
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <Film size={32} className="text-gray-200" />
          <p className="text-sm text-gray-400">No videos match your filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(clientGroups).map(([clientId, group]) => (
            <div key={clientId}>
              <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                {group.clientName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.videos.map((v) => {
                  const stageIdx = STAGE_IDX[v.productionStage];
                  const pct = Math.round((stageIdx / (STAGES.length - 1)) * 100);
                  const dueLabel = getDueLabel(v.dueDate);
                  const awaitingAssets = !hasDriveLink(v.videoUrl);
                  const driveFileId = hasDriveLink(v.videoUrl) ? getDriveFileId(v.videoUrl) : null;
                  const comments = MOCK_VIDEO_COMMENTS[v.id] ?? [];
                  const teamAuthors = [
                    ...new Set(
                      comments.filter((c) => c.role === "team").map((c) => c.author)
                    ),
                  ].slice(0, 3);

                  const barColor =
                    v.status === "approved"
                      ? "bg-green-500"
                      : pct === 0
                      ? "bg-gray-900"
                      : "bg-red-600";

                  const dueColor = dueLabel.includes("overdue")
                    ? "text-red-600"
                    : dueLabel === "Due today" || dueLabel === "Due tomorrow"
                    ? "text-orange-500"
                    : "text-gray-700";

                  return (
                    <div
                      key={v.id}
                      onClick={() => router.push(`/videos/${v.id}`)}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group flex flex-col"
                    >
                      {/* Top: client badge + title */}
                      <div className="px-5 pt-5 pb-4">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium mb-2.5">
                          {v.clientName}
                        </span>
                        <h3 className="text-[17px] font-bold text-gray-950 leading-snug line-clamp-2">
                          {v.title}
                        </h3>
                      </div>

                      {/* Thumbnail */}
                      <div className="px-5 pb-5">
                        {awaitingAssets ? (
                          <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 flex items-center justify-center">
                            <span className="text-sm text-gray-400 font-medium">
                              Awaiting Assets
                            </span>
                          </div>
                        ) : driveFileId ? (
                          <div className="aspect-video rounded-xl overflow-hidden relative">
                            <img
                              src={`https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400`}
                              alt={v.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <Play size={17} className="text-white ml-0.5" fill="white" />
                              </div>
                            </div>
                            <span className="absolute top-3 right-3 text-[10px] font-semibold text-white/80 uppercase tracking-wide">
                              {PLATFORM_LABEL[v.platform] ?? v.platform}
                            </span>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-xl bg-gray-900 flex items-center justify-center relative overflow-hidden group-hover:bg-gray-800 transition-colors">
                            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                              <Play
                                size={17}
                                className="text-white ml-0.5"
                                fill="white"
                              />
                            </div>
                            <span className="absolute top-3 right-3 text-[10px] font-semibold text-white/50 uppercase tracking-wide">
                              {PLATFORM_LABEL[v.platform] ?? v.platform}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress section */}
                      <div className="px-5 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {STAGE_DISPLAY[v.productionStage]}
                          </span>
                          <span className="text-sm font-black text-gray-900 tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-[10px] bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              barColor
                            )}
                            style={{ width: `${Math.max(pct, pct === 0 ? 0 : 3)}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: avatars + due date */}
                      <div className="px-5 pb-5 mt-auto flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {teamAuthors.length === 0 ? (
                            <>
                              <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white" />
                              <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white" />
                            </>
                          ) : (
                            teamAuthors.map((name) => (
                              <div
                                key={name}
                                title={name}
                                className={cn(
                                  "w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white",
                                  MEMBER_COLOR[name] ?? "bg-gray-600"
                                )}
                              >
                                {name[0]}
                              </div>
                            ))
                          )}
                        </div>
                        {dueLabel && (
                          <span className={cn("text-sm font-bold", dueColor)}>
                            {dueLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateVideoTaskModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
