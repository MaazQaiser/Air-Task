"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvasStore";
import { useClipboardStore } from "@/stores/clipboardStore";

export default function CanvasPicker() {
    const { canvases, activeCanvasId } = useCanvasStore();
    const { copiedCard, pasteCard } = useClipboardStore();
    const [open, setOpen] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);

    // Filter out active canvas
    const otherCanvases = canvases.filter(c => c.id !== activeCanvasId);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd + Shift + V opens picker if we have a copied card
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "v") {
                if (useClipboardStore.getState().copiedCard && otherCanvases.length > 0) {
                    e.preventDefault();
                    setOpen(true);
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!open) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (open && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open, otherCanvases.length]);

    if (!open || !copiedCard) return null;

    const handlePaste = (canvasId: string) => {
        pasteCard(canvasId);
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="fixed z-[100] flex flex-col rounded-2xl overflow-hidden glass"
                    style={{
                        left: Math.min(mousePos.x, window.innerWidth - 250),
                        top: Math.min(mousePos.y, window.innerHeight - (otherCanvases.length * 40 + 80)),
                        width: 240,
                        boxShadow: "var(--card-shadow-elevated)",
                        border: "1px solid var(--glass-border-hover)"
                    }}
                >
                    <div className="px-3 py-2 text-[11px] font-mono border-b" 
                         style={{ color: "var(--text-muted)", borderBottomColor: "var(--glass-border)", background: "var(--glass-surface)" }}>
                        Paste across canvases...
                    </div>
                    
                    <div className="flex flex-col py-1">
                        {otherCanvases.map(canvas => (
                            <button
                                key={canvas.id}
                                onClick={() => handlePaste(canvas.id)}
                                className="flex items-center gap-3 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="text-lg">{canvas.icon}</span>
                                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                                    {canvas.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
