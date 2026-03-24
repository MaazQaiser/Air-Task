"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTemplateLoader } from "@/hooks/useTemplateLoader";
import { TEMPLATES, Template } from "@/lib/templates";

interface TemplatesModalProps {
    open: boolean;
    onClose: () => void;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    Engineering: { bg: "rgba(99,102,241,0.15)", text: "#818cf8" },
    Product:     { bg: "rgba(236,72,153,0.15)", text: "#f472b6" },
    Strategy:    { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
    Personal:    { bg: "rgba(16,185,129,0.15)", text: "#34d399" },
    Wellbeing:   { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
};

export default function TemplatesModal({ open, onClose }: TemplatesModalProps) {
    const { theme } = useCanvasStore();
    const { loadTemplate } = useTemplateLoader();
    const isDark = theme === "dark";

    const handleSelect = async (template: Template) => {
        onClose();
        // Small delay so the modal animates out before cards appear
        setTimeout(() => loadTemplate(template), 200);
    };

    const textMuted = isDark ? "rgba(203,213,225,0.7)" : "rgba(17,24,39,0.55)";
    const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
    const cardBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "2.5px solid #111827";
    const cardShadow = isDark ? "none" : "3px 3px 0 #111827";
    const cardShadowHover = isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "5px 5px 0 #111827";

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
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ type: "spring", damping: 30, stiffness: 340 }}
                        className="relative w-full"
                        style={{
                            maxWidth: 740,
                            maxHeight: "85vh",
                            borderRadius: 24,
                            overflow: "hidden",
                            background: isDark
                                ? "linear-gradient(145deg, rgba(10,16,30,0.98), rgba(6,10,22,0.99))"
                                : "#f8fafc",
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
                                padding: "24px 28px 20px",
                                borderBottom: isDark
                                    ? "1px solid rgba(255,255,255,0.05)"
                                    : "2px solid #111827",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: isDark
                                            ? "rgba(99,102,241,0.15)"
                                            : "rgba(99,102,241,0.08)",
                                        border: isDark
                                            ? "1px solid rgba(99,102,241,0.25)"
                                            : "2px solid #6366f1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Zap size={16} color="#6366f1" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: 18,
                                            fontWeight: 800,
                                            letterSpacing: "-0.03em",
                                            color: isDark ? "#fff" : "#111827",
                                            fontFamily: "Inter, system-ui, sans-serif",
                                        }}
                                    >
                                        Templates Gallery
                                    </h2>
                                    <p style={{ margin: 0, fontSize: 12, color: textMuted, marginTop: 2 }}>
                                        Pick a template to instantly populate your canvas
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={onClose}
                                style={{
                                    width: 32,
                                    height: 32,
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
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Template Grid */}
                        <div
                            style={{
                                padding: "24px 28px 28px",
                                overflowY: "auto",
                                maxHeight: "calc(85vh - 90px)",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 16,
                            }}
                        >
                            {TEMPLATES.map((template, i) => {
                                const tagStyle = TAG_COLORS[template.tag] ?? {
                                    bg: "rgba(99,102,241,0.15)",
                                    text: "#818cf8",
                                };

                                return (
                                    <motion.button
                                        key={template.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05, type: "spring", damping: 28, stiffness: 280 }}
                                        whileHover={{ y: -3, boxShadow: cardShadowHover }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleSelect(template)}
                                        style={{
                                            background: cardBg,
                                            border: cardBorder,
                                            boxShadow: cardShadow,
                                            borderRadius: 16,
                                            padding: "20px 22px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "box-shadow 0.18s ease",
                                        }}
                                    >
                                        {/* Emoji + Tag row */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: 12,
                                            }}
                                        >
                                            <span style={{ fontSize: 28 }}>{template.emoji}</span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    padding: "3px 9px",
                                                    borderRadius: 6,
                                                    background: tagStyle.bg,
                                                    color: tagStyle.text,
                                                    letterSpacing: "0.04em",
                                                }}
                                            >
                                                {template.tag.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <p
                                            style={{
                                                margin: "0 0 6px",
                                                fontSize: 15,
                                                fontWeight: 800,
                                                letterSpacing: "-0.02em",
                                                color: isDark ? "#fff" : "#111827",
                                                fontFamily: "Inter, system-ui, sans-serif",
                                            }}
                                        >
                                            {template.name}
                                        </p>

                                        {/* Description */}
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 12,
                                                lineHeight: 1.55,
                                                color: textMuted,
                                            }}
                                        >
                                            {template.description}
                                        </p>

                                        {/* Card count badge */}
                                        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(17,24,39,0.4)",
                                                }}
                                            >
                                                {template.cards.length} cards
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
