"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import Link from "next/link";

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Dashboard" },
  "/clients": { label: "Clients" },
  "/invoices": { label: "Invoices" },
  "/pipeline": { label: "Pipeline" },
  "/calendar": { label: "Content Calendar" },
  "/videos": { label: "Video Approvals" },
  "/quotes": { label: "Quote Builder" },
  "/contracts": { label: "Contracts" },
  "/onboarding": { label: "Onboarding", parent: "/clients" },
};

function getBreadcrumb(pathname: string): { label: string; parent?: { label: string; href: string } } {
  for (const [path, info] of Object.entries(BREADCRUMBS)) {
    if (path !== "/" && pathname.startsWith(path)) {
      return {
        label: pathname === path ? info.label : `${info.label} / Detail`,
        parent: info.parent ? { label: BREADCRUMBS[info.parent]?.label ?? "", href: info.parent } : undefined,
      };
    }
  }
  if (pathname === "/") return { label: "Dashboard" };
  return { label: "AgencyOS" };
}

export function Topbar() {
  const pathname = usePathname();
  const { currentUser, notifications } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  const crumb = getBreadcrumb(pathname);

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "RS";

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {crumb.parent && (
          <>
            <Link href={crumb.parent.href} className="text-gray-400 hover:text-gray-700 transition-colors">
              {crumb.parent.label}
            </Link>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="font-semibold text-gray-900">{crumb.label}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-150 mx-2" />

        {/* User */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-black">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {currentUser?.name ?? "Admin"}
            </p>
            <p className="text-[11px] text-gray-400 capitalize leading-none mt-0.5">
              {currentUser?.role ?? "admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
