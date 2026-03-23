"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sun, Moon, LayoutGrid,
    FolderOpen, ChevronDown, Share2, User,
    Settings, LogOut, Plus, X
} from "lucide-react";
import { sendInviteCard } from "@/lib/firestoreService";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const VoiceHUD = dynamic(() => import("@/components/voice/VoiceHUD"), { ssr: false });
const GestureOverlay = dynamic(() => import("@/components/gesture/GestureOverlay"), { ssr: false });

/* ─────────────────────────────────────────────────────────────
   Design tokens — theme-aware panels
   ───────────────────────────────────────────────────────────── */
const getPanelBase = (theme: "light" | "dark"): React.CSSProperties =>
    theme === "light"
        ? {
              background: "#ffffff",
              border: "3px solid #111827",
              boxShadow: "4px 4px 0 #111827",
              borderRadius: 20,
              backdropFilter: "none",
          }
        : {
              background: "linear-gradient(145deg, rgba(10,16,30,0.92), rgba(6,10,22,0.96))",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(0,180,255,0.08)",
              boxShadow: `0 2px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 60px rgba(0,160,255,0.02)`,
              borderRadius: 20,
          };

export default function Toolbar() {
    const { theme, toggleTheme, canvases, activeCanvasId } = useCanvasStore();
    const { addTask, tasks } = useTaskStore();
    const { user, signOut } = useAuthStore();
    const { copiedCard } = useClipboardStore();
    const [profileOpen, setProfileOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [inviteError, setInviteError] = useState("");

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

    const handleSendInvite = async () => {
        if (!inviteEmail || !activeCanvasId || !user?.email) return;
        setInviteStatus("loading");
        try {
            await sendInviteCard(inviteEmail, user.email, activeCanvasId);
            setInviteStatus("success");
            setInviteEmail("");
            setTimeout(() => {
                setShareModalOpen(false);
                setInviteStatus("idle");
            }, 2000);
        } catch (error: any) {
            setInviteStatus("error");
            setInviteError(error.message || "Failed to send invite");
        }
    };



    const isDark = theme === "dark";
    const textMuted = isDark ? "rgba(203,213,225,0.85)" : "rgba(17,24,39,0.65)";
    const hoverBg = isDark ? "rgba(0,180,255,0.06)" : "rgba(0,0,0,0.04)";
    const iconAccent = isDark ? "#38bdf8" : "#6366f1";
    const panelBase = getPanelBase(theme);

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
                    padding: "8px 14px",
                    gap: 12,
                    ...panelBase,
                }}
            >
                {/* Logo */}
                <div className="flex items-center" style={{ gap: 6, marginLeft: 2 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img src="/assets/logo.png" alt="Logo" style={{ width: 20, height: 20, objectFit: "contain" }} />
                    </div>
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 900,
                            letterSpacing: "-0.04em",
                            color: isDark ? "#ffffff" : "#111827",
                            fontFamily: "Inter, system-ui, sans-serif",
                            display: "flex",
                            alignItems: "baseline"
                        }}
                    >
                        AirTasks
                    </span>
                </div>

                <Divider />

                {/* Canvas Switcher */}
                <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => useCanvasStore.getState().toggleSidebar()}
                    className="flex items-center justify-center"
                    style={{
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 800,
                        background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                        color: isDark ? "#6366f1" : "#111827",
                        border: `2.5px solid ${isDark ? "#6366f1" : "#111827"}`,
                        boxShadow: `2px 2px 0 ${isDark ? "black" : "#111827"}`,
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : "#111827"}`}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : "#111827"}`}
                >
                    <FolderOpen size={14} strokeWidth={3} />
                    <span style={{ whiteSpace: "nowrap" }}>
                        {canvases.find((c) => c.id === activeCanvasId)?.name ?? "My Workspace"}
                    </span>
                    <ChevronDown size={12} strokeWidth={3} />
                </motion.button>
                {copiedCard && (
                    <>
                        <Divider />
                        <div className="flex items-center" style={{ gap: 12 }}>
                            <div className="flex items-baseline" style={{ gap: 4 }}>
                                <span style={{ fontSize: 13 }} title={`Copied: ${copiedCard.title}`}>📋</span>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>

            {/* ─── BOTTOM PANEL (main action dock) ── */}
            <motion.div
                initial={{ y: 50, x: "-50%", opacity: 0 }}
                animate={{ y: 0, x: "-50%", opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
                className="fixed z-50 flex items-center pointer-events-auto"
                style={{
                    bottom: 24,
                    left: "50%",
                    padding: "10px 18px",
                    gap: 12,
                    ...panelBase,
                }}
            >
                {/* Card & Template add buttons */}
                <div className="flex items-center" style={{ gap: 12, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                    <AddCardBtn label="Task" color="#eab308" onClick={() => handleAddCard("task")} />
                    <AddCardBtn label="Note" color="#10b981" onClick={() => handleAddCard("note")} />
                    <AddCardBtn label="List" color="#a855f7" onClick={() => handleAddCard("checklist")} />
                    <AddCardBtn label="Flow" color="#3b82f6" onClick={() => {
                        const id = useTaskStore.getState().addTask("note", { x: 400, y: 300 });
                        useTaskStore.getState().updateTask(id, { title: "User Flow Start", description: "Double-click to add steps. Connect cards to build a flow." });
                    }} />
                    <AddCardBtn label="Mind Map" color="#ec4899" onClick={() => {
                        const id = useTaskStore.getState().addTask("note", { x: 500, y: 300 });
                        useTaskStore.getState().updateTask(id, { title: "Central Idea", description: "Branch out from here." });
                    }} />
                </div>

                <Divider />

                {/* Stickers - Characters */}
                <div className="flex items-center" style={{ gap: 12 }}>
                    <StickerBtn type="yellow" label="Happy Char" color="#eab308" onClick={() => handleAddSticker("🟨", "yellow_char")} />
                    <StickerBtn type="red" label="Robot Char" color="#ef4444" onClick={() => handleAddSticker("🟥", "red_char")} />
                    <StickerBtn type="cyan" label="Office Char" color="#06b6d4" onClick={() => handleAddSticker("🟦", "cyan_char")} />
                    <StickerBtn type="blue" label="Laptop Char" color="#3b82f6" onClick={() => handleAddSticker("🟦", "blue_char")} />
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
                    padding: "8px 14px",
                    gap: 10,
                    ...panelBase,
                }}
            >
                {/* Theme toggle */}
                <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-center"
                    style={{
                        height: 36,
                        minWidth: 36,
                        padding: "0 10px",
                        borderRadius: 12,
                        background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                        color: isDark ? "#fbbf24" : "#111827",
                        border: `2px solid ${isDark ? "#fbbf24" : "#111827"}`,
                        boxShadow: `2px 2px 0 ${isDark ? "black" : "#111827"}`,
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : "#111827"}`}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : "#111827"}`}
                    title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                    {theme === "dark" ? <Sun size={15} strokeWidth={3} /> : <Moon size={15} strokeWidth={3} />}
                </motion.button>

                <Divider />

                {/* Share */}
                <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center justify-center"
                    style={{
                        gap: 6,
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 800,
                        background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                        color: isDark ? "#6366f1" : "#111827",
                        border: `2px solid ${isDark ? "#6366f1" : "#111827"}`,
                        boxShadow: `2px 2px 0 ${isDark ? "black" : "#111827"}`,
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : "#111827"}`}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : "#111827"}`}
                >
                    <Share2 size={15} strokeWidth={3} />
                    Share
                </motion.button>

                <Divider />

                {/* Profile */}
                <div className="relative" ref={profileRef} style={{ display: 'flex' }}>
                    <motion.button
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center"
                        style={{
                            gap: 8,
                            padding: "4px 12px 4px 6px",
                            height: 36,
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 800,
                            background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                            color: isDark ? "#c084fc" : "#111827",
                            border: `2px solid ${isDark ? "#c084fc" : "#111827"}`,
                            boxShadow: `2px 2px 0 ${isDark ? "black" : "#111827"}`,
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : "#111827"}`}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : "#111827"}`}
                    >
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt=""
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "1.5px solid rgba(0,0,0,0.1)",
                                }}
                            />
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    background: isDark ? "#c084fc" : "#111827",
                                    color: isDark ? "#111" : "#fff",
                                    flexShrink: 0,
                                }}
                            >
                                <User size={13} strokeWidth={3} />
                            </div>
                        )}
                        <span style={{
                            maxWidth: 70,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {user?.displayName || user?.email?.split("@")[0] || "Profile"}
                        </span>
                        <ChevronDown
                            size={12}
                            strokeWidth={3}
                            style={{
                                opacity: 0.6,
                                flexShrink: 0,
                                transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                                transition: "transform 0.2s ease",
                            }}
                        />
                    </motion.button>

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
                                    background: isDark
                                        ? "linear-gradient(145deg, rgba(10,16,30,0.97), rgba(6,10,22,0.98))"
                                        : "rgba(255,255,255,0.96)",
                                    backdropFilter: "blur(40px)",
                                    border: isDark ? "1px solid rgba(0,180,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                                    boxShadow: isDark
                                        ? "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)"
                                        : "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <DropdownItem
                                    icon={<Settings size={13} />}
                                    label="Profile Settings"
                                    onClick={() => {
                                        setProfileOpen(false);
                                        setProfileSettingsOpen(true);
                                    }}
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

            {/* ─── SHARE MODAL ─────────────────────────────── */}
            <AnimatePresence>
                {shareModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShareModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full shadow-2xl"
                            style={{ 
                                ...panelBase, 
                                maxWidth: 400,
                                background: isDark ? "rgba(12,18,34,0.98)" : "#fff",
                                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                                boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                                padding: 28, // Hardcode padding so it cannot be stripped
                                borderRadius: 24,
                                overflow: "hidden"
                            }}
                        >
                            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                                <h3 className="text-[16px] font-semibold" style={{ color: isDark ? "#fff" : "#111" }}>Share Canvas</h3>
                                <button onClick={() => setShareModalOpen(false)} style={{ color: textMuted }} className="hover:opacity-70 transition-opacity">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-[13px] leading-relaxed" style={{ color: textMuted, marginBottom: 24 }}>
                                Invite a teammate by email. They will receive a task card dropped into their workspace containing the link.
                            </p>
                            
                            <input
                                type="email"
                                placeholder="teammate@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full text-[14px] outline-none"
                                style={{ 
                                    padding: "12px 16px",
                                    marginBottom: 16,
                                    borderRadius: 12,
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
                                    color: isDark ? "#fff" : "#111", 
                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                    transition: "border 0.2s"
                                }}
                                onFocus={(e) => e.target.style.border = "1px solid #6366f1"}
                                onBlur={(e) => e.target.style.border = `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`}
                            />
                            
                            <div style={{ minHeight: 20, marginBottom: 16 }}>
                                {inviteStatus === "error" && <p className="text-[12px] text-red-400 font-medium m-0">{inviteError}</p>}
                                {inviteStatus === "success" && <p className="text-[12px] text-emerald-400 font-medium">Invite sent successfully! 🚀</p>}
                            </div>
                            
                            <button
                                onClick={handleSendInvite}
                                disabled={inviteStatus === "loading" || !inviteEmail}
                                className="w-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-all"
                                style={{
                                    padding: "12px 0",
                                    borderRadius: 12,
                                    background: inviteStatus === "loading" ? "rgba(99,102,241,0.5)" : "#6366f1",
                                    color: "white",
                                    opacity: !inviteEmail || inviteStatus === "loading" ? 0.7 : 1,
                                    cursor: !inviteEmail || inviteStatus === "loading" ? "not-allowed" : "pointer",
                                    boxShadow: inviteEmail && inviteStatus !== "loading" ? "0 8px 20px rgba(99,102,241,0.3)" : "none"
                                }}
                            >
                                {inviteStatus === "loading" ? (
                                    <>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        Sending...
                                    </>
                                ) : "Send Invite"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {profileSettingsOpen && <ProfileSettingsModal open={profileSettingsOpen} onClose={() => setProfileSettingsOpen(false)} />}
            </AnimatePresence>
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
                background: "linear-gradient(180deg, transparent 0%, var(--glass-border) 50%, transparent 100%)",
                flexShrink: 0,
            }}
        />
    );
}


function AddCardBtn({
    label,
    color,
    onClick,
    icon,
}: {
    label: string;
    color: string;
    onClick: () => void;
    icon?: React.ReactNode;
}) {
    const { theme } = useCanvasStore();
    const isDark = theme === "dark";
    
    return (
        <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            title={`Add ${label}`}
            className="flex items-center justify-center"
            style={{
                gap: 6,
                padding: "8px 16px",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                color: isDark ? color : "#111827",
                border: `2.5px solid ${color}`,
                boxShadow: `2px 2px 0 ${isDark ? "black" : color}`,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : color}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : color}`;
            }}
        >
            {icon || <Plus size={15} strokeWidth={3} />}
            {label}
        </motion.button>
    );
}

function StickerBtn({
    type,
    label,
    onClick,
    color,
}: {
    type: "yellow" | "red" | "cyan" | "blue";
    label: string;
    onClick: () => void;
    color: string;
}) {
    const { theme } = useCanvasStore();
    const isDark = theme === "dark";

    const emojiMap = {
        yellow: "🙌",
        red: "🤖",
        cyan: "💼",
        blue: "💻"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            title={`Add ${label}`}
            className="flex items-center justify-center"
            style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                fontSize: 16,
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                border: `2.5px solid ${color}`,
                boxShadow: `2px 2px 0 ${isDark ? "black" : color}`,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `4px 4px 0 ${isDark ? "black" : color}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `2px 2px 0 ${isDark ? "black" : color}`;
            }}
        >
            {/* If the user drops images in public/stickers/, this will show them. Fallback to emoji. */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span>{emojiMap[type]}</span>
                <img 
                    src={`/stickers/${type}.png`} 
                    alt={label}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 10 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
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
                color: destructive ? "rgba(239,68,68,0.8)" : "var(--text-secondary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = destructive
                    ? "rgba(239,68,68,0.06)"
                    : "var(--glass-surface-active)";
                e.currentTarget.style.color = destructive ? "#ef4444" : "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = destructive ? "rgba(239,68,68,0.8)" : "var(--text-secondary)";
            }}
        >
            <span style={{ opacity: 0.5, display: "flex" }}>{icon}</span>
            {label}
        </button>
    );
}

function ProfileSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user, updateUserProfile } = useAuthStore();
    const { theme } = useCanvasStore();
    const isDark = theme === "dark";
    const textMuted = isDark ? "rgba(203,213,225,0.85)" : "rgba(17,24,39,0.65)";
    const panelBase = getPanelBase(theme);

    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    useEffect(() => {
        if (open) {
            setDisplayName(user?.displayName || "");
            setPhotoURL(user?.photoURL || "");
            setStatus("idle");
        }
    }, [open, user]);

    if (!open) return null;

    const handleSave = async () => {
        setStatus("loading");
        try {
            await updateUserProfile(displayName, photoURL);
            setStatus("success");
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setStatus("error");
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full shadow-2xl"
                style={{ 
                    ...panelBase, 
                    maxWidth: 400,
                    background: isDark ? "rgba(12,18,34,0.98)" : "#fff",
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                    padding: 28,
                    borderRadius: 24,
                    overflow: "hidden"
                }}
            >
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h3 className="text-[16px] font-semibold" style={{ color: isDark ? "#fff" : "#111" }}>Profile Settings</h3>
                    <button onClick={onClose} style={{ color: textMuted }} className="hover:opacity-70 transition-opacity">
                        <X size={18} />
                    </button>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 8, color: textMuted, fontWeight: 500 }}>Display Name</label>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full text-[14px] outline-none"
                        style={{ 
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
                            color: isDark ? "#fff" : "#111", 
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            transition: "border 0.2s"
                        }}
                        onFocus={(e) => e.target.style.border = "1px solid #c084fc"}
                        onBlur={(e) => e.target.style.border = `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`}
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 8, color: textMuted, fontWeight: 500 }}>Photo URL</label>
                    <input
                        type="text"
                        placeholder="https://..."
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full text-[14px] outline-none"
                        style={{ 
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
                            color: isDark ? "#fff" : "#111", 
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            transition: "border 0.2s"
                        }}
                        onFocus={(e) => e.target.style.border = "1px solid #c084fc"}
                        onBlur={(e) => e.target.style.border = `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`}
                    />
                </div>
                
                <div style={{ minHeight: 20, marginBottom: 16 }}>
                    {status === "error" && <p className="text-[12px] text-red-400 font-medium m-0">Failed to update profile</p>}
                    {status === "success" && <p className="text-[12px] text-emerald-400 font-medium">Profile updated successfully!</p>}
                </div>
                
                <button
                    onClick={handleSave}
                    disabled={status === "loading"}
                    className="w-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-all"
                    style={{
                        padding: "12px 0",
                        borderRadius: 12,
                        background: status === "loading" ? "rgba(192,132,252,0.5)" : "#c084fc",
                        color: "white",
                        opacity: status === "loading" ? 0.7 : 1,
                        cursor: status === "loading" ? "not-allowed" : "pointer",
                        boxShadow: status !== "loading" ? "0 8px 20px rgba(192,132,252,0.3)" : "none"
                    }}
                >
                    {status === "loading" ? (
                        <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            Saving...
                        </>
                    ) : "Save Changes"}
                </button>
            </motion.div>
        </div>
    );
}

