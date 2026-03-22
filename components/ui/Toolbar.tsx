"use client";
import { motion } from "framer-motion";
import { 
    Sun, Moon, LayoutGrid, 
    FolderOpen, ChevronDown, Share2, User, 
    Settings, LogOut 
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const VoiceHUD = dynamic(() => import("@/components/voice/VoiceHUD"), { ssr: false });
const GestureOverlay = dynamic(() => import("@/components/gesture/GestureOverlay"), { ssr: false });

export default function Toolbar() {
    const { theme, toggleTheme } = useCanvasStore();
    const { addTask, tasks } = useTaskStore();
    const { user, signOut } = useAuthStore();
    const [profileOpen, setProfileOpen] = useState(false);
    const [folderOpen, setFolderOpen] = useState(false);

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

    const handleSignOut = async () => {
        await signOut();
    };

    const activeCount = tasks.filter((t) => !t.docked && t.status !== "done").length;
    const doneCount = tasks.filter((t) => t.status === "done").length;

    return (
        <>
            {/* ─── LEFT PANEL ─────────────────────── */}
            <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.05 }}
                className="fixed z-50 flex items-center gap-4 px-5 py-3 rounded-[20px] pointer-events-auto"
                style={{
                    top: "20px",
                    left: "20px",
                    background: "var(--toolbar-bg)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--card-shadow), var(--glow-cyan)",
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 pr-4 border-r border-[var(--glass-border)]">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500"
                        style={{ boxShadow: "var(--glow-cyan)" }}
                    >
                        <LayoutGrid size={16} fill="currentColor" color="#fff" />
                    </div>
                    <span className="text-[16px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        AiTable
                    </span>
                </div>

                {/* Folder Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setFolderOpen(!folderOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-[14px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        <FolderOpen size={16} className="text-blue-400" />
                        <span>My Workspace</span>
                        <ChevronDown size={14} className={`opacity-50 transition-transform ${folderOpen ? "rotate-180" : ""}`} />
                    </button>

                    {folderOpen && (
                        <div
                            className="absolute left-0 top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden py-1.5"
                            style={{
                                background: "var(--toolbar-bg)",
                                backdropFilter: "var(--glass-blur)",
                                border: "1px solid var(--glass-border)",
                            }}
                        >
                            <button className="w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/5 transition-colors text-[var(--text-primary)]">
                                Project Alpha
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-[14px] hover:bg-white/5 transition-colors text-[var(--text-primary)]">
                                Design Assets
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ─── CENTER PANEL ───────────────────── */}
            <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.1 }}
                className="fixed z-50 flex items-center gap-4 px-5 py-3 rounded-[20px] pointer-events-auto"
                style={{
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--toolbar-bg)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--card-shadow), var(--glow-cyan)",
                }}
            >
                {/* Add buttons */}
                <div className="flex items-center gap-2">
                    <ToolbarBtn label="+ Task" color="#00d4ff" onClick={() => handleAddCard("task")} title="Add Task" />
                    <ToolbarBtn label="+ Note" color="#10b981" onClick={() => handleAddCard("note")} />
                    <ToolbarBtn label="+ List" color="#a855f7" onClick={() => handleAddCard("checklist")} />
                </div>

                <div className="h-8 w-px" style={{ background: "var(--glass-border)" }} />

                <VoiceHUD />
                <GestureOverlay />

                <div className="h-8 w-px" style={{ background: "var(--glass-border)" }} />

                {/* Stats */}
                <div className="flex items-center gap-4 text-[13px] font-mono">
                    <span style={{ color: "var(--accent-primary)" }}>{activeCount} active</span>
                    <span style={{ color: "var(--accent-success)" }}>{doneCount} done</span>
                </div>

                <div className="h-8 w-px" style={{ background: "var(--glass-border)" }} />

                {/* Theme toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                        background: "var(--glass-surface-hover)",
                        color: theme === "dark" ? "#f59e0b" : "#6366f1",
                    }}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </motion.button>
            </motion.div>

            {/* ─── RIGHT PANEL ────────────────────── */}
            <motion.div
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.15 }}
                className="fixed z-50 flex items-center gap-4 px-5 py-3 rounded-[20px] pointer-events-auto"
                style={{
                    top: "20px",
                    right: "20px",
                    background: "var(--toolbar-bg)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--card-shadow), var(--glow-cyan)",
                }}
            >
                {/* Share Button */}
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold transition-all bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                    <Share2 size={15} />
                    Share
                </button>

                <div className="h-8 w-px" style={{ background: "var(--glass-border)" }} />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-[14px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full shadow-sm" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                <User size={14} />
                            </div>
                        )}
                        <span>{user?.displayName || user?.email?.split("@")[0] || "My Profile"}</span>
                        <ChevronDown size={14} className={`opacity-50 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                    </button>

                    {profileOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden py-1.5"
                            style={{
                                background: "var(--toolbar-bg)",
                                backdropFilter: "var(--glass-blur)",
                                border: "1px solid var(--glass-border)",
                            }}
                        >
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-white/5 transition-colors text-left" style={{ color: "var(--text-primary)" }}>
                                <Settings size={15} className="opacity-70" />
                                Profile Settings
                            </button>
                            <button 
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-red-500/10 hover:text-red-500 transition-colors text-left text-red-400"
                            >
                                <LogOut size={15} className="opacity-70" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
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
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
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

