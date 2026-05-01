"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Send,
  AlertCircle,
  Pencil,
  MessageSquare,
  Upload,
  Link2,
  Video,
} from "lucide-react";
import { useVideoChat, useSendChatMessage, useSendTyping, useChatSSE } from "@/hooks/useVideoChat";
import {
  useVideo,
  useApproveVideo,
  useRequestEdit,
  useVideoComments,
  useAddVideoComment,
  useUpdateVideoStage,
  useUploadVideoLink,
} from "@/hooks/useVideos";
import { VideoProductionStage, VideoComment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

/* ─── constants ─── */

const STAGES: VideoProductionStage[] = [
  "scripting",
  "filming",
  "editing",
  "review",
  "approved",
];

const STAGE_LABELS: Record<VideoProductionStage, string> = {
  scripting: "Scripting",
  filming: "Filming",
  editing: "Editing",
  review: "Review",
  approved: "Approved",
};

const STAGE_DISPLAY: Record<VideoProductionStage, string> = {
  scripting: "Pre-Production",
  filming: "Production",
  editing: "Post-Production",
  review: "Client Review",
  approved: "Approved",
};

const PLATFORM_LABELS: Record<string, string> = {
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

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderMessageText(text: string, isOwn: boolean) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "underline underline-offset-2 break-all",
          isOwn ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-800"
        )}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const ARPAN_EMAIL = "arpan@restorefine.co.uk";

function isArpan(user?: { email?: string; role?: string; name?: string } | null) {
  if (!user) return false;
  return (
    user.email === ARPAN_EMAIL ||
    user.role === "video_editor" ||
    user.name?.toLowerCase().startsWith("arpan")
  );
}

function getDriveFileId(url: string): string | null {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function hasDriveLink(url?: string): boolean {
  return !!url && url !== "" && url !== "#";
}

/* ─── helpers ─── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function chatTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function chatDateKey(iso: string): string {
  return new Date(iso).toDateString(); // e.g. "Thu May 01 2026"
}

function chatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

/* ─── sub-components ─── */

function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: "team" | "client";
  size?: "sm" | "md";
}) {
  const color =
    role === "client" ? "bg-gray-400" : (MEMBER_COLOR[name] ?? "bg-gray-600");
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-black text-white shrink-0",
        color,
        size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]"
      )}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function InfoTile({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot?: "green" | "yellow" | "red";
}) {
  const dotColor =
    dot === "green"
      ? "bg-green-500"
      : dot === "yellow"
      ? "bg-yellow-400"
      : "bg-red-500";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {dot && (
          <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
        )}
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ─── main page ─── */

type TabKey = "chat" | "feedback" | "reviews";
type MobileView = "production" | "chat";

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { currentUser } = useStore();
  const video = useVideo(id);
  const { data: comments = [] } = useVideoComments(id);
  const addComment = useAddVideoComment(id);
  const updateStage = useUpdateVideoStage();
  const approve = useApproveVideo();
  const requestEdit = useRequestEdit();
  const uploadLink = useUploadVideoLink();

  const [mobileView, setMobileView] = useState<MobileView>("production");
  const [tab, setTab] = useState<TabKey>("chat");
  const [message, setMessage] = useState("");
  const [authorRole, setAuthorRole] = useState<"team" | "client">("team");
  const [authorName, setAuthorName] = useState("Rohit");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [driveLinkInput, setDriveLinkInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: chatMessages = [] } = useVideoChat(id);
  const sendChatMessage = useSendChatMessage(id);
  const sendTyping = useSendTyping(id);
  const { typingAuthor } = useChatSSE(id);
  const [chatInput, setChatInput] = useState("");

  const CHAT_MEMBERS = ["rohit", "rohin", "harpreet", "kreshina", "prabish", "arpan"];
  const canChat =
    currentUser &&
    CHAT_MEMBERS.includes(currentUser.name.trim().split(" ")[0].toLowerCase());

  const userIsArpan = isArpan(currentUser);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || sendChatMessage.isPending) return;
    setChatInput("");
    await sendChatMessage.mutateAsync(text);
  };

  if (!video) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Video not found.</p>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(video.productionStage);
  const pct = Math.round((stageIdx / (STAGES.length - 1)) * 100);

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesFor = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  const tabComments =
    tab === "feedback"
      ? topLevel.filter((c) => c.type === "feedback")
      : tab === "reviews"
      ? topLevel.filter((c) => c.type === "approval")
      : topLevel;

  const activeCommentId = [...topLevel]
    .reverse()
    .find((c) => c.type === "feedback" && !c.resolved)?.id;

  const unresolvedFeedback = comments.filter(
    (c) => c.type === "feedback" && !c.resolved
  ).length;
  const reviewCount = comments.filter((c) => c.type === "approval").length;

  const assignedTo =
    comments.find((c) => c.role === "team")?.author ?? "Team";
  const uploadedAt = comments.find((c) => c.role === "team")?.createdAt;

  /* handlers */
  const handleStageMove = (dir: "prev" | "next") => {
    const newIdx = dir === "next" ? stageIdx + 1 : stageIdx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    updateStage.mutate({ id: video.id, stage: STAGES[newIdx] });
    toast.success(`Stage → ${STAGE_LABELS[STAGES[newIdx]]}`);
  };

  const handleStageClick = (stage: VideoProductionStage) => {
    updateStage.mutate({ id: video.id, stage });
    toast.success(`Stage set to ${STAGE_LABELS[stage]}`);
  };

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(video.id);
      addComment.mutate({
        author: authorName,
        role: "team",
        type: "approval",
        message: `Video approved by ${authorName}.`,
      });
      toast.success("Video approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleRequestEdit = async () => {
    if (!feedbackText.trim()) return;
    try {
      await requestEdit.mutateAsync({ id: video.id, feedback: feedbackText });
      addComment.mutate({
        author: authorName,
        role: "team",
        type: "feedback",
        message: feedbackText.trim(),
      });
      setFeedbackText("");
      setFeedbackOpen(false);
      toast.success("Edit request sent");
    } catch {
      toast.error("Failed to send");
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    addComment.mutate({
      author: authorName,
      role: authorRole,
      type: "comment",
      message: message.trim(),
    });
    setMessage("");
  };

  return (
    <div className="max-w-[1280px]">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> Back to videos
      </button>

      {/* Two-column: stacks on mobile, side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 lg:gap-8 items-start">
        {/* ── LEFT ── always visible */}
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-black leading-tight">
                {video.title}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Assigned to {assignedTo}
                {uploadedAt && ` · ${relativeTime(uploadedAt)}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toast.success("Link copied to clipboard")}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 size={13} /> Share
              </button>
              {video.status !== "approved" ? (
                <button
                  onClick={handleApprove}
                  disabled={approve.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              ) : (
                <span className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                  <CheckCircle2 size={14} /> Approved
                </span>
              )}
            </div>
          </div>

          {/* Video preview */}
          {hasDriveLink(video.videoUrl) ? (
            (() => {
              const fileId = getDriveFileId(video.videoUrl);
              return fileId ? (
                <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-950">
                  <iframe
                    src={`https://drive.google.com/file/d/${fileId}/preview`}
                    className="w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video bg-gray-950 rounded-2xl overflow-hidden relative group hover:bg-gray-900 transition-colors mb-4"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Play size={24} className="text-white ml-1.5" fill="white" />
                    </div>
                  </div>
                  <span className="absolute top-3 right-4 text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                    {PLATFORM_LABELS[video.platform] ?? video.platform}
                  </span>
                </a>
              );
            })()
          ) : (
            <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 mb-4">
              <Video size={32} className="text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">
                {userIsArpan
                  ? "No video uploaded yet — add a Google Drive link below"
                  : "Awaiting video upload from editor"}
              </p>
            </div>
          )}

          {/* Arpan: upload / update drive link */}
          {userIsArpan && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Link2 size={13} className="text-gray-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  {hasDriveLink(video.videoUrl) ? "Update Video Link" : "Upload Video Link"}
                </p>
              </div>
              <div className="px-6 py-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={driveLinkInput}
                    onChange={(e) => setDriveLinkInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/…/view"
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <button
                    onClick={async () => {
                      const url = driveLinkInput.trim();
                      if (!url) return;
                      try {
                        await uploadLink.mutateAsync({ id: video.id, videoUrl: url });
                        setDriveLinkInput("");
                        toast.success("Video link saved");
                      } catch {
                        toast.error("Failed to save link");
                      }
                    }}
                    disabled={!driveLinkInput.trim() || uploadLink.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed sm:shrink-0"
                  >
                    <Upload size={14} />
                    {uploadLink.isPending ? "Saving…" : "Save Link"}
                  </button>
                </div>
                {hasDriveLink(video.videoUrl) && (
                  <p className="text-xs text-gray-400 mt-2">
                    Current: <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">{video.videoUrl}</a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <InfoTile
              label="Stage"
              value={STAGE_DISPLAY[video.productionStage]}
            />
            <InfoTile
              label="Platform"
              value={PLATFORM_LABELS[video.platform] ?? video.platform}
            />
            <InfoTile
              label="Review Status"
              value={
                video.status === "approved"
                  ? "Approved"
                  : video.status === "edit_requested"
                  ? "Edit Requested"
                  : "In Progress"
              }
              dot={
                video.status === "approved"
                  ? "green"
                  : video.status === "edit_requested"
                  ? "red"
                  : "yellow"
              }
            />
          </div>

          {/* Mobile tab switcher — video stays above, toggle production vs chat below */}
          <div className="flex lg:hidden bg-white border border-gray-200 rounded-xl p-1 mb-5 gap-1">
            {(
              [
                { key: "production" as MobileView, label: "Production" },
                { key: "chat" as MobileView, label: "Chat & Reviews" },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMobileView(key)}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer",
                  mobileView === key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Production stage card — always on desktop, toggled on mobile */}
          <div className={cn("bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4", mobileView === "chat" ? "hidden lg:block" : "block")}>
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Production Stage
              </p>
            </div>
            <div className="px-6 py-6">
              {/* Clickable circles */}
              <div className="flex items-center mb-2.5">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={cn(
                      "flex items-center",
                      i < STAGES.length - 1 ? "flex-1" : ""
                    )}
                  >
                    <button
                      onClick={() => handleStageClick(stage)}
                      title={`Set to ${STAGE_LABELS[stage]}`}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all shrink-0 cursor-pointer",
                        i < stageIdx
                          ? "border-gray-800 bg-gray-800 text-white"
                          : i === stageIdx
                          ? "border-red-600 bg-red-600 text-white ring-4 ring-red-100"
                          : "border-gray-200 bg-white text-gray-400 hover:border-gray-400"
                      )}
                    >
                      {i < stageIdx ? "✓" : i + 1}
                    </button>
                    {i < STAGES.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-1 transition-all",
                          i < stageIdx ? "bg-gray-800" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Labels */}
              <div className="flex mb-5">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={cn(i < STAGES.length - 1 ? "flex-1" : "")}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wide",
                        i === stageIdx
                          ? "text-red-600"
                          : i < stageIdx
                          ? "text-gray-500"
                          : "text-gray-300"
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    video.status === "approved" ? "bg-green-500" : "bg-red-600"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {STAGE_LABELS[video.productionStage]}
                </span>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {pct}%
                </span>
              </div>

              {/* Prev / Next */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleStageMove("prev")}
                  disabled={stageIdx === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  onClick={() => handleStageMove("next")}
                  disabled={stageIdx === STAGES.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Request Edit — admins/PM only, not video editor */}
          {video.status !== "approved" && !userIsArpan && (
            <div className={cn("bg-white border border-gray-200 rounded-2xl overflow-hidden", mobileView === "chat" ? "hidden lg:block" : "block")}>
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Request Changes
                </p>
              </div>
              <div className="px-6 py-5">
                {!feedbackOpen ? (
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <AlertCircle size={15} /> Request Edit
                  </button>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe the changes needed..."
                      rows={3}
                      autoFocus
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRequestEdit}
                        disabled={!feedbackText.trim() || requestEdit.isPending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Send Edit Request
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackOpen(false);
                          setFeedbackText("");
                        }}
                        className="px-4 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Review panel ── */}
        <div className={cn(
          "flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm min-h-[520px] lg:sticky lg:top-8 lg:h-[calc(100vh-5.5rem)]",
          mobileView === "production" ? "hidden lg:flex" : "flex"
        )}>
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-1 pt-1">
            {(
              [
                { key: "chat", label: "Chat", count: null },
                { key: "feedback", label: "Feedback", count: unresolvedFeedback },
                { key: "reviews", label: `Reviews`, count: reviewCount },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors relative cursor-pointer",
                  tab === key
                    ? "text-gray-900 border-b-2 border-red-600 -mb-px"
                    : "text-gray-400 hover:text-gray-700"
                )}
              >
                {label}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black",
                      tab === key
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Chat tab: messenger UI */}
          {tab === "chat" && (
            <>
              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 max-h-[400px] lg:max-h-none">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-28 gap-2">
                    <MessageSquare size={22} className="text-gray-200" />
                    <p className="text-xs text-gray-400">No messages yet.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const isOwn = msg.author === currentUser?.name;
                  const prevMsg = chatMessages[i - 1];
                  const nextMsg = chatMessages[i + 1];
                  const isFirstInGroup = !prevMsg || prevMsg.author !== msg.author;
                  const isLastInGroup = !nextMsg || nextMsg.author !== msg.author;
                  const showDateSep =
                    !prevMsg || chatDateKey(prevMsg.created_at) !== chatDateKey(msg.created_at);

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
                            {chatDateSeparator(msg.created_at)}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "flex items-end gap-2",
                          isOwn ? "flex-row-reverse" : "flex-row",
                          !isLastInGroup ? "mb-0.5" : "mb-2"
                        )}
                      >
                        {/* Chat head — shown only on last message of each group */}
                        {isLastInGroup ? (
                          <div
                            title={msg.author}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-sm",
                              MEMBER_COLOR[msg.author] ?? "bg-gray-600"
                            )}
                          >
                            {msg.author[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}

                        <div className={cn("flex flex-col max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                          {/* Name label — first bubble of each group */}
                          {isFirstInGroup && (
                            <p className={cn(
                              "text-[10px] font-semibold mb-1 px-1",
                              isOwn ? "text-gray-400" : "text-gray-500"
                            )}>
                              {isOwn ? "You" : msg.author}
                            </p>
                          )}

                          <div
                            className={cn(
                              "px-3.5 py-2 text-sm leading-relaxed",
                              isOwn ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900",
                              isOwn
                                ? isLastInGroup ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                                : isLastInGroup ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                            )}
                          >
                            {renderMessageText(msg.message, isOwn)}
                          </div>

                          {/* Timestamp — only on last bubble of each group */}
                          {isLastInGroup && (
                            <p className="text-[10px] text-gray-400 mt-1 px-1">
                              {chatTimeLabel(msg.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingAuthor && typingAuthor !== currentUser?.name && (
                  <div className="flex items-end gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-sm",
                        MEMBER_COLOR[typingAuthor] ?? "bg-gray-600"
                      )}
                    >
                      {typingAuthor[0].toUpperCase()}
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              {canChat ? (
                <div className="shrink-0 border-t border-gray-100 p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        sendTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Message..."
                      rows={1}
                      className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none text-gray-900 placeholder:text-gray-400 max-h-24 overflow-y-auto"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || sendChatMessage.isPending}
                      className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      <Send size={15} className="-ml-0.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="shrink-0 border-t border-gray-100 p-3 text-center">
                  <p className="text-xs text-gray-400">Read-only</p>
                </div>
              )}
            </>
          )}

          {/* Feedback / Reviews tabs: comment cards */}
          {tab !== "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-[400px] lg:max-h-none">
                {tabComments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-28 gap-2">
                    <MessageSquare size={22} className="text-gray-200" />
                    <p className="text-xs text-gray-400">No messages yet.</p>
                  </div>
                )}

                {tabComments.map((comment) => {
                  const isActive = comment.id === activeCommentId;
                  const replies = repliesFor(comment.id);
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        "border rounded-xl p-4 transition-colors",
                        isActive
                          ? "border-red-400 bg-red-50/20"
                          : "border-gray-100 bg-white",
                        comment.resolved && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={comment.author} role={comment.role} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={cn(
                                "text-sm font-bold text-gray-900",
                                comment.resolved && "line-through text-gray-400"
                              )}
                            >
                              {comment.author}
                            </span>
                            {comment.timecode ? (
                              <span
                                className={cn(
                                  "text-[11px] font-mono px-2 py-0.5 rounded font-bold shrink-0",
                                  isActive
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {comment.timecode}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-300 tabular-nums shrink-0">
                                {relativeTime(comment.createdAt)}
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-sm text-gray-600 leading-relaxed",
                              comment.resolved && "line-through text-gray-400"
                            )}
                          >
                            {comment.message}
                          </p>
                        </div>
                      </div>

                      {/* Replies */}
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="ml-11 mt-3 border-t border-gray-50 pt-3 flex items-start gap-2"
                        >
                          <Avatar name={reply.author} role={reply.role} size="sm" />
                          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-900">
                                {reply.author}
                              </span>
                              <span className="text-[10px] text-gray-300 tabular-nums">
                                {relativeTime(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {reply.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input with formatting toolbar — only for Feedback/Reviews */}
              <div className="shrink-0 border-t border-gray-100 p-4">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Formatting toolbar */}
                  <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 font-black text-[13px] transition-colors cursor-pointer">
                      B
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 italic text-[13px] transition-colors cursor-pointer">
                      I
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition-colors cursor-pointer">
                      <Pencil size={12} />
                    </button>
                    <div className="ml-auto flex items-center gap-1.5">
                      <div className="flex rounded border border-gray-200 overflow-hidden text-[9px] font-bold uppercase tracking-wider bg-white">
                        {(["team", "client"] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setAuthorRole(role);
                              setAuthorName(
                                role === "team" ? "Rohit" : video.clientName
                              );
                            }}
                            className={cn(
                              "px-2 py-1 transition-colors cursor-pointer",
                              authorRole === role
                                ? "bg-gray-900 text-white"
                                : "text-gray-400 hover:text-gray-700"
                            )}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      {authorRole === "team" && (
                        <select
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="text-[10px] border border-gray-200 rounded px-1.5 py-1 focus:outline-none bg-white text-gray-700"
                        >
                          {["Rohit", "Rohin", "Harpreet", "Kreshina", "Arpan"].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Leave a comment..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none text-gray-700 placeholder-gray-400 block"
                  />

                  {/* Bottom bar */}
                  <div className="flex items-center justify-end px-3 py-2 border-t border-gray-100">
                    <button
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Post <Send size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
