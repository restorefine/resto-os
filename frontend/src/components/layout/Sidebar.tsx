"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { LayoutDashboard, Users, Receipt, Columns2, Calendar, Film, FileText, FileCheck2, PanelLeft, LogOut } from "lucide-react";

const MAIN_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Pipeline", href: "/pipeline", icon: Columns2 },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Videos", href: "/videos", icon: Film },
];

const TOOLS_NAV = [
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Contracts", href: "/contracts", icon: FileCheck2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, currentUser } = useStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "RS";

  return (
    <aside style={{ width: sidebarOpen ? "260px" : "64px" }} className="flex flex-col h-screen bg-[#0A0A0A] border-r border-white/6 overflow-hidden transition-[width] duration-250 ease-in-out shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-white/6 shrink-0">
        {sidebarOpen ? (
          <Image src="/logoWhitesidebar.svg" alt="AgencyOS" width={168} height={80} priority className="h-20 w-auto object-contain select-none" draggable={false} />
        ) : (
          <Image src="/logoV3-white.svg" alt="AgencyOS" width={32} height={32} priority className="w-8 h-8 object-contain select-none" draggable={false} />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Section label */}
        <div className="px-3 mb-1">
          {sidebarOpen && <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-2 py-1.5">Navigate</p>}
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className={cn("flex items-center h-10 rounded-lg transition-colors duration-100 group relative", sidebarOpen ? "px-3 gap-3" : "justify-center px-0", active ? "bg-white/10 text-white" : "text-white/45 hover:text-white hover:bg-white/6")}
                >
                  <item.icon size={17} className={cn("shrink-0 transition-colors", active ? "text-red-500" : "group-hover:text-white/80")} />
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250" style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}>
                    {item.label}
                  </span>
                  {active && sidebarOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                  {active && !sidebarOpen && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tools section */}
        <div className="px-3 mt-4">
          {sidebarOpen && <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-2 py-1.5">Tools</p>}
          {!sidebarOpen && <div className="h-px bg-white/6 mx-2 my-2" />}
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className={cn("flex items-center h-10 rounded-lg transition-colors duration-100 group relative", sidebarOpen ? "px-3 gap-3" : "justify-center px-0", active ? "bg-white/10 text-white" : "text-white/45 hover:text-white hover:bg-white/6")}
                >
                  <item.icon size={17} className={cn("shrink-0 transition-colors", active ? "text-red-500" : "group-hover:text-white/80")} />
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250" style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}>
                    {item.label}
                  </span>
                  {active && !sidebarOpen && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/6 p-3 shrink-0">
        {/* User info row */}
        {sidebarOpen && currentUser && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-[11px] font-black shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-none truncate">{currentUser.name}</p>
              <p className="text-white/35 text-[10px] capitalize leading-none mt-1 truncate">{currentUser.role}</p>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
          </div>
        )}

        {/* Sign out */}
        <button title={!sidebarOpen ? "Sign Out" : undefined} className={cn("w-full flex items-center h-9 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-colors duration-100", sidebarOpen ? "px-3 gap-3" : "justify-center")}>
          <LogOut size={15} className="shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250" style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}>
            Sign Out
          </span>
        </button>

        {/* Collapse toggle */}
        <button onClick={toggleSidebar} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} className={cn("w-full flex items-center h-9 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/6 transition-colors duration-100 mt-0.5", sidebarOpen ? "px-3 gap-3" : "justify-center")}>
          <PanelLeft size={15} className="shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250" style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}
