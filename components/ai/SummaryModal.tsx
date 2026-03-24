"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, FileText, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";

interface SummaryModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SummaryModal({ open, onClose }: SummaryModalProps) {
    const { theme } = useCanvasStore();
    const { tasks, selectedIds, addTask, updateTask, clearSelection, setSelectionMode } = useTaskStore();
    const isDark = theme === "dark";

    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [savedToCanvas, setSavedToCanvas] = useState(false);

    const textMuted = isDark ? "rgba(203,213,225,0.7)" : "rgba(17,24,39,0.55)";

    useEffect(() => {
        if (!open) {
            setSummary("");
            setError("");
            setCopied(false);
            setSavedToCanvas(false);
            return;
        }

        const selectedCards = tasks.filter((t) => selectedIds.includes(t.id));
        if (selectedCards.length < 2) return;

        setLoading(true);
        setError("");

        import("@/lib/aiService")
            .then(({ summarizeCards }) => summarizeCards(selectedCards))
            .then((text) => {
                setSummary(text);
                setLoading(false);
            })
            .catch((err) => {
                setError("Failed to generate summary. Please try again.");
                setLoading(false);
                console.error(err);
            });
    }, [open]);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveToCanvas = () => {
        const id = addTask("note", { x: 600 + Math.random() * 200, y: 300 + Math.random() * 200 });
        updateTask(id, {
            title: "✨ AI Summary",
            description: summary,
            color: "#6366f1",
        });
        setSavedToCanvas(true);
        setTimeout(() => {
            onClose();
            clearSelection();
            setSelectionMode(false);
        }, 1400);
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ type: "spring", damping: 30, stiffness: 340 }}
                        className="relative w-full"
                        style={{
                            maxWidth: 520,
                            borderRadius: 24,
                            overflow: "hidden",
                            background: isDark
                                ? "linear-gradient(145deg, rgba(10,16,30,0.98), rgba(6,10,22,0.99))"
                                : "#ffffff",
                            border: isDark
                                ? "1px solid rgba(0,180,255,0.08)"
                                : "3px solid #111827",
                            boxShadow: isDark
                                ? "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)"
                                : "6px 6px 0 #111827",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "22px 24px 18px",
                                borderBottom: isDark
                                    ? "1px solid rgba(255,255,255,0.05)"
                                    : "2px solid #111827",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 10,
                                        background: "rgba(99,102,241,0.12)",
                                        border: isDark
                                            ? "1px solid rgba(99,102,241,0.25)"
                                            : "2px solid #6366f1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Sparkles size={15} color="#6366f1" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                            fontWeight: 800,
                                            letterSpacing: "-0.025em",
                                            color: isDark ? "#fff" : "#111827",
                                            fontFamily: "Inter, system-ui, sans-serif",
                                        }}
                                    >
                                        AI Summary
                                    </h2>
                                    <p style={{ margin: 0, fontSize: 12, color: textMuted, marginTop: 1 }}>
                                        {tasks.filter((t) => selectedIds.includes(t.id)).length} cards selected
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={handleClose}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: textMuted,
                                }}
                            >
                                <X size={17} />
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "22px 24px 24px" }}>
                            {loading && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 14,
                                        padding: "32px 0",
                                    }}
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    >
                                        <Loader2 size={28} color="#6366f1" />
                                    </motion.div>
                                    <p style={{ margin: 0, fontSize: 13, color: textMuted }}>
                                        Generating summary…
                                    </p>
                                </div>
                            )}

                            {error && !loading && (
                                <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</p>
                            )}

                            {summary && !loading && (
                                <>
                                    {/* Summary text */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35 }}
                                        style={{
                                            padding: "16px 18px",
                                            borderRadius: 14,
                                            background: isDark
                                                ? "rgba(99,102,241,0.06)"
                                                : "rgba(99,102,241,0.04)",
                                            border: isDark
                                                ? "1px solid rgba(99,102,241,0.15)"
                                                : "1.5px solid rgba(99,102,241,0.2)",
                                            marginBottom: 18,
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 14,
                                                lineHeight: 1.65,
                                                color: isDark ? "rgba(226,232,240,0.92)" : "#1e293b",
                                                whiteSpace: "pre-wrap",
                                                fontFamily: "Inter, system-ui, sans-serif",
                                            }}
                                        >
                                            {summary}
                                        </p>
                                    </motion.div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -1 }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={handleCopy}
                                            style={{
                                                flex: 1,
                                                padding: "11px 0",
                                                borderRadius: 12,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 7,
                                                cursor: "pointer",
                                                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                                                color: isDark ? "#cbd5e1" : "#374151",
                                                border: isDark
                                                    ? "1px solid rgba(255,255,255,0.1)"
                                                    : "2px solid #111827",
                                                boxShadow: isDark ? "none" : "2px 2px 0 #111827",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            {copied ? (
                                                <><Check size={14} color="#10b981" /> Copied!</>
                                            ) : (
                                                <><Copy size={14} /> Copy</>
                                            )}
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -1 }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={handleSaveToCanvas}
                                            disabled={savedToCanvas}
                                            style={{
                                                flex: 1,
                                                padding: "11px 0",
                                                borderRadius: 12,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 7,
                                                cursor: savedToCanvas ? "not-allowed" : "pointer",
                                                background: savedToCanvas ? "rgba(16,185,129,0.15)" : "#6366f1",
                                                color: savedToCanvas ? "#10b981" : "#ffffff",
                                                border: savedToCanvas ? "2px solid #10b981" : "none",
                                                boxShadow: savedToCanvas ? "none" : "0 6px 18px rgba(99,102,241,0.35)",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            {savedToCanvas ? (
                                                <><Check size={14} /> Saved to Canvas</>
                                            ) : (
                                                <><FileText size={14} /> Save as Note Card</>
                                            )}
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
