"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Edit3, Check, FolderOpen } from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";

const PRESET_ICONS = ["📁", "🚀", "💡", "📝", "🎨", "⚡", "🏠", "📋", "🎯", "🔥", "💎", "🌟"];

export default function CanvasSidebar() {
    const {
        canvases,
        activeCanvasId,
        sidebarOpen,
        setActiveCanvas,
        toggleSidebar,
        addCanvas,
        renameCanvas,
        removeCanvas,
        theme,
    } = useCanvasStore();

    const isDark = theme === "dark";

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const handleCreate = () => {
        if (newName.trim()) {
            addCanvas(newName.trim());
            setNewName("");
            setCreating(false);
        }
    };

    const handleRename = (id: string) => {
        if (editName.trim()) {
            renameCanvas(id, editName.trim());
        }
        setEditingId(null);
        setEditName("");
    };

    const startRename = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    return (
        <AnimatePresence>
            {sidebarOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60]"
                        style={{ background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)" }}
                        onClick={toggleSidebar}
                    />

                    {/* Sidebar panel */}
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="fixed left-0 top-0 bottom-0 z-[65] flex flex-col"
                        style={{
                            width: 300,
                            background: isDark ? "rgba(12,16,24,0.95)" : "rgba(255,255,255,0.95)",
                            backdropFilter: "blur(40px) saturate(180%)",
                            borderRight: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
                            boxShadow: isDark ? "8px 0 40px rgba(0,0,0,0.5)" : "8px 0 40px rgba(0,0,0,0.1)",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between"
                            style={{ padding: "20px 20px 16px" }}
                        >
                            <div className="flex items-center gap-3">
                                <FolderOpen size={18} style={{ color: "#a855f7" }} />
                                <h2
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        letterSpacing: "-0.01em",
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    Canvases
                                </h2>
                                <span
                                    className="text-caption"
                                    style={{
                                        background: "rgba(168,85,247,0.12)",
                                        color: "#a855f7",
                                        padding: "2px 6px",
                                        borderRadius: 6,
                                        fontSize: 10,
                                        fontWeight: 600,
                                    }}
                                >
                                    {canvases.length}
                                </span>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, margin: "0 20px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />

                        {/* Canvas list */}
                        <div
                            className="flex-1 overflow-y-auto"
                            style={{ padding: "12px 12px" }}
                        >
                            {canvases.map((canvas) => {
                                const isActive = canvas.id === activeCanvasId;
                                const isEditing = editingId === canvas.id;

                                return (
                                    <motion.div
                                        key={canvas.id}
                                        layout
                                        className="group relative rounded-xl transition-all cursor-pointer mb-1"
                                        style={{
                                            padding: "10px 12px",
                                            background: isActive ? "rgba(168,85,247,0.1)" : "transparent",
                                            border: isActive
                                                ? "1px solid rgba(168,85,247,0.2)"
                                                : "1px solid transparent",
                                        }}
                                        onClick={() => {
                                            if (!isEditing) {
                                                setActiveCanvas(canvas.id);
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive)
                                                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive)
                                                e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Canvas icon */}
                                            <span style={{ fontSize: 18, lineHeight: 1 }}>
                                                {canvas.icon}
                                            </span>

                                            {/* Name or edit input */}
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            autoFocus
                                                            className="input"
                                                            style={{
                                                                padding: "4px 8px",
                                                                fontSize: 13,
                                                                borderRadius: 6,
                                                            }}
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleRename(canvas.id);
                                                                if (e.key === "Escape") setEditingId(null);
                                                            }}
                                                            onBlur={() => handleRename(canvas.id)}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRename(canvas.id);
                                                            }}
                                                            className="w-6 h-6 rounded flex items-center justify-center"
                                                            style={{ color: "#10b981" }}
                                                        >
                                                            <Check size={13} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-[13px] font-medium truncate block"
                                                        style={{
                                                            color: isActive
                                                                ? "var(--text-primary)"
                                                                : "var(--text-secondary)",
                                                        }}
                                                    >
                                                        {canvas.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Active indicator dot */}
                                            {isActive && (
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        background: "#a855f7",
                                                        boxShadow: "0 0 6px #a855f7",
                                                    }}
                                                />
                                            )}

                                            {/* Edit / Delete (on hover) */}
                                            {!isEditing && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startRename(canvas.id, canvas.name);
                                                        }}
                                                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/8 transition-colors"
                                                        style={{ color: "var(--text-muted)" }}
                                                        title="Rename"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                    {canvases.length > 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeCanvas(canvas.id);
                                                            }}
                                                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors"
                                                            style={{ color: "rgba(239,68,68,0.6)" }}
                                                            title="Delete canvas"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* New canvas input */}
                            <AnimatePresence>
                                {creating && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ padding: "8px 12px" }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: 18 }}>📁</span>
                                            <input
                                                autoFocus
                                                className="input"
                                                style={{
                                                    padding: "6px 10px",
                                                    fontSize: 13,
                                                    borderRadius: 8,
                                                }}
                                                placeholder="Canvas name..."
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleCreate();
                                                    if (e.key === "Escape") {
                                                        setCreating(false);
                                                        setNewName("");
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (!newName.trim()) {
                                                        setCreating(false);
                                                        setNewName("");
                                                    }
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer — New canvas button */}
                        <div style={{ padding: "12px 16px", borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                            <button
                                onClick={() => setCreating(true)}
                                className="btn btn-secondary"
                                style={{
                                    width: "100%",
                                    fontSize: 13,
                                    padding: "8px 16px",
                                    gap: 6,
                                }}
                            >
                                <Plus size={14} />
                                New Canvas
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
