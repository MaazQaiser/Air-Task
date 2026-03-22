"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Task, CardType, Priority, ChecklistItem } from "@/types/task";
import { generateId } from "@/lib/utils";

const DEMO_TASKS: Task[] = [
    {
        id: "demo-1",
        type: "task",
        title: "Design the onboarding screen",
        description: "Create a compelling first-run experience for new users",
        priority: "high",
        status: "inprogress",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        pinned: false,
        docked: false,
        color: "#00D4FF",
        position: { x: 200, y: 150 },
        createdAt: new Date().toISOString(),
    },
    {
        id: "demo-2",
        type: "checklist",
        title: "Product Launch Checklist",
        priority: "critical",
        status: "todo",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        pinned: false,
        docked: false,
        color: "#A855F7",
        checklistItems: [
            { id: "ci-1", label: "Landing page live", done: true },
            { id: "ci-2", label: "Analytics wired up", done: true },
            { id: "ci-3", label: "Email campaign ready", done: false },
            { id: "ci-4", label: "Press kit prepared", done: false },
            { id: "ci-5", label: "Social posts scheduled", done: false },
        ],
        position: { x: 580, y: 100 },
        createdAt: new Date().toISOString(),
    },
    {
        id: "demo-3",
        type: "note",
        title: "Ideas for onboarding animation",
        description:
            "Think about using a particle burst when the first task is created. Maybe a subtle JARVIS-style scan line sweeping through the canvas on first load. The floating bubble entrance should feel weightless.",
        priority: "low",
        status: "todo",
        dueDate: null,
        pinned: false,
        docked: false,
        color: "#10B981",
        position: { x: 950, y: 200 },
        createdAt: new Date().toISOString(),
    },
    {
        id: "demo-4",
        type: "task",
        title: "Review design system tokens",
        description: "Audit all color variables and spacing scale",
        priority: "medium",
        status: "done",
        dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        pinned: false,
        docked: false,
        color: "#F59E0B",
        position: { x: 280, y: 420 },
        createdAt: new Date().toISOString(),
    },
    {
        id: "demo-5",
        type: "task",
        title: "Integrate gesture controls",
        description: "Wire MediaPipe Hands to canvas drag and zoom actions",
        priority: "high",
        status: "todo",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        pinned: true,
        docked: false,
        color: "#00D4FF",
        position: { x: 700, y: 420 },
        createdAt: new Date().toISOString(),
    },
];

import { createCard, updateCard, deleteCard } from "@/lib/firestoreService";
import { useAuthStore } from "@/stores/authStore";

interface TaskState {
    tasks: Task[];
    selectedId: string | null;
    activeCanvasId: string;
    setTasks: (tasks: Task[]) => void;
    setActiveCanvasId: (id: string) => void;
    addTask: (type: CardType, position: { x: number; y: number }, title?: string) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    togglePin: (id: string) => void;
    toggleDock: (id: string) => void;
    toggleChecklist: (taskId: string, itemId: string) => void;
    addChecklistItem: (taskId: string, label: string) => void;
    setSelected: (id: string | null) => void;
    updatePosition: (id: string, position: { x: number; y: number }) => void;
}

export const useTaskStore = create<TaskState>()(
    immer((set, get) => ({
        tasks: [],
        selectedId: null,
        activeCanvasId: "default-canvas",

        setTasks: (tasks) => set({ tasks }),
        setActiveCanvasId: (id) => set({ activeCanvasId: id }),

        addTask: (type, position, title) => {
            const id = generateId();
            const { activeCanvasId } = get();
            const user = useAuthStore.getState().user;
            if (!user) return id;

            const newTask: Task = {
                id,
                type,
                title: title || (type === "task" ? "New Task" : type === "note" ? "New Note" : "New Checklist"),
                description: "",
                priority: "medium",
                status: "todo",
                dueDate: null,
                pinned: false,
                docked: false,
                color: type === "task" ? "#00D4FF" : type === "note" ? "#10B981" : "#A855F7",
                checklistItems: type === "checklist" ? [{ id: generateId(), label: "First item", done: false }] : undefined,
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
            const { activeCanvasId } = get();
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
            const { activeCanvasId } = get();
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
    }))
);
