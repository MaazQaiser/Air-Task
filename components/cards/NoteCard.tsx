"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Pin, Trash2, EyeOff, FileText } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

const ACCENT = "#10b981";
const ACCENT_GLOW = "rgba(16,185,129,0.25)";

function NoteCard({ data, selected }: NodeProps<Task>) {
    const { updateTask, togglePin, toggleDock, deleteTask } = useTaskStore();
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [title, setTitle] = useState(data.title);
    const [desc, setDesc] = useState(data.description ?? "");

    const saveTitle = () => {
        setEditingTitle(false);
        if (title.trim()) updateTask(data.id, { title: title.trim() });
    };

    const saveDesc = () => {
        setEditingDesc(false);
        updateTask(data.id, { description: desc });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className={cn("glass overflow-hidden group cursor-default", selected && "glass-elevated")}
            style={{
                width: 300,
                borderColor: selected ? ACCENT : undefined,
                boxShadow: selected ? `var(--card-shadow-elevated), 0 0 24px ${ACCENT_GLOW}` : undefined,
            }}
        >
            {/* Connection Handles */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT_GLOW}` }}
            />
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT_GLOW}` }}
            />

            {/* Accent stripe */}
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT}cc, transparent)` }} />

            {/* Content */}
            <div style={{ padding: 32 }}>
                {/* Header row */}
                <div className="flex items-start gap-2 mb-3">
                    {/* Note icon */}
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(16,185,129,0.1)", color: ACCENT }}
                    >
                        <FileText size={13} />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>Note</span>
                        </div>
                        {editingTitle ? (
                            <input
                                autoFocus
                                className="w-full bg-transparent outline-none text-[18px] font-extrabold border-b pb-0.5"
                                style={{ color: "var(--text-primary)", borderColor: ACCENT }}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                            />
                        ) : (
                            <h3
                                className="text-[18px] font-extrabold leading-snug cursor-text select-none"
                                style={{ color: "var(--text-primary)" }}
                                onDoubleClick={() => setEditingTitle(true)}
                            >
                                {data.title}
                            </h3>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn(
                        "flex flex-col gap-1 flex-shrink-0 transition-all duration-200",
                        selected ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )}>
                        <button
                            onClick={() => togglePin(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                            style={{ color: data.pinned ? ACCENT : "var(--text-muted)" }}
                        >
                            <Pin size={11} fill={data.pinned ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={() => toggleDock(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <EyeOff size={11} />
                        </button>
                        <button
                            onClick={() => deleteTask(data.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/15 transition-colors"
                            style={{ color: "rgba(239,68,68,0.6)" }}
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="mb-3" style={{ height: "1px", background: "rgba(16,185,129,0.08)" }} />

                {/* Body */}
                {editingDesc ? (
                    <textarea
                        autoFocus
                        className="w-full bg-transparent outline-none resize-none text-[12px] leading-relaxed rounded-lg p-2 border"
                        style={{
                            color: "var(--text-primary)",
                            minHeight: "72px",
                            background: "rgba(16,185,129,0.04)",
                            borderColor: "rgba(16,185,129,0.2)",
                        }}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        onBlur={saveDesc}
                    />
                ) : (
                    <p
                        className="text-[12px] leading-relaxed cursor-text min-h-[48px]"
                        style={{ color: data.description ? "var(--text-secondary)" : "var(--text-muted)" }}
                        onDoubleClick={() => setEditingDesc(true)}
                    >
                        {data.description || (
                            <span className="italic">Double-click to add content...</span>
                        )}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
                    <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {new Date(data.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: ACCENT, boxShadow: `0 0 5px ${ACCENT}` }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default memo(NoteCard);
