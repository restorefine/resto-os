"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { CalendarPost, PlatformName, CalendarPlatformData } from "@/types/calendar";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";

const PLATFORMS: { name: PlatformName; label: string; icon: React.ReactNode; color: string }[] = [
  { name: "instagram", label: "Instagram", icon: <FaInstagram />, color: "#E1306C" },
  { name: "tiktok",    label: "TikTok",    icon: <FaTiktok />,    color: "#010101" },
  { name: "youtube",   label: "YouTube",   icon: <FaYoutube />,   color: "#FF0000" },
  { name: "facebook",  label: "Facebook",  icon: <FaFacebook />,  color: "#1877F2" },
  { name: "twitter",   label: "Twitter/X", icon: <FaTwitter />,   color: "#1DA1F2" },
  { name: "linkedin",  label: "LinkedIn",  icon: <FaLinkedin />,  color: "#0A66C2" },
];

interface Props {
  date: Date | null;
  post?: CalendarPost;
  clientId: string;
  onClose: () => void;
  onSave: (post: CalendarPost) => void;
  onDelete: (postId: string) => void;
}

export default function PostDialog({ date, post, clientId, onClose, onSave, onDelete }: Props) {
  const [description, setDescription] = useState(post?.description ?? "");
  const [activePlatforms, setActivePlatforms] = useState<Record<PlatformName, boolean>>(() => {
    const init: Record<PlatformName, boolean> = {
      instagram: false, tiktok: false, youtube: false,
      facebook: false, twitter: false, linkedin: false,
    };
    post?.platforms.forEach((p) => { init[p.name as PlatformName] = true; });
    return init;
  });
  const [urls, setUrls] = useState<Record<PlatformName, string>>(() => {
    const init: Record<PlatformName, string> = {
      instagram: "", tiktok: "", youtube: "",
      facebook: "", twitter: "", linkedin: "",
    };
    post?.platforms.forEach((p) => { init[p.name as PlatformName] = p.url; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function togglePlatform(name: PlatformName) {
    setActivePlatforms((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  async function handleSave() {
    if (!date) return;
    setSaving(true);

    const platforms: CalendarPlatformData[] = PLATFORMS
      .filter((p) => activePlatforms[p.name])
      .map((p) => ({ name: p.name, url: urls[p.name] }));

    const res = await fetch("/api/calendar/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, date: date.toISOString(), description, platforms }),
    });
    const saved = await res.json();
    onSave(saved);
    setSaving(false);
    onClose();
  }

  async function handleClear() {
    if (!post) { onClose(); return; }
    setDeleting(true);
    await fetch(`/api/calendar/posts/${post.id}`, { method: "DELETE" });
    onDelete(post.id);
    setDeleting(false);
    onClose();
  }

  if (!date) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{format(date, "EEEE, d MMMM yyyy")}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-900">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's this post about?"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none resize-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-900">Platforms</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => togglePlatform(p.name)}
                  role="checkbox"
                  aria-checked={activePlatforms[p.name]}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                    activePlatforms[p.name]
                      ? "border-transparent text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
                  ].join(" ")}
                  style={activePlatforms[p.name] ? { backgroundColor: p.color, borderColor: p.color } : {}}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>

            {PLATFORMS.filter((p) => activePlatforms[p.name]).map((p) => (
              <div key={p.name} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <span style={{ color: p.color }}>{p.icon}</span>
                  {p.label} URL
                </label>
                <input
                  type="url"
                  value={urls[p.name]}
                  onChange={(e) => setUrls((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  placeholder={`https://${p.name}.com/...`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          {post && (
            <button
              onClick={handleClear}
              disabled={deleting}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-[#E01E1E] hover:border-red-200 transition-colors disabled:opacity-60"
            >
              {deleting ? "Clearing…" : "Clear"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#E01E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B01515] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
