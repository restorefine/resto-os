"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard,
  Users,
  Columns2,
  Calendar,
  Film,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
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
  client: [
    { label: "Home", href: "/", icon: LayoutDashboard },
  ],
  video_editor: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Videos", href: "/videos", icon: Film },
    { label: "Calendar", href: "/calendar", icon: Calendar },
  ],
  developer_designer: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Videos", href: "/videos", icon: Film },
  ],
  project_manager: [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Pipeline", href: "/pipeline", icon: Columns2 },
    { label: "Calendar", href: "/calendar", icon: Calendar },
  ],
};

export function BottomNav() {
  const pathname = usePathname();
  const { currentUser, toggleMobileMenu } = useStore();
  const role = (currentUser?.role ?? "staff") as UserRole;
  const items = ROLE_BOTTOM_NAV[role] ?? ROLE_BOTTOM_NAV.staff;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[100] md:hidden bg-white border-t border-gray-200">
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-red-600" : "text-gray-400"
              )}
            >
              <item.icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-all"
              />
              <span className={cn(
                "text-[10px] font-semibold tracking-wide transition-colors",
                active ? "text-red-600" : "text-gray-400"
              )}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-red-500 rounded-t-full" />
              )}
            </Link>
          );
        })}

        {/* More / Menu */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold tracking-wide">More</span>
        </button>
      </div>
    </nav>
  );
}
