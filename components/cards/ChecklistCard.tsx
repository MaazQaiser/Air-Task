"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Pin, Trash2, EyeOff, Plus } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

function ChecklistCard({ data, selected }: NodeProps<Task>) {
    const { toggleChecklist, addChecklistItem, togglePin, toggleDock, deleteTask } = useTaskStore();
    const [newItem, setNewItem] = useState("");
    const [addingItem, setAddingItem] = useState(false);

    const items = data.checklistItems ?? [];
    const done = items.filter((i) => i.done).length;
    const total = items.length;
    const progress = total === 0 ? 0 : (done / total) * 100;
    const circumference = 2 * Math.PI * 16;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn("glass overflow-hidden group cursor-default", selected && "glass-elevated")}
            style={{
                width: 360,
                borderColor: selected ? "#a855f7" : undefined,
                boxShadow: selected ? "var(--card-shadow-elevated), 0 0 24px #a855f740" : undefined,
            }}
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />

            {/* Purple stripe */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #a855f7, transparent)" }} />

            {/* Header */}
            <div className="flex items-center justify-between gap-3" style={{ padding: "32px 32px 16px 32px" }}>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {data.title}
                    </h3>
                    <span className="text-[11px] font-mono mt-1 block" style={{ color: "var(--text-muted)" }}>
                        {done}/{total} completed
                    </span>
                </div>

                {/* Progress ring */}
                <div className="relative flex-shrink-0 w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="3" />
                        <circle
                            cx="20" cy="20" r="16" fill="none"
                            stroke="#a855f7" strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (circumference * progress) / 100}
                            style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: "#a855f7" }}>
                        {Math.round(progress)}%
                    </span>
                </div>

                {/* Actions */}
                <div className={cn("flex flex-col gap-1.5 transition-opacity flex-shrink-0", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <button onClick={() => togglePin(data.id)} className="p-1.5 rounded hover:bg-white/10"
                        style={{ color: data.pinned ? "#a855f7" : "var(--text-muted)" }}>
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

            {/* Checklist items */}
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto" style={{ padding: "0 32px 32px 32px" }}>
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2.5"
                    >
                        <input
                            type="checkbox"
                            className="glass-checkbox"
                            checked={item.done}
                            onChange={() => toggleChecklist(data.id, item.id)}
                        />
                        <span
                            className={cn("text-[13px] leading-tight transition-all", item.done && "line-through opacity-40")}
                            style={{ color: "var(--text-primary)" }}
                        >
                            {item.label}
                        </span>
                    </motion.div>
                ))}

                {/* Add item */}
                {addingItem ? (
                    <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded border border-[var(--glass-border)] flex-shrink-0" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent outline-none text-[13px] border-b border-[var(--accent-primary)]"
                            style={{ color: "var(--text-primary)" }}
                            placeholder="Add item..."
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newItem.trim()) {
                                    addChecklistItem(data.id, newItem.trim());
                                    setNewItem("");
                                }
                                if (e.key === "Escape") { setAddingItem(false); setNewItem(""); }
                            }}
                            onBlur={() => { if (!newItem.trim()) setAddingItem(false); }}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingItem(true)}
                        className="flex items-center gap-1.5 text-[12px] transition-colors mt-1"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <Plus size={12} /> Add item
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export default memo(ChecklistCard);
