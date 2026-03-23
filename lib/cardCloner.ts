import { Task, ChecklistItem } from "@/types/task";
import { generateId } from "./utils";

export function cloneTask(task: Task, offset: boolean = false): Task {
    // Generate new IDs for checklist items if they exist
    let newChecklistItems: ChecklistItem[] | undefined;
    if (task.checklistItems) {
        newChecklistItems = task.checklistItems.map(item => ({
            ...item,
            id: generateId()
        }));
    }

    return {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        dueDate: task.dueDate,
        checklistItems: newChecklistItems,
        position: offset ? { x: task.position.x + 40, y: task.position.y + 40 } : task.position,
        pinned: task.pinned,
        docked: false, 
    } as Task;
}
