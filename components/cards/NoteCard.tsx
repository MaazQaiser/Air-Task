"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Pin, Trash2, EyeOff } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

function NoteCard({ data, selected }: NodeProps<Task>) {
    const { updateTask, togglePin, toggleDock, deleteTask } = useTaskStore();
    const [editingDesc, setEditingDesc] = useState(false);
    const [desc, setDesc] = useState(data.description ?? "");

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn("glass overflow-hidden group cursor-default", selected && "glass-elevated")}
            style={{
                width: 360,
                borderColor: selected ? "#10b981" : undefined,
                boxShadow: selected ? "var(--card-shadow-elevated), 0 0 24px #10b98140" : undefined,
            }}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            {/* Green stripe */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #10b981, transparent)" }} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3" style={{ padding: "32px 32px 16px 32px" }}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 6px #10b981" }} />
                        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#10b981" }}>Note</span>
                    </div>
                    <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {data.title}
                    </h3>
                </div>

                {/* Actions */}
                <div className={cn("flex flex-col gap-1.5 transition-opacity flex-shrink-0", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <button onClick={() => togglePin(data.id)} className="p-1.5 rounded hover:bg-white/10"
                        style={{ color: data.pinned ? "#10b981" : "var(--text-muted)" }}>
                        <Pin size={13} fill={data.pinned ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => toggleDock(data.id)} className="p-1.5 rounded hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                        <EyeOff size={13} />
                    </button>
                    <button onClick={() => deleteTask(data.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Description — inline editable */}
            <div style={{ padding: "0 32px 32px 32px" }}>
                {editingDesc ? (
                    <textarea
                        autoFocus
                        className="w-full bg-transparent outline-none resize-none text-[13px] leading-relaxed border border-[var(--glass-border)] rounded-lg p-3"
                        style={{ color: "var(--text-primary)", minHeight: "80px", background: "var(--glass-surface)" }}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        onBlur={() => { setEditingDesc(false); updateTask(data.id, { description: desc }); }}
                    />
                ) : (
                    <p
                        className="text-[13px] leading-relaxed cursor-text min-h-[60px]"
                        style={{ color: "var(--text-secondary)" }}
                        onDoubleClick={() => setEditingDesc(true)}
                    >
                        {data.description || <span style={{ color: "var(--text-muted)" }}>Double-click to edit...</span>}
                    </p>
                )}
                <div className="mt-3 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(NoteCard);
