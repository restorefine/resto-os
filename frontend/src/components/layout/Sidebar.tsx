"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { logout } from "@/lib/auth";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Columns2,
  Calendar,
  Film,
  FileText,
  FileCheck2,
  PanelLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ALL_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Pipeline", href: "/pipeline", icon: Columns2 },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Videos", href: "/videos", icon: Film },
];

const ALL_TOOLS: NavItem[] = [
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Contracts", href: "/contracts", icon: FileCheck2 },
];

const ROLE_NAV: Record<UserRole, { main: NavItem[]; tools: NavItem[] }> = {
  admin: { main: ALL_MAIN, tools: ALL_TOOLS },
  staff: { main: ALL_MAIN, tools: ALL_TOOLS },
  client: {
    main: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
    tools: [],
  },
  video_editor: {
    main: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Videos", href: "/videos", icon: Film },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
    tools: [],
  },
  developer_designer: {
    main: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Videos", href: "/videos", icon: Film },
    ],
    tools: [],
  },
  project_manager: {
    main: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Pipeline", href: "/pipeline", icon: Columns2 },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Invoices", href: "/invoices", icon: Receipt },
    ],
    tools: [{ label: "Contracts", href: "/contracts", icon: FileCheck2 }],
  },
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  client: "Client",
  video_editor: "Video Editor",
  developer_designer: "Designer",
  project_manager: "Project Manager",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, currentUser, setCurrentUser } = useStore();

  const role = (currentUser?.role ?? "staff") as UserRole;
  const nav = ROLE_NAV[role] ?? ROLE_NAV.staff;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "RS";

  const handleLogout = async () => {
    try { await logout(); } catch {}
    setCurrentUser(null);
    router.push("/login");
    toast.success("Signed out");
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={!sidebarOpen ? item.label : undefined}
        className={cn(
          "flex items-center h-10 rounded-lg transition-colors duration-100 group relative",
          sidebarOpen ? "px-3 gap-3" : "justify-center px-0",
          active ? "bg-white/10 text-white" : "text-white/45 hover:text-white hover:bg-white/6"
        )}
      >
        <item.icon size={17} className={cn("shrink-0 transition-colors", active ? "text-red-500" : "group-hover:text-white/80")} />
        <span
          className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250"
          style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}
        >
          {item.label}
        </span>
        {active && sidebarOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
        {active && !sidebarOpen && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r" />}
      </Link>
    );
  };

  return (
    <aside
      style={{ width: sidebarOpen ? "260px" : "64px" }}
      className="hidden md:flex flex-col h-screen bg-[#0A0A0A] border-r border-white/6 overflow-hidden transition-[width] duration-250 ease-in-out shrink-0"
    >
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
        <div className="px-3 mb-1">
          {sidebarOpen && (
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-2 py-1.5">Navigate</p>
          )}
          <div className="space-y-0.5">{nav.main.map(renderItem)}</div>
        </div>

        {nav.tools.length > 0 && (
          <div className="px-3 mt-4">
            {sidebarOpen && (
              <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-2 py-1.5">Tools</p>
            )}
            {!sidebarOpen && <div className="h-px bg-white/6 mx-2 my-2" />}
            <div className="space-y-0.5">{nav.tools.map(renderItem)}</div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/6 p-3 shrink-0">
        {sidebarOpen && currentUser && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-red-600/80 flex items-center justify-center text-white text-[11px] font-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-none truncate">{currentUser.name}</p>
              <p className="text-white/35 text-[10px] leading-none mt-1 truncate">{ROLE_LABEL[role]}</p>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0" />
          </div>
        )}

        <button
          onClick={handleLogout}
          title={!sidebarOpen ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center h-9 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/6 transition-colors duration-100 cursor-pointer",
            sidebarOpen ? "px-3 gap-3" : "justify-center"
          )}
        >
          <LogOut size={15} className="shrink-0" />
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250"
            style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}
          >
            Sign Out
          </span>
        </button>

        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? "Collapse" : "Expand"}
          className={cn(
            "w-full flex items-center h-9 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/6 transition-colors duration-100 mt-0.5 cursor-pointer",
            sidebarOpen ? "px-3 gap-3" : "justify-center"
          )}
        >
          <PanelLeft size={15} className="shrink-0" />
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-250"
            style={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0, maxWidth: sidebarOpen ? 160 : 0 }}
          >
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}
