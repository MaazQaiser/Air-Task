"use client";
import { motion } from "framer-motion";
import { Sun, Moon, Zap } from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const VoiceHUD = dynamic(() => import("@/components/voice/VoiceHUD"), { ssr: false });
const GestureOverlay = dynamic(() => import("@/components/gesture/GestureOverlay"), { ssr: false });

export default function Toolbar() {
    const { theme, toggleTheme } = useCanvasStore();
    const { addTask, tasks } = useTaskStore();

    // Apply theme to html element
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const handleAddCard = (type: "task" | "checklist" | "note") => {
        // Place new card near center with slight offset
        const x = 200 + Math.random() * 500;
        const y = 150 + Math.random() * 300;
        addTask(type, { x, y });
    };

    const activeCount = tasks.filter((t) => !t.docked && t.status !== "done").length;
    const doneCount = tasks.filter((t) => t.status === "done").length;

    return (
        <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.1 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{
                background: "var(--toolbar-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--card-shadow), var(--glow-cyan)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--glass-border)]">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--accent-primary)", boxShadow: "var(--glow-cyan)" }}
                >
                    <Zap size={14} fill="currentColor" color="#000" />
                </div>
                <span className="text-[14px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    AirTasks
                </span>
            </div>

            {/* Add buttons */}
            <div className="flex items-center gap-1.5">
                <ToolbarBtn
                    label="+ Task"
                    color="#00d4ff"
                    onClick={() => handleAddCard("task")}
                    title="Add Task (double-click canvas)"
                />
                <ToolbarBtn
                    label="+ Note"
                    color="#10b981"
                    onClick={() => handleAddCard("note")}
                />
                <ToolbarBtn
                    label="+ List"
                    color="#a855f7"
                    onClick={() => handleAddCard("checklist")}
                />
            </div>

            {/* Divider */}
            <div className="h-6 w-px" style={{ background: "var(--glass-border)" }} />

            {/* Voice */}
            <VoiceHUD />

            {/* Gesture camera button */}
            <GestureOverlay />

            {/* Divider */}
            <div className="h-6 w-px" style={{ background: "var(--glass-border)" }} />

            {/* Stats */}
            <div className="flex items-center gap-3 text-[12px] font-mono">
                <span style={{ color: "var(--accent-primary)" }}>
                    {activeCount} active
                </span>
                <span style={{ color: "var(--accent-success)" }}>
                    {doneCount} done
                </span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px" style={{ background: "var(--glass-border)" }} />

            {/* Theme toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                    background: "var(--glass-surface-hover)",
                    color: theme === "dark" ? "#f59e0b" : "#6366f1",
                }}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>
        </motion.div>
    );
}

function ToolbarBtn({
    label, color, onClick, title
}: { label: string; color: string; onClick: () => void; title?: string }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            title={title}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
                background: `${color}15`,
                color,
                border: `1px solid ${color}30`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${color}25`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${color}40`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
        >
            {label}
        </motion.button>
    );
}
