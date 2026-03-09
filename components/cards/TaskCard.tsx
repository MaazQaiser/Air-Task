"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Pin, Trash2, EyeOff, CheckCircle, Circle, Calendar } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "#10b981" },
    medium: { label: "Medium", color: "#f59e0b" },
    high: { label: "High", color: "#00d4ff" },
    critical: { label: "Critical", color: "#ef4444" },
};

const STATUS_CONFIG = {
    todo: { label: "To Do", bg: "rgba(226,232,240,0.1)", text: "var(--text-secondary)" },
    inprogress: { label: "In Progress", bg: "rgba(0,212,255,0.12)", text: "#00d4ff" },
    done: { label: "Done", bg: "rgba(16,185,129,0.12)", text: "#10b981" },
};

function TaskCard({ data, selected }: NodeProps<Task>) {
    const { updateTask, deleteTask, togglePin, toggleDock } = useTaskStore();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(data.title);
    const overdue = isOverdue(data.dueDate) && data.status !== "done";
    const priority = PRIORITY_CONFIG[data.priority];
    const status = STATUS_CONFIG[data.status];

    const handleTitleBlur = () => {
        setEditing(false);
        if (title.trim()) updateTask(data.id, { title: title.trim() });
    };

    const cycleStatus = () => {
        const order: Task["status"][] = ["todo", "inprogress", "done"];
        const next = order[(order.indexOf(data.status) + 1) % order.length];
        updateTask(data.id, { status: next });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
                "glass overflow-hidden group cursor-default",
                selected && "glass-elevated",
                overdue && "animate-pulse-glow",
                data.status === "done" && "opacity-60"
            )}
            style={{
                width: 360,
                borderColor: selected ? priority.color : undefined,
                boxShadow: selected ? `var(--card-shadow-elevated), 0 0 24px ${priority.color}40` : undefined,
            }}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            {/* Priority stripe */}
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${priority.color}, transparent)` }} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3" style={{ padding: "32px 32px 16px 32px" }}>
                <div className="flex-1 min-w-0">
                    {editing ? (
                        <input
                            autoFocus
                            className="w-full bg-transparent outline-none text-[15px] font-semibold border-b border-[var(--accent-primary)] pb-0.5"
                            style={{ color: "var(--text-primary)" }}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                        />
                    ) : (
                        <h3
                            className={cn(
                                "text-[15px] font-semibold leading-tight cursor-text",
                                data.status === "done" && "line-through opacity-60"
                            )}
                            style={{ color: "var(--text-primary)" }}
                            onDoubleClick={() => setEditing(true)}
                        >
                            {data.title}
                        </h3>
                    )}
                    {data.description && (
                        <p className="text-[12px] mt-2 leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                            {data.description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className={cn(
                    "flex flex-col gap-1.5 transition-opacity duration-200 flex-shrink-0",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <button
                        onClick={() => togglePin(data.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                        style={{ color: data.pinned ? priority.color : "var(--text-muted)" }}
                        title={data.pinned ? "Unpin" : "Pin"}
                    >
                        <Pin size={13} fill={data.pinned ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={() => toggleDock(data.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        title="Send to dock"
                    >
                        <EyeOff size={13} />
                    </button>
                    <button
                        onClick={() => deleteTask(data.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors text-red-400"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2" style={{ padding: "8px 32px 32px 32px" }}>
                <button
                    onClick={cycleStatus}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-all hover:scale-105"
                    style={{ background: status.bg, color: status.text }}
                >
                    {data.status === "done" ? <CheckCircle size={11} /> : <Circle size={11} />}
                    {status.label}
                </button>

                {data.dueDate && (
                    <div
                        className="flex items-center gap-1 text-[11px] font-mono"
                        style={{ color: overdue ? "var(--accent-danger)" : "var(--text-muted)" }}
                    >
                        <Calendar size={10} />
                        {formatDueDate(data.dueDate)}
                    </div>
                )}

                <div
                    className="w-2 h-2 rounded-full flex-shrink-0 ml-auto"
                    style={{ background: priority.color, boxShadow: `0 0 6px ${priority.color}` }}
                    title={priority.label}
                />
            </div>

            {data.pinned && (
                <div
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: priority.color, boxShadow: `0 0 6px ${priority.color}` }}
                />
            )}
        </motion.div>
    );
}

export default memo(TaskCard);
