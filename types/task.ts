export type CardType = "task" | "checklist" | "note" | "sticker";
export type Priority = "low" | "medium" | "high" | "critical";
export type Status = "todo" | "inprogress" | "done";

export interface ChecklistItem {
    id: string;
    label: string;
    done: boolean;
}

export interface Task {
    id: string;
    type: CardType;
    title: string;
    description?: string;
    priority: Priority;
    status: Status;
    dueDate: string | null;
    pinned: boolean;
    docked: boolean;
    color: string;
    checklistItems?: ChecklistItem[];
    position: { x: number; y: number };
    createdAt: string;
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: React.CSSProperties;
}

export type PartialTask = Partial<Task> & { id: string };
