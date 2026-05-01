"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, Users, Columns2, Calendar, Plus, Film, type LucideIcon } from "lucide-react";
import { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ROLE_BOTTOM_NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Pipeline", href: "/pipeline", icon: Columns2 },
    { label: "Calendar", href: "/calendar", icon: Calendar },
  ],
  staff: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Pipeline", href: "/pipeline", icon: Columns2 },
    { label: "Calendar", href: "/calendar", icon: Calendar },
  ],
  client: [{ label: "Home", href: "/", icon: LayoutDashboard }],
  video_editor: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Videos", href: "/videos", icon: Film },
  ],
  developer_designer: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Videos", href: "/videos", icon: Film },
  ],
  project_manager: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Videos", href: "/videos", icon: Film },
    { label: "Calendar", href: "/calendar", icon: Calendar },
  ],
};

// ─── SVG fan path ─────────────────────────────────────────────────────────────
// Angles in math convention: 0° = right, 90° = up
// startDeg → endDeg goes clockwise in math (decreasing angle)

function fanPath(innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, d: number) => [+(r * Math.cos(toRad(d))).toFixed(2), +(-r * Math.sin(toRad(d))).toFixed(2)] as [number, number];

  const [ox1, oy1] = pt(outerR, startDeg);
  const [ox2, oy2] = pt(outerR, endDeg);
  const [ix1, iy1] = pt(innerR, startDeg);
  const [ix2, iy2] = pt(innerR, endDeg);

  // Decreasing angle (165→100) = clockwise in SVG = sweep 1 for outer arc
  // Return arc: sweep 1 outer, sweep 0 inner
  return `M${ox1} ${oy1} A${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L${ix2} ${iy2} A${innerR} ${innerR} 0 0 0 ${ix1} ${iy1}Z`;
}

function fanCenter(innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const midDeg = (startDeg + endDeg) / 2;
  const midR = (innerR + outerR) / 2;
  return {
    x: +(midR * Math.cos(toRad(midDeg))).toFixed(2),
    y: +(-midR * Math.sin(toRad(midDeg))).toFixed(2),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useStore();
  const role = (currentUser?.role ?? "staff") as UserRole;
  const items = ROLE_BOTTOM_NAV[role] ?? ROLE_BOTTOM_NAV.staff;
  const [menuOpen, setMenuOpen] = useState(false);

  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Fan geometry
  const INNER = 42,
    OUTER = 118;
  const leftPath = fanPath(INNER, OUTER, 165, 93);
  const rightPath = fanPath(INNER, OUTER, 87, 15);
  const leftCenter = fanCenter(INNER, OUTER, 165, 93);
  const rightCenter = fanCenter(INNER, OUTER, 87, 15);

  const navLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={cn("relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors", active ? "text-red-600" : "text-gray-400")}>
        <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
        <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
        {active && <span className="absolute bottom-0 w-8 h-0.5 bg-red-500 rounded-t-full" />}
      </Link>
    );
  };

  return (
    <>
      {/* Dark backdrop behind radial menu */}
      {menuOpen && <div className="fixed inset-0 z-[95]" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setMenuOpen(false)} />}

      <div className="fixed bottom-0 inset-x-0 z-[100] md:hidden">
        {/* Radial fan menu — positioned so SVG origin sits at FAB centre */}
        <div className={cn("absolute left-1/2 -translate-x-1/2 transition-all duration-200 origin-bottom", menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none")} style={{ bottom: 80, width: 260, height: 130 }}>
          <svg width="260" height="130" viewBox="-130 -125 260 130" style={{ overflow: "visible" }}>
            <defs>
              <filter id="fan-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Left segment — Contract */}
            <g
              filter="url(#fan-shadow)"
              onClick={() => {
                setMenuOpen(false);
                router.push("/contracts");
              }}
              style={{ cursor: "pointer" }}
            >
              <path d={leftPath} fill="#DC2626" />
              <path d={leftPath} fill="none" stroke="#991b1b" strokeWidth="1" />
              <text x={leftCenter.x} y={leftCenter.y - 9} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="22" fontWeight="bold" style={{ pointerEvents: "none", userSelect: "none" }}>
                +
              </text>
              <text x={leftCenter.x} y={leftCenter.y + 11} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.85)" fontSize="8.5" fontWeight="700" style={{ pointerEvents: "none", userSelect: "none", letterSpacing: "0.08em" }}>
                CONTRACT
              </text>
            </g>

            {/* Right segment — Quote */}
            <g
              filter="url(#fan-shadow)"
              onClick={() => {
                setMenuOpen(false);
                router.push("/quotes");
              }}
              style={{ cursor: "pointer" }}
            >
              <path d={rightPath} fill="#DC2626" />
              <path d={rightPath} fill="none" stroke="#991b1b" strokeWidth="1" />
              <text x={rightCenter.x} y={rightCenter.y - 9} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="22" fontWeight="bold" style={{ pointerEvents: "none", userSelect: "none" }}>
                +
              </text>
              <text x={rightCenter.x} y={rightCenter.y + 11} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.85)" fontSize="8.5" fontWeight="700" style={{ pointerEvents: "none", userSelect: "none", letterSpacing: "0.08em" }}>
                QUOTE
              </text>
            </g>
          </svg>
        </div>

        {/* Nav bar */}
        <div className="relative h-20 bg-white border-t border-gray-200">
          {/* Items: 2 left — center gap — 2 right + More */}
          <div className="flex items-stretch h-full">
            <div className="flex flex-1 items-stretch">{leftItems.map(navLink)}</div>
            {/* Gap for FAB */}
            <div className="w-20 shrink-0" />
            <div className="flex flex-1 items-stretch">
              {rightItems.map(navLink)}
              {/* <button
                type="button"
                onClick={toggleMobileMenu}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer"
              >
                <MoreHorizontal size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-semibold tracking-wide">More</span>
              </button> */}
            </div>
          </div>

          {/* White cover — hides the border-t line under the FAB */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ width: 72, height: 72 }} />

          {/* FAB */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10", "w-14 h-14 rounded-full ring-[5px] ring-white shadow-xl", "flex items-center justify-center transition-all duration-300 cursor-pointer", menuOpen ? "bg-[#1c1c1e] rotate-45" : "bg-red-600")}
          >
            <Plus size={26} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}
