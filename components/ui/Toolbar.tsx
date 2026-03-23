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
   Design tokens — deep navy glassmorphic panels
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

    const handleAddSticker = (emoji: string, variant?: string) => {
        const x = 200 + Math.random() * 500;
        const y = 150 + Math.random() * 300;
        const id = addTask("sticker", { x, y }, emoji);
        if (variant) {
            useTaskStore.getState().updateTask(id, { description: variant });
        }
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
                    padding: "12px 20px",
                    gap: 14,
                    ...panelBase,
                }}
            >
                {/* Logo */}
                <div className="flex items-center" style={{ gap: 10 }}>
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(0,180,255,0.25))",
                            border: "1px solid rgba(99,102,241,0.2)",
                            boxShadow: "0 0 20px rgba(99,102,241,0.15)",
                        }}
                    >
                        <LayoutGrid size={15} fill="currentColor" color="#a5b4fc" />
                    </div>
                    <span
                        className="font-bold"
                        style={{
                            fontSize: 15,
                            letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg, #c4b5fd, #67e8f9)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        AirTasks
                    </span>
                </div>

                <Divider />

                {/* Canvas Switcher */}
                <button
                    onClick={() => useCanvasStore.getState().toggleSidebar()}
                    className="flex items-center"
                    style={{
                        gap: 7,
                        padding: "8px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(203,213,225,0.85)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,180,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    <FolderOpen size={14} style={{ color: "#38bdf8", opacity: 0.7, flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap" }}>
                        {canvases.find((c) => c.id === activeCanvasId)?.name ?? "My Workspace"}
                    </span>
                    <ChevronDown size={11} style={{ opacity: 0.3, flexShrink: 0 }} />
                </button>

                <Divider />

                {/* Stats */}
                <div className="flex items-center" style={{ gap: 12 }}>
                    <StatBadge value={activeCount} label="active" color="#22d3ee" />
                    <StatBadge value={doneCount} label="done" color="#34d399" />
                </div>
            </motion.div>

            {/* ─── CENTER PANEL (compact — just add buttons) ── */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "12px 20px",
                    gap: 14,
                    ...panelBase,
                }}
            >
                {/* Card add buttons */}
                <div className="flex items-center" style={{ gap: 6 }}>
                    <AddCardBtn label="Task" color="#22d3ee" onClick={() => handleAddCard("task")} />
                    <AddCardBtn label="Note" color="#34d399" onClick={() => handleAddCard("note")} />
                    <AddCardBtn label="List" color="#a78bfa" onClick={() => handleAddCard("checklist")} />
                </div>

                <Divider />

                {/* Stickers */}
                <div className="flex items-center" style={{ gap: 4 }}>
                    <StickerBtn emoji="⭐" label="Sticker" onClick={() => handleAddSticker("⭐")} />
                    <StickerBtn emoji="🧑‍💻" label="Avatar" onClick={() => handleAddSticker("🧑‍💻", "avatar")} />
                </div>

                <Divider />

                {/* Voice & Gesture — icon-only in center */}
                <div className="flex items-center" style={{ gap: 4 }}>
                    <VoiceHUD />
                    <GestureOverlay />
                </div>
            </motion.div>

            {/* ─── RIGHT PANEL ─────────────────────────────── */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.15 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    top: 16,
                    right: 16,
                    padding: "12px 18px",
                    gap: 12,
                    ...panelBase,
                }}
            >
                {/* Theme toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-center"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(0,180,255,0.05)",
                        border: "1px solid rgba(0,180,255,0.1)",
                        color: theme === "dark" ? "#fbbf24" : "#818cf8",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </motion.button>

                <Divider />

                {/* Share */}
                <button
                    className="flex items-center"
                    style={{
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
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
                    <Share2 size={13} />
                    Share
                </button>

                <Divider />

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center"
                        style={{
                            gap: 8,
                            padding: "5px 10px 5px 5px",
                            borderRadius: 12,
                            fontSize: 13,
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
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid rgba(56,189,248,0.2)",
                                }}
                            />
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(56,189,248,0.2))",
                                    border: "2px solid rgba(56,189,248,0.15)",
                                    flexShrink: 0,
                                    color: "#a5b4fc",
                                }}
                            >
                                <User size={12} />
                            </div>
                        )}
                        <span style={{
                            maxWidth: 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {user?.displayName || user?.email?.split("@")[0] || "Profile"}
                        </span>
                        <ChevronDown
                            size={11}
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
                                    width: 200,
                                    borderRadius: 14,
                                    padding: 5,
                                    background: "linear-gradient(145deg, rgba(10,16,30,0.97), rgba(6,10,22,0.98))",
                                    backdropFilter: "blur(40px)",
                                    border: "1px solid rgba(0,180,255,0.08)",
                                    boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
                                }}
                            >
                                <DropdownItem
                                    icon={<Settings size={13} />}
                                    label="Profile Settings"
                                    onClick={() => setProfileOpen(false)}
                                />
                                <DropdownItem
                                    icon={<LogOut size={13} />}
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

/* ──────────── Sub-components ──────────── */

function Divider() {
    return (
        <div
            style={{
                width: 1,
                height: 22,
                background: "linear-gradient(180deg, transparent 0%, rgba(0,180,255,0.12) 50%, transparent 100%)",
                flexShrink: 0,
            }}
        />
    );
}

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="flex items-baseline" style={{ gap: 4 }}>
            <span
                style={{
                    fontSize: 14,
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
                    fontSize: 10,
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
                gap: 4,
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 12,
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
                e.currentTarget.style.boxShadow = `0 0 20px ${color}18`;
                e.currentTarget.style.borderColor = `${color}28`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(145deg, ${color}0D, ${color}06)`;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = `${color}18`;
            }}
        >
            <Plus size={12} strokeWidth={2.5} />
            {label}
        </motion.button>
    );
}

function StickerBtn({
    emoji,
    label,
    onClick,
}: {
    emoji: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            title={`Add ${label}`}
            className="flex items-center justify-center"
            style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                fontSize: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(245,158,11,0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {emoji}
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
                gap: 8,
                padding: "10px 12px",
                borderRadius: 8,
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
