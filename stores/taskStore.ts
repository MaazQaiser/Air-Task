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

interface TaskState {
    tasks: Task[];
    selectedId: string | null;
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
    persist(
        immer((set) => ({
            tasks: DEMO_TASKS,
            selectedId: null,

            addTask: (type, position, title) => {
                const id = generateId();
                set((state) => {
                    const defaults: Task = {
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
                    state.tasks.push(defaults);
                    state.selectedId = id;
                });
                return id;
            },

            updateTask: (id, updates) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    if (task) Object.assign(task, updates);
                });
            },

            deleteTask: (id) => {
                set((state) => {
                    state.tasks = state.tasks.filter((t) => t.id !== id);
                    if (state.selectedId === id) state.selectedId = null;
                });
            },

            togglePin: (id) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    if (task) task.pinned = !task.pinned;
                });
            },

            toggleDock: (id) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    if (task) task.docked = !task.docked;
                });
            },

            toggleChecklist: (taskId, itemId) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === taskId);
                    if (task?.checklistItems) {
                        const item = task.checklistItems.find((ci) => ci.id === itemId);
                        if (item) item.done = !item.done;
                    }
                });
            },

            addChecklistItem: (taskId, label) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === taskId);
                    if (task) {
                        if (!task.checklistItems) task.checklistItems = [];
                        task.checklistItems.push({ id: generateId(), label, done: false });
                    }
                });
            },

            setSelected: (id) => {
                set((state) => { state.selectedId = id; });
            },

            updatePosition: (id, position) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    if (task) task.position = position;
                });
            },
        })),
        {
            name: "airtasks-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
