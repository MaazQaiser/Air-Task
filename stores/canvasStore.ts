"use client";
import { create } from "zustand";

interface CanvasState {
    zoom: number;
    theme: "dark" | "light";
    setTheme: (theme: "dark" | "light") => void;
    toggleTheme: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    zoom: 1,
    theme: "dark",
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
}));
