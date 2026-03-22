"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Trash2, EyeOff, Plus, CheckSquare } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

const ACCENT = "#a855f7";
const ACCENT_GLOW = "rgba(168,85,247,0.25)";

function ChecklistCard({ data, selected }: NodeProps<Task>) {
    const { toggleChecklist, addChecklistItem, togglePin, toggleDock, deleteTask } = useTaskStore();
    const [newItem, setNewItem] = useState("");
    const [addingItem, setAddingItem] = useState(false);

    const items = data.checklistItems ?? [];
    const done = items.filter((i) => i.done).length;
    const total = items.length;
    const progress = total === 0 ? 0 : (done / total) * 100;
    const circumference = 2 * Math.PI * 14;

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
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

            {/* Purple stripe */}
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT}cc, transparent)` }} />

            <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    {/* Icon */}
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(168,85,247,0.1)", color: ACCENT }}
                    >
                        <CheckSquare size={13} />
                    </div>

                    {/* Title + count */}
                    <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>Checklist</div>
                        <h3 className="text-[13px] font-semibold truncate leading-snug" style={{ color: "var(--text-primary)" }}>
                            {data.title}
                        </h3>
                    </div>

                    {/* Progress ring */}
                    <div className="relative w-9 h-9 flex-shrink-0">
                        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth="2.5" />
                            <circle
                                cx="18" cy="18" r="14" fill="none"
                                stroke={ACCENT} strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference - (circumference * progress) / 100}
                                style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                            />
                        </svg>
                        <span
                            className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold"
                            style={{ color: ACCENT }}
                        >
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Quick actions */}
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

                {/* Progress bar */}
                <div className="w-full h-[2px] rounded-full mb-3" style={{ background: "rgba(168,85,247,0.1)" }}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: ACCENT }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                    <AnimatePresence initial={false}>
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-2 group/item py-0.5"
                            >
                                <button
                                    onClick={() => toggleChecklist(data.id, item.id)}
                                    className="w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all hover:scale-110"
                                    style={{
                                        borderColor: item.done ? ACCENT : "rgba(168,85,247,0.3)",
                                        background: item.done ? "rgba(168,85,247,0.2)" : "transparent",
                                        color: ACCENT,
                                    }}
                                >
                                    {item.done && (
                                        <motion.svg
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
                                        >
                                            <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                        </motion.svg>
                                    )}
                                </button>
                                <span
                                    className={cn("text-[12px] leading-tight transition-all flex-1", item.done && "line-through opacity-35")}
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {item.label}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add item */}
                    {addingItem ? (
                        <div className="flex items-center gap-2 mt-0.5">
                            <div
                                className="w-4 h-4 rounded flex-shrink-0 border"
                                style={{ borderColor: "rgba(168,85,247,0.25)" }}
                            />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent outline-none text-[12px] border-b"
                                style={{ color: "var(--text-primary)", borderColor: ACCENT }}
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
                            className="flex items-center gap-1.5 text-[11px] mt-0.5 transition-all opacity-40 hover:opacity-70"
                            style={{ color: ACCENT }}
                        >
                            <Plus size={10} /> Add item
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid rgba(168,85,247,0.08)" }}>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {done}/{total} done
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

export default memo(ChecklistCard);
