"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sun, Moon, LayoutGrid,
    FolderOpen, ChevronDown, Share2, User,
    Settings, LogOut, Plus,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const VoiceHUD = dynamic(() => import("@/components/voice/VoiceHUD"), { ssr: false });
const GestureOverlay = dynamic(() => import("@/components/gesture/GestureOverlay"), { ssr: false });

/* ─────────────────────────────────────────────────────────────
   Design tokens — inspired by deep navy glassmorphic cards
   ───────────────────────────────────────────────────────────── */
const panelBase: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(10,16,30,0.92), rgba(6,10,22,0.96))",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: "1px solid rgba(0,180,255,0.08)",
    boxShadow: `
        0 2px 32px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.03),
        inset 0 0 60px rgba(0,160,255,0.02)
    `,
    borderRadius: 22,
};

export default function Toolbar() {
    const { theme, toggleTheme, canvases, activeCanvasId } = useCanvasStore();
    const { addTask, tasks } = useTaskStore();
    const { user, signOut } = useAuthStore();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const handleAddCard = (type: "task" | "checklist" | "note") => {
        const x = 200 + Math.random() * 500;
        const y = 150 + Math.random() * 300;
        addTask(type, { x, y });
    };

    const handleSignOut = async () => {
        setProfileOpen(false);
        await signOut();
    };

    const activeCount = tasks.filter((t) => !t.docked && t.status !== "done").length;
    const doneCount = tasks.filter((t) => t.status === "done").length;

    return (
        <>
            {/* ─── LEFT PANEL ─────────────────────────────── */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.05 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    top: 16,
                    left: 16,
                    padding: "14px 22px",
                    gap: 18,
                    ...panelBase,
                }}
            >
                {/* Logo mark */}
                <div className="flex items-center" style={{ gap: 12 }}>
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(0,180,255,0.25))",
                            border: "1px solid rgba(99,102,241,0.2)",
                            boxShadow: "0 0 20px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                    >
                        <LayoutGrid size={17} fill="currentColor" color="#a5b4fc" />
                    </div>
                    <span
                        className="font-bold"
                        style={{
                            fontSize: 16,
                            letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg, #c4b5fd, #67e8f9)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        AirTasks
                    </span>
                </div>

                {/* Divider */}
                <Divider />

                {/* Canvas Switcher */}
                <button
                    onClick={() => useCanvasStore.getState().toggleSidebar()}
                    className="flex items-center"
                    style={{
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "rgba(203,213,225,0.85)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,180,255,0.06)";
                        e.currentTarget.style.color = "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(203,213,225,0.85)";
                    }}
                >
                    <FolderOpen size={15} style={{ color: "#38bdf8", opacity: 0.7, flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap" }}>
                        {canvases.find((c) => c.id === activeCanvasId)?.name ?? "My Workspace"}
                    </span>
                    <ChevronDown size={12} style={{ opacity: 0.3, flexShrink: 0 }} />
                </button>
            </motion.div>

            {/* ─── CENTER PANEL ───────────────────────────── */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "14px 24px",
                    gap: 18,
                    ...panelBase,
                }}
            >
                {/* Add buttons */}
                <div className="flex items-center" style={{ gap: 8 }}>
                    <AddCardBtn label="Task" color="#22d3ee" onClick={() => handleAddCard("task")} />
                    <AddCardBtn label="Note" color="#34d399" onClick={() => handleAddCard("note")} />
                    <AddCardBtn label="List" color="#a78bfa" onClick={() => handleAddCard("checklist")} />
                </div>

                <Divider />

                {/* Voice & Gesture */}
                <div className="flex items-center" style={{ gap: 6 }}>
                    <VoiceHUD />
                    <GestureOverlay />
                </div>

                <Divider />

                {/* Stats */}
                <div className="flex items-center" style={{ gap: 16 }}>
                    <StatBadge value={activeCount} label="active" color="#22d3ee" />
                    <StatBadge value={doneCount} label="done" color="#34d399" />
                </div>

                <Divider />

                {/* Theme toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-center"
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: "rgba(0,180,255,0.05)",
                        border: "1px solid rgba(0,180,255,0.1)",
                        color: theme === "dark" ? "#fbbf24" : "#818cf8",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </motion.button>
            </motion.div>

            {/* ─── RIGHT PANEL ────────────────────────────── */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.15 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    top: 16,
                    right: 16,
                    padding: "14px 22px",
                    gap: 16,
                    ...panelBase,
                }}
            >
                {/* Share Button */}
                <button
                    className="flex items-center"
                    style={{
                        gap: 7,
                        padding: "10px 18px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        background: "rgba(56,189,248,0.06)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56,189,248,0.12)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(56,189,248,0.12)";
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(56,189,248,0.12)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(56,189,248,0.06)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    <Share2 size={14} />
                    Share
                </button>

                <Divider />

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center"
                        style={{
                            gap: 10,
                            padding: "6px 12px 6px 6px",
                            borderRadius: 14,
                            fontSize: 14,
                            fontWeight: 500,
                            color: "rgba(203,213,225,0.85)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(0,180,255,0.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt=""
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid rgba(56,189,248,0.2)",
                                    boxShadow: "0 0 10px rgba(56,189,248,0.1)",
                                }}
                            />
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(56,189,248,0.2))",
                                    border: "2px solid rgba(56,189,248,0.15)",
                                    boxShadow: "0 0 10px rgba(56,189,248,0.08)",
                                    flexShrink: 0,
                                    color: "#a5b4fc",
                                }}
                            >
                                <User size={14} />
                            </div>
                        )}
                        <span style={{
                            maxWidth: 90,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {user?.displayName || user?.email?.split("@")[0] || "Profile"}
                        </span>
                        <ChevronDown
                            size={12}
                            style={{
                                opacity: 0.3,
                                flexShrink: 0,
                                transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                                transition: "transform 0.2s ease",
                            }}
                        />
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="absolute right-0 top-full"
                                style={{
                                    marginTop: 10,
                                    width: 210,
                                    borderRadius: 16,
                                    padding: 6,
                                    background: "linear-gradient(145deg, rgba(10,16,30,0.97), rgba(6,10,22,0.98))",
                                    backdropFilter: "blur(40px)",
                                    border: "1px solid rgba(0,180,255,0.08)",
                                    boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
                                }}
                            >
                                <DropdownItem
                                    icon={<Settings size={14} />}
                                    label="Profile Settings"
                                    onClick={() => setProfileOpen(false)}
                                />
                                <DropdownItem
                                    icon={<LogOut size={14} />}
                                    label="Log Out"
                                    onClick={handleSignOut}
                                    destructive
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────── */

function Divider() {
    return (
        <div
            style={{
                width: 1,
                height: 26,
                background: "linear-gradient(180deg, transparent 0%, rgba(0,180,255,0.12) 50%, transparent 100%)",
                flexShrink: 0,
            }}
        />
    );
}

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="flex items-baseline" style={{ gap: 5 }}>
            <span
                style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    color,
                    textShadow: `0 0 12px ${color}40`,
                }}
            >
                {value}
            </span>
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(148,163,184,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}
            >
                {label}
            </span>
        </div>
    );
}

function AddCardBtn({
    label,
    color,
    onClick,
}: {
    label: string;
    color: string;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            title={`Add ${label}`}
            className="flex items-center"
            style={{
                gap: 5,
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                background: `linear-gradient(145deg, ${color}0D, ${color}06)`,
                color,
                border: `1px solid ${color}18`,
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(145deg, ${color}1A, ${color}0D)`;
                e.currentTarget.style.boxShadow = `0 0 20px ${color}18, inset 0 0 30px ${color}06`;
                e.currentTarget.style.borderColor = `${color}28`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(145deg, ${color}0D, ${color}06)`;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = `${color}18`;
            }}
        >
            <Plus size={13} strokeWidth={2.5} />
            {label}
        </motion.button>
    );
}

function DropdownItem({
    icon,
    label,
    onClick,
    destructive = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    destructive?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center w-full text-left"
            style={{
                gap: 10,
                padding: "11px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                color: destructive ? "rgba(248,113,113,0.8)" : "rgba(203,213,225,0.6)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = destructive
                    ? "rgba(239,68,68,0.06)"
                    : "rgba(0,180,255,0.05)";
                e.currentTarget.style.color = destructive ? "#f87171" : "#e2e8f0";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = destructive ? "rgba(248,113,113,0.8)" : "rgba(203,213,225,0.6)";
            }}
        >
            <span style={{ opacity: 0.5, display: "flex" }}>{icon}</span>
            {label}
        </button>
    );
}
