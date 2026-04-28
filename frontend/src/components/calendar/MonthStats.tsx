import { CalendarPost } from "@/types/calendar";

interface Props {
  posts: CalendarPost[];
}

export default function MonthStats({ posts }: Props) {
  const totalPosts = posts.length;
  const videos = posts.filter((p) =>
    p.platforms.some((pl) => pl.name === "youtube" || pl.name === "tiktok")
  ).length;
  const instagramPosts = posts.filter((p) =>
    p.platforms.some((pl) => pl.name === "instagram")
  ).length;
  const tiktokPosts = posts.filter((p) =>
    p.platforms.some((pl) => pl.name === "tiktok")
  ).length;
  const platformSet = new Set(posts.flatMap((p) => p.platforms.map((pl) => pl.name)));
  const platformsActive = platformSet.size;

  const stats = [
    { label: "Total Posts", value: totalPosts },
    { label: "Videos", value: videos },
    { label: "Instagram", value: instagramPosts },
    { label: "TikTok", value: tiktokPosts },
    { label: "Platforms", value: platformsActive },
    { label: "Days Planned", value: totalPosts },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Month Overview
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className={`text-2xl font-bold ${value > 0 ? "text-gray-900" : "text-gray-300"}`}>
              {value}
            </span>
            <span className="text-center text-[10px] leading-tight text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
