"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Task, CardType, CanvasEdge } from "@/types/task";
import { generateId } from "@/lib/utils";

import { createCard, updateCard, deleteCard, createEdge, deleteEdge } from "@/lib/firestoreService";
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore";

interface TaskState {
    tasks: Task[];
    edges: CanvasEdge[];
    selectedId: string | null;
    setTasks: (tasks: Task[]) => void;
    setEdges: (edges: CanvasEdge[]) => void;
    addTask: (type: CardType, position: { x: number; y: number }, title?: string) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    togglePin: (id: string) => void;
    toggleDock: (id: string) => void;
    toggleChecklist: (taskId: string, itemId: string) => void;
    addChecklistItem: (taskId: string, label: string) => void;
    setSelected: (id: string | null) => void;
    updatePosition: (id: string, position: { x: number; y: number }) => void;
    
    // Edge actions
    addConnection: (edge: CanvasEdge) => void;
    removeConnection: (edgeId: string) => void;
}

export const useTaskStore = create<TaskState>()(
    immer((set, get) => ({
        tasks: [],
        edges: [],
        selectedId: null,

        setTasks: (tasks) => set({ tasks }),
        setEdges: (edges) => set({ edges }),

        addTask: (type, position, title) => {
            const id = generateId();
            const activeCanvasId = useCanvasStore.getState().activeCanvasId;
            const user = useAuthStore.getState().user;
            if (!user) return id;

            const newTask: Task = {
                id,
                type,
                title: title || (type === "task" ? "New Task" : type === "note" ? "New Note" : type === "sticker" ? "⭐" : "New Checklist"),
                description: "",
                priority: "medium",
                status: "todo",
                dueDate: null,
                pinned: false,
                docked: false,
                color: type === "task" ? "#00D4FF" : type === "note" ? "#10B981" : type === "sticker" ? "#f59e0b" : "#A855F7",
                ...(type === "checklist" ? { checklistItems: [{ id: generateId(), label: "First item", done: false }] } : {}),
                position,
                createdAt: new Date().toISOString(),
            };

            // Optimistic update
            set((state) => {
                state.tasks.push(newTask);
                state.selectedId = id;
            });

            // Persist to Firestore
            createCard(user.uid, activeCanvasId, newTask).catch(console.error);

            return id;
        },

        updateTask: (id, updates) => {
            const activeCanvasId = useCanvasStore.getState().activeCanvasId;
            const user = useAuthStore.getState().user;

            set((state) => {
                const task = state.tasks.find((t) => t.id === id);
                if (task) Object.assign(task, updates);
            });

            if (user) {
                updateCard(user.uid, activeCanvasId, id, updates).catch(console.error);
            }
        },

        deleteTask: (id) => {
            const activeCanvasId = useCanvasStore.getState().activeCanvasId;
            const user = useAuthStore.getState().user;

            set((state) => {
                state.tasks = state.tasks.filter((t) => t.id !== id);
                if (state.selectedId === id) state.selectedId = null;
            });

            if (user) {
                deleteCard(user.uid, activeCanvasId, id).catch(console.error);
            }
        },

        togglePin: (id) => {
            const task = get().tasks.find((t) => t.id === id);
            if (task) get().updateTask(id, { pinned: !task.pinned });
        },

        toggleDock: (id) => {
            const task = get().tasks.find((t) => t.id === id);
            if (task) get().updateTask(id, { docked: !task.docked });
        },

        toggleChecklist: (taskId, itemId) => {
            const task = get().tasks.find((t) => t.id === taskId);
            if (task?.checklistItems) {
                const updatedItems = task.checklistItems.map(ci => 
                    ci.id === itemId ? { ...ci, done: !ci.done } : ci
                );
                get().updateTask(taskId, { checklistItems: updatedItems });
            }
        },

        addChecklistItem: (taskId, label) => {
            const task = get().tasks.find((t) => t.id === taskId);
            if (task) {
                const updatedItems = [...(task.checklistItems || []), { id: generateId(), label, done: false }];
                get().updateTask(taskId, { checklistItems: updatedItems });
            }
        },

        setSelected: (id) => {
            set((state) => { state.selectedId = id; });
        },


        updatePosition: (id, position) => {
            get().updateTask(id, { position });
        },

        addConnection: (edge) => {
            const activeCanvasId = useCanvasStore.getState().activeCanvasId;
            const user = useAuthStore.getState().user;
            if (!user) return;

            set((state) => {
                state.edges.push(edge);
            });

            import("@/lib/firestoreService").then((m) => {
                m.createEdge(user.uid, activeCanvasId, edge);
            });
        },

        removeConnection: (edgeId) => {
            const activeCanvasId = useCanvasStore.getState().activeCanvasId;
            const user = useAuthStore.getState().user;
            if (!user) return;

            set((state) => {
                state.edges = state.edges.filter((e) => e.id !== edgeId);
            });

            import("@/lib/firestoreService").then((m) => {
                m.deleteEdge(user.uid, activeCanvasId, edgeId);
            });
        },
    }))
);
