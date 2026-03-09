"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTaskStore } from "@/stores/taskStore";
import { cn, formatDueDate } from "@/lib/utils";

const TYPE_ICON: Record<string, string> = { task: "◈", checklist: "☑", note: "◉" };
const TYPE_COLOR: Record<string, string> = { task: "#00d4ff", checklist: "#a855f7", note: "#10b981" };

export default function TaskDock() {
    const { tasks, toggleDock } = useTaskStore();
    const docked = tasks.filter((t) => t.docked);

    return (
        <AnimatePresence>
            {docked.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl"
                    style={{
                        background: "var(--dock-bg)",
                        backdropFilter: "var(--glass-blur)",
                        WebkitBackdropFilter: "var(--glass-blur)",
                        border: "1px solid var(--glass-border)",
                        boxShadow: "var(--card-shadow), var(--glow-cyan)",
                    }}
                >
                    <span className="text-[11px] font-mono mr-2" style={{ color: "var(--text-muted)" }}>
                        DOCK
                    </span>
                    {docked.map((task, i) => (
                        <motion.div
                            key={task.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: i * 0.05, type: "spring", damping: 20 }}
                            className="relative group"
                        >
                            {/* Bubble */}
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                                className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
                                style={{
                                    background: `${TYPE_COLOR[task.type]}15`,
                                    border: `1.5px solid ${TYPE_COLOR[task.type]}40`,
                                    boxShadow: `0 0 12px ${TYPE_COLOR[task.type]}30`,
                                }}
                                onClick={() => toggleDock(task.id)}
                                title={`Restore: ${task.title}`}
                            >
                                <span style={{ color: TYPE_COLOR[task.type], fontSize: 18 }}>
                                    {TYPE_ICON[task.type]}
                                </span>
                            </motion.div>

                            {/* Tooltip */}
                            <div className={cn(
                                "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap",
                                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                                "px-2 py-1 rounded-lg text-[11px]",
                            )}
                                style={{ background: "var(--glass-surface)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", backdropFilter: "blur(12px)" }}
                            >
                                {task.title}
                            </div>

                            {/* Remove from dock */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleDock(task.id); }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: "var(--accent-danger)" }}
                            >
                                <X size={9} color="white" />
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
