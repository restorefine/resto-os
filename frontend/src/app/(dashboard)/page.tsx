"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  ReceiptText,
  GitBranch,
  Video,
  ArrowRight,
  Clock,
  Film,
} from "lucide-react";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { useInvoices } from "@/hooks/useInvoices";
import { usePipeline } from "@/hooks/usePipeline";
import { useVideos } from "@/hooks/useVideos";
import { useClients } from "@/hooks/useClients";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_COLOR: Record<string, string> = {
  invoice_paid: "bg-green-500",
  video_approved: "bg-blue-500",
  lead_moved: "bg-purple-500",
  client_added: "bg-red-500",
  quote_sent: "bg-orange-500",
};

function getDueLabelDash(dueDate: string): { label: string; color: string } {
  if (!dueDate) return { label: "", color: "text-gray-400" };
  const d = new Date(dueDate); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: "text-red-600" };
  if (diff === 0) return { label: "Due today",    color: "text-orange-500" };
  if (diff === 1) return { label: "Due tomorrow", color: "text-orange-400" };
  return { label: `Due in ${diff}d`, color: "text-gray-500" };
}

const PLATFORM_BADGE: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  tiktok: "bg-gray-900 text-white",
  youtube: "bg-red-100 text-red-700",
  facebook: "bg-blue-100 text-blue-700",
  linkedin: "bg-blue-50 text-blue-600",
};

const STAGE_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "scripting",   label: "Pre-Production", color: "bg-gray-900" },
  { key: "filming",     label: "Production",     color: "bg-gray-900" },
  { key: "editing",     label: "Post-Production", color: "bg-red-600" },
  { key: "review",      label: "Client Review",  color: "bg-orange-500" },
  { key: "approved",    label: "Approved",       color: "bg-green-500" },
];

function VideoDashboard({ role }: { role: string }) {
  const { data: videos = [] } = useVideos();
  const { data: clients = [] } = useClients();

  const total = videos.length;
  const approved = videos.filter(
    (v) => v.status === "approved" || v.productionStage === "approved"
  ).length;
  const inReview = videos.filter((v) => v.productionStage === "review").length;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const overdue = videos.filter((v) => {
    if (!v.dueDate || v.status === "approved") return false;
    const d = new Date(v.dueDate); d.setHours(0, 0, 0, 0);
    return d < now;
  }).length;

  const activeClients = clients
    .filter((c) => c.status === "active")
    .sort((a, b) => b.monthlyProgress - a.monthlyProgress);

  const upcoming = videos
    .filter((v) => v.dueDate && v.status !== "approved")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  const subtitle =
    role === "project_manager"
      ? "Your production overview for today."
      : "Here's what's in your queue today.";

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          Good morning<span className="text-red-600">.</span>
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Videos"
          value={String(total)}
          trend={`${total} total`}
          trendUp={total > 0}
          sub="in production"
          icon={<Film size={16} />}
          accent="gray"
        />
        <StatCard
          label="Approved"
          value={String(approved)}
          trend={total > 0 ? `${Math.round((approved / total) * 100)}%` : "0%"}
          trendUp
          sub="of total"
          icon={<Video size={16} />}
          accent="green"
        />
        <StatCard
          label="In Review"
          value={String(inReview)}
          trend={`${inReview} pending`}
          trendUp={inReview === 0}
          sub="awaiting feedback"
          icon={<Clock size={16} />}
          accent="yellow"
        />
        <StatCard
          label="Overdue"
          value={String(overdue)}
          trend={overdue === 0 ? "All on track" : `${overdue} past due`}
          trendUp={overdue === 0}
          sub={overdue === 0 ? "" : "need attention"}
          icon={<ReceiptText size={16} />}
          accent={overdue > 0 ? "red" : "gray"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Production Pipeline
          </p>
          <div className="space-y-3">
            {STAGE_CONFIG.map((stage) => {
              const count = videos.filter((v) => v.productionStage === stage.key).length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                    <span className="text-xs font-semibold text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", stage.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Client Progress
          </p>
          {activeClients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No active clients.</p>
          ) : (
            <div className="space-y-4">
              {activeClients.slice(0, 5).map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                      {c.name}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 shrink-0">
                      {c.monthlyProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${Math.min(c.monthlyProgress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
            Upcoming Deadlines
          </p>
          <Link
            href="/videos"
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No upcoming deadlines.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((v) => {
              const due = getDueLabelDash(v.dueDate);
              return (
                <div key={v.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.clientName}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0",
                    PLATFORM_BADGE[v.platform] ?? "bg-gray-100 text-gray-600"
                  )}>
                    {v.platform}
                  </span>
                  <span className={cn("text-xs font-semibold shrink-0", due.color)}>
                    {due.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [chartMounted, setChartMounted] = useState(false);
  useEffect(() => setChartMounted(true), []);

  const { currentUser } = useStore();
  const { data: invoices = [] } = useInvoices();
  const { data: leads = [] } = usePipeline();
  const { data: videos = [] } = useVideos();

  const isVideoRole =
    currentUser?.role === "project_manager" || currentUser?.role === "video_editor";
  if (isVideoRole) return <VideoDashboard role={currentUser.role} />;

  const unpaid = invoices.filter((i) => i.status !== "paid");
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const pipelineValue = leads.reduce((s, l) => s + l.value, 0);
  const pendingVideos = videos.filter((v) => v.status === "pending");
  const stats = MOCK_DASHBOARD;

  return (
    <div className="space-y-6 max-w-[1400px]">

      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          Good morning<span className="text-red-600">.</span>
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s your agency overview for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={fmt(stats.mrr)}
          trend="+8.3%"
          trendUp
          sub="vs last month"
          icon={<PoundSterling size={16} />}
          accent="red"
        />
        <StatCard
          label="Outstanding Invoices"
          value={fmt(unpaidTotal)}
          trend={`${unpaid.length} invoices`}
          trendUp={false}
          sub={overdue.length > 0 ? `${overdue.length} overdue` : "All on time"}
          icon={<ReceiptText size={16} />}
          accent={overdue.length > 0 ? "orange" : "gray"}
        />
        <StatCard
          label="Pipeline Value"
          value={fmt(pipelineValue)}
          trend={`${leads.length} leads`}
          trendUp
          sub="across all stages"
          icon={<GitBranch size={16} />}
          accent="blue"
        />
        <StatCard
          label="Pending Approvals"
          value={String(pendingVideos.length)}
          trend={`${pendingVideos.length} video${pendingVideos.length !== 1 ? "s" : ""}`}
          trendUp={pendingVideos.length === 0}
          sub="awaiting review"
          icon={<Video size={16} />}
          accent={pendingVideos.length > 0 ? "yellow" : "gray"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                MRR Trend
              </p>
              <p className="text-3xl font-black text-gray-900 mt-1">{fmt(stats.mrr)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp size={13} className="text-green-500" />
                <span className="text-sm text-green-600 font-semibold">+8.3%</span>
                <span className="text-sm text-gray-400">vs last month</span>
              </div>
            </div>
            <Link
              href="/invoices"
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              View invoices <ArrowRight size={12} />
            </Link>
          </div>
          <div className="h-[220px] min-h-[220px] w-full">
            {chartMounted ? <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.mrrTrend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(v) => [fmt(Number(v)), "MRR"]}
                  contentStyle={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: 12,
                    padding: "8px 12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
                  }}
                  cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#DC2626"
                  strokeWidth={2.5}
                  fill="url(#mrrGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#DC2626", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer> : <div className="h-[220px] bg-gray-50 animate-pulse rounded-lg" />}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Recent Activity
            </p>
            <Clock size={14} className="text-gray-300" />
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((item, i) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", ACTIVITY_COLOR[item.type] ?? "bg-gray-300")} />
                  {i < stats.recentActivity.length - 1 && (
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{item.description}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.userName && (
                      <span className="text-[10px] font-semibold text-gray-500">{item.userName}</span>
                    )}
                    {item.userName && <span className="text-gray-200">·</span>}
                    <span className="text-[10px] text-gray-400">{timeAgo(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Outstanding Invoices
            </p>
            <Link href="/invoices" className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {unpaid.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">All invoices are paid.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {unpaid.slice(0, 4).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inv.clientName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{inv.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900 font-mono">
                      {fmt(inv.amount)}
                    </p>
                    <span className={cn(
                      "inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5",
                      inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Pending Video Approvals
            </p>
            <Link href="/videos" className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {pendingVideos.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No videos pending approval.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingVideos.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500 shrink-0 uppercase">
                    {v.platform.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.clientName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">
                      Due {new Date(v.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                    <span className="inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 mt-0.5">
                      pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

type Accent = "red" | "blue" | "orange" | "yellow" | "gray" | "green";

const ACCENT_ICON: Record<Accent, string> = {
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  yellow: "bg-yellow-50 text-yellow-600",
  gray: "bg-gray-100 text-gray-500",
  green: "bg-green-50 text-green-600",
};

function StatCard({
  label, value, trend, trendUp, sub, icon, accent = "gray",
}: {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  sub: string;
  icon: React.ReactNode;
  accent?: Accent;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 leading-tight max-w-[130px]">{label}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", ACCENT_ICON[accent])}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {trendUp
            ? <TrendingUp size={12} className="text-green-500 shrink-0" />
            : <TrendingDown size={12} className="text-red-500 shrink-0" />
          }
          <span className={cn("text-xs font-semibold", trendUp ? "text-green-600" : "text-red-600")}>
            {trend}
          </span>
          <span className="text-xs text-gray-400">{sub}</span>
        </div>
      </div>
    </div>
  );
}
