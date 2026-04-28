"use client";

import { CalendarPost, PlatformName } from "@/types/calendar";
import { isToday, isSameMonth } from "date-fns";
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";

const PLATFORM_ICONS: Record<PlatformName, { icon: React.ReactNode; color: string }> = {
  instagram: { icon: <FaInstagram />, color: "#E1306C" },
  tiktok:    { icon: <FaTiktok />,    color: "#010101" },
  youtube:   { icon: <FaYoutube />,   color: "#FF0000" },
  facebook:  { icon: <FaFacebook />,  color: "#1877F2" },
  twitter:   { icon: <FaTwitter />,   color: "#1DA1F2" },
  linkedin:  { icon: <FaLinkedin />,  color: "#0A66C2" },
};

interface Props {
  date: Date;
  currentMonth: Date;
  post?: CalendarPost;
  onClick?: () => void;
  noBorderBottom?: boolean;
  noBorderRight?: boolean;
}

export default function CalendarCell({
  date,
  currentMonth,
  post,
  onClick,
  noBorderBottom = false,
  noBorderRight = false,
}: Props) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const hasPost = !!post;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={[
        "relative flex flex-col min-h-[88px] sm:min-h-[108px] p-2 transition-all duration-150",
        !noBorderBottom && "border-b border-gray-100",
        !noBorderRight && "border-r border-gray-100",
        onClick && "cursor-pointer",
        inMonth
          ? today
            ? "bg-red-50/50 hover:bg-red-50/70"
            : hasPost
              ? "bg-red-50/20 hover:bg-red-50/40"
              : "bg-white hover:bg-gray-50/60"
          : "bg-gray-50/50",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {today && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E01E1E]" />}
      {!today && hasPost && inMonth && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E01E1E]/40" />}

      <div className="flex items-start justify-end mb-1.5">
        <span
          className={[
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            today
              ? "bg-[#E01E1E] text-white shadow-sm"
              : inMonth
                ? "text-gray-800"
                : "text-gray-300",
          ].join(" ")}
        >
          {date.getDate()}
        </span>
      </div>

      {post && (
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {post.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.platforms.map((p) => {
                const info = PLATFORM_ICONS[p.name as PlatformName];
                if (!info) return null;
                return (
                  <span
                    key={p.id ?? p.name}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] shadow-sm flex-shrink-0 text-white"
                    style={{ backgroundColor: info.color }}
                  >
                    {info.icon}
                  </span>
                );
              })}
            </div>
          )}
          {post.description && (
            <p className="text-[10px] leading-snug line-clamp-2 break-words text-gray-500">
              {post.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
