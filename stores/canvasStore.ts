"use client";
import { create } from "zustand";
import { Canvas } from "@/types/canvas";
import { createCanvas, updateCanvas, deleteCanvas } from "@/lib/canvasService";
import { useAuthStore } from "@/stores/authStore";
import { generateId } from "@/lib/utils";

interface CanvasState {
    /* --- data --- */
    canvases: Canvas[];
    activeCanvasId: string;
    sidebarOpen: boolean;

    /* --- theme (kept from original) --- */
    zoom: number;
    theme: "dark" | "light";
    setTheme: (theme: "dark" | "light") => void;
    toggleTheme: () => void;

    /* --- canvas management --- */
    setCanvases: (c: Canvas[]) => void;
    setActiveCanvas: (id: string) => void;
    toggleSidebar: () => void;
    addCanvas: (name: string, icon?: string, color?: string) => string;
    renameCanvas: (id: string, name: string) => void;
    removeCanvas: (id: string) => void;
}

const DEFAULT_ICONS = ["📁", "🚀", "💡", "📝", "🎨", "⚡", "🏠", "📋"];
const DEFAULT_COLORS = ["#6366f1", "#00d4ff", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#14b8a6"];

export const useCanvasStore = create<CanvasState>((set, get) => ({
    canvases: [],
    activeCanvasId: "default-canvas",
    sidebarOpen: false,

    zoom: 1,
    theme: "dark",
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

    setCanvases: (canvases) => {
        set({ canvases });
        // If active canvas no longer exists, switch to first available
        const ids = canvases.map((c) => c.id);
        if (ids.length > 0 && !ids.includes(get().activeCanvasId)) {
            set({ activeCanvasId: ids[0] });
        }
    },

    setActiveCanvas: (id) => set({ activeCanvasId: id }),
    toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

    addCanvas: (name, icon, color) => {
        const user = useAuthStore.getState().user;
        if (!user) return "";

        const id = generateId();
        const sortOrder = get().canvases.length;
        const now = new Date().toISOString();

        const canvas: Canvas = {
            id,
            name,
            icon: icon || DEFAULT_ICONS[sortOrder % DEFAULT_ICONS.length],
            color: color || DEFAULT_COLORS[sortOrder % DEFAULT_COLORS.length],
            sortOrder,
            createdAt: now,
            updatedAt: now,
        };

        // Optimistic update
        set((state) => ({
            canvases: [...state.canvases, canvas],
            activeCanvasId: id,
        }));

        createCanvas(user.uid, canvas).catch(console.error);
        return id;
    },

    renameCanvas: (id, name) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set((state) => ({
            canvases: state.canvases.map((c) =>
                c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
            ),
        }));

        updateCanvas(user.uid, id, { name }).catch(console.error);
    },

    removeCanvas: (id) => {
        const user = useAuthStore.getState().user;
        const { canvases, activeCanvasId } = get();
        if (!user || canvases.length <= 1) return; // Prevent deleting last canvas

        set((state) => ({
            canvases: state.canvases.filter((c) => c.id !== id),
            activeCanvasId:
                activeCanvasId === id
                    ? state.canvases.find((c) => c.id !== id)?.id ?? "default-canvas"
                    : activeCanvasId,
        }));

        deleteCanvas(user.uid, id).catch(console.error);
    },
}));
