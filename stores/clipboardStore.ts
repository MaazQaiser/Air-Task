"use client";
import { create } from "zustand";
import { Task } from "@/types/task";
import { cloneTask } from "@/lib/cardCloner";
import { createCard, deleteCard } from "@/lib/firestoreService";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useCanvasStore } from "@/stores/canvasStore";

interface ClipboardState {
    copiedCard: Task | null;
    sourceCanvasId: string | null;
    isCut: boolean;
    copyCard: (card: Task, canvasId: string, cut?: boolean) => void;
    pasteCard: (targetCanvasId: string, position?: {x: number, y: number}) => Promise<string | null>;
    clear: () => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
    copiedCard: null,
    sourceCanvasId: null,
    isCut: false,

    copyCard: (card: Task, canvasId: string, cut = false) => {
        set({ copiedCard: card, sourceCanvasId: canvasId, isCut: cut });
    },

    pasteCard: async (targetCanvasId: string, position?: {x: number, y: number}) => {
        const { copiedCard, sourceCanvasId, isCut, clear } = get();
        const user = useAuthStore.getState().user;
        
        if (!copiedCard || !user) return null;

        const isSameCanvas = sourceCanvasId === targetCanvasId;
        
        // Clone the card, pass true to offset if same canvas and no explicit position
        const newTask = cloneTask(copiedCard, isSameCanvas && !position);
        
        // Use explicit position if provided (e.g. from gesture paste)
        if (position) {
            newTask.position = position;
        }

        // 1. If we're pasting into the ACTIVE canvas, optimistically update taskStore
        const activeCanvasId = useCanvasStore.getState().activeCanvasId;
        if (targetCanvasId === activeCanvasId) {
            useTaskStore.getState().setTasks([...useTaskStore.getState().tasks, newTask]);
            useTaskStore.getState().setSelected(newTask.id);
        }

        // 2. Persist to target canvas in Firestore
        await createCard(user.uid, targetCanvasId, newTask);

        // 3. If CUT, remove original
        if (isCut && sourceCanvasId) {
            // Remove from active store if we cut from active canvas
            if (sourceCanvasId === activeCanvasId) {
                useTaskStore.getState().deleteTask(copiedCard.id);
            }
            // Remove from Firestore
            await deleteCard(user.uid, sourceCanvasId, copiedCard.id);
            clear(); // Clear clipboard after cut-paste is complete
        }

        return newTask.id;
    },

    clear: () => set({ copiedCard: null, sourceCanvasId: null, isCut: false })
}));
