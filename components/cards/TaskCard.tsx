"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Trash2, EyeOff, CheckCircle2, Circle, Calendar, Zap, Clock, AlertTriangle, Check, MessageCircle } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import dynamic from "next/dynamic";

const CardCommentsPanel = dynamic(() => import("./CardCommentsPanel"), { ssr: false });

const PRIORITY_CONFIG = {
    low:      { label: "Low",      color: "#10b981", icon: <Circle size={9} />, glow: "rgba(16,185,129,0.3)" },
    medium:   { label: "Medium",   color: "#f59e0b", icon: <Zap size={9} />, glow: "rgba(245,158,11,0.3)" },
    high:     { label: "High",     color: "#00d4ff", icon: <Zap size={9} />, glow: "rgba(0,212,255,0.3)" },
    critical: { label: "Critical", color: "#ef4444", icon: <AlertTriangle size={9} />, glow: "rgba(239,68,68,0.35)" },
};

const STATUS_CONFIG = {
    todo:       { label: "To Do",       bg: "rgba(226,232,240,0.08)", text: "rgba(226,232,240,0.45)", border: "rgba(226,232,240,0.12)" },
    inprogress: { label: "In Progress", bg: "rgba(0,212,255,0.1)",    text: "#00d4ff",                border: "rgba(0,212,255,0.2)" },
    done:       { label: "Done",        bg: "rgba(16,185,129,0.1)",   text: "#10b981",                border: "rgba(16,185,129,0.2)" },
};

function TaskCard({ data, selected }: NodeProps<Task>) {
    const { updateTask, deleteTask, togglePin, toggleDock, isSelectionMode, selectedIds, toggleSelectCard } = useTaskStore();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(data.title);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const overdue = isOverdue(data.dueDate) && data.status !== "done";
    const priority = PRIORITY_CONFIG[data.priority];
    const status = STATUS_CONFIG[data.status];

    const isSelectedForAction = selectedIds.includes(data.id);

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
            initial={{ opacity: 0, scale: 0.88, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className={cn(
                "glass overflow-hidden group cursor-default relative",
                selected && "glass-elevated",
                overdue && "animate-pulse-glow",
                data.status === "done" && "opacity-55"
            )}
            style={{
                width: 320,
                borderColor: isSelectionMode 
                    ? (isSelectedForAction ? "#6366f1" : "transparent") 
                    : (selected ? priority.color : undefined),
                boxShadow: isSelectionMode && isSelectedForAction 
                    ? "0 0 0 3px rgba(99,102,241,0.4)"
                    : (selected && !isSelectionMode ? `var(--card-shadow-elevated), 0 0 28px ${priority.glow}` : undefined),
                borderWidth: isSelectionMode ? (isSelectedForAction ? 3 : 1) : 1,
            }}
            onClickCapture={(e) => {
                if (isSelectionMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleSelectCard(data.id);
                }
            }}
        >
            {/* Selection Checkbox (Active in Selection Mode) */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-3 -right-3 z-50 flex items-center justify-center rounded-full transition-colors"
                        style={{
                            width: 24,
                            height: 24,
                            background: isSelectedForAction ? "#6366f1" : "rgba(255,255,255,0.1)",
                            border: `2px solid ${isSelectedForAction ? "#6366f1" : "rgba(255,255,255,0.3)"}`,
                            boxShadow: isSelectedForAction ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                        }}
                    >
                        {isSelectedForAction && <Check size={14} color="#fff" strokeWidth={3} />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connection Handles */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: priority.color, boxShadow: `0 0 8px ${priority.glow}` }}
            />
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: priority.color, boxShadow: `0 0 8px ${priority.glow}` }}
            />

            {/* Priority accent stripe */}
            <div
                className="h-[2px] w-full"
                style={{ background: `linear-gradient(90deg, ${priority.color}cc, ${priority.color}00)` }}
            />

            {/* Main content */}
            <div style={{ padding: 32 }}>
                {/* Top row: title + actions */}
                <div className="flex items-start gap-2">
                    {/* Status toggle circle */}
                    <button
                        onClick={cycleStatus}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all hover:scale-110"
                        style={{
                            borderColor: data.status === "done" ? "#10b981" : "var(--glass-border)",
                            background: data.status === "done" ? "rgba(16,185,129,0.15)" : "transparent",
                            color: data.status === "done" ? "#10b981" : "var(--text-muted)",
                        }}
                        title="Cycle status"
                    >
                        {data.status === "done" ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <input
                                autoFocus
                                className="w-full bg-transparent outline-none text-[18px] font-extrabold leading-snug border-b pb-0.5"
                                style={{
                                    color: "var(--text-primary)",
                                    borderColor: priority.color,
                                }}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                            />
                        ) : (
                            <h3
                                className={cn(
                                    "text-[18px] font-extrabold leading-snug cursor-text select-none",
                                    data.status === "done" && "line-through opacity-50"
                                )}
                                style={{ color: "var(--text-primary)" }}
                                onDoubleClick={() => setEditing(true)}
                            >
                                {data.title}
                            </h3>
                        )}

                        {data.description && (
                            <p
                                className="text-[11px] mt-1.5 leading-relaxed line-clamp-2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {data.description}
                            </p>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className={cn(
                        "flex flex-col gap-1 flex-shrink-0 transition-all duration-200",
                        selected ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )}>
                        <button
                            onClick={() => togglePin(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                            style={{ color: data.pinned ? priority.color : "var(--text-muted)" }}
                            title={data.pinned ? "Unpin" : "Pin"}
                        >
                            <Pin size={11} fill={data.pinned ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={() => setCommentsOpen(true)}
                            className="relative w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Comments"
                        >
                            <MessageCircle size={11} />
                            {(data.commentCount || 0) > 0 && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => toggleDock(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Send to dock"
                        >
                            <EyeOff size={11} />
                        </button>
                        <button
                            onClick={() => deleteTask(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/15 transition-colors"
                            style={{ color: "rgba(239,68,68,0.6)" }}
                            title="Delete"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
                    {/* Status badge */}
                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                            background: status.bg,
                            color: status.text,
                            border: `1px solid ${status.border}`,
                        }}
                    >
                        {data.status === "inprogress" && <Clock size={8} />}
                        {data.status === "done" && <CheckCircle2 size={8} />}
                        {status.label}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {data.dueDate && (
                            <div
                                className="flex items-center gap-1 text-[10px] font-mono"
                                style={{ color: overdue ? "#ef4444" : "var(--text-muted)" }}
                            >
                                <Calendar size={9} />
                                {formatDueDate(data.dueDate)}
                            </div>
                        )}

                        {/* Priority dot */}
                        <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: priority.color, boxShadow: `0 0 5px ${priority.color}` }}
                            title={priority.label}
                        />
                    </div>
                </div>
            </div>

            {/* Pinned indicator */}
            <AnimatePresence>
                {data.pinned && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-2.5 left-3 w-1 h-1 rounded-full"
                        style={{ background: priority.color, boxShadow: `0 0 6px ${priority.color}` }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {commentsOpen && (
                    <CardCommentsPanel
                        cardId={data.id}
                        cardTitle={data.title}
                        onClose={() => setCommentsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default memo(TaskCard);
