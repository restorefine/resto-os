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
  LogOut,
  X,
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

export function MobileDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileMenuOpen, setMobileMenuOpen, currentUser, setCurrentUser } = useStore();

  const role = (currentUser?.role ?? "staff") as UserRole;
  const nav = ROLE_NAV[role] ?? ROLE_NAV.staff;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "RS";

  const close = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    setCurrentUser(null);
    close();
    router.push("/login");
    toast.success("Signed out");
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={close}
        className={cn(
          "flex items-center gap-4 h-12 px-4 rounded-xl transition-colors",
          active
            ? "bg-white/10 text-white"
            : "text-white/50 hover:text-white hover:bg-white/6"
        )}
      >
        <item.icon size={19} className={cn("shrink-0", active && "text-red-500")} />
        <span className="text-[15px] font-semibold">{item.label}</span>
        {active && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 shrink-0" />}
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-[110] md:hidden transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[120] w-72 bg-[#0A0A0A] flex flex-col md:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/6 shrink-0">
          <Image
            src="/logoWhitesidebar.svg"
            alt="AgencyOS"
            width={140}
            height={60}
            priority
            className="h-16 w-auto object-contain select-none"
            draggable={false}
          />
          <button
            onClick={close}
            className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-3">
          <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-4 py-1.5 mb-1">
            Navigate
          </p>
          <div className="space-y-0.5">{nav.main.map(renderItem)}</div>

          {nav.tools.length > 0 && (
            <div className="mt-5">
              <div className="h-px bg-white/6 mx-1 mb-4" />
              <p className="text-[10px] tracking-[0.18em] uppercase text-white/20 px-4 py-1.5 mb-1">
                Tools
              </p>
              <div className="space-y-0.5">{nav.tools.map(renderItem)}</div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/6 p-3 pb-6 shrink-0">
          {currentUser && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/4">
              <div className="w-9 h-9 rounded-full bg-red-600/80 flex items-center justify-center text-white text-xs font-black shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold leading-none truncate">{currentUser.name}</p>
                <p className="text-white/35 text-xs leading-none mt-1 truncate">{ROLE_LABEL[role]}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500/60 shrink-0" />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 h-12 px-4 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/6 transition-colors cursor-pointer"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="text-[15px] font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
