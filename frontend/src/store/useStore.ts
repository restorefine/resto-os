import { create } from "zustand";
import { User, AppNotification } from "@/lib/types";

interface AppState {
  currentUser: User | null;
  sidebarOpen: boolean;
  notifications: AppNotification[];
  setCurrentUser: (user: User | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  sidebarOpen: true,
  notifications: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
