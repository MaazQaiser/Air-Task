"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Event-based toast to keep it decoupled from Zustand state changes.
 * Emitter utility is at the bottom.
 */
export default function CopyToast() {
    const [toast, setToast] = useState<{ id: number; message: string; icon: string; color: string } | null>(null);

    useEffect(() => {
        const handleToast = (e: CustomEvent) => {
            setToast({
                id: Date.now(),
                message: e.detail.message,
                icon: e.detail.icon,
                color: e.detail.color || "var(--accent-primary)"
            });

            // Auto-dismiss
            setTimeout(() => {
                setToast(prev => prev?.id === e.detail.id ? null : prev);
            }, 2500);
        };

        window.addEventListener("airtasks-toast", handleToast as EventListener);
        return () => window.removeEventListener("airtasks-toast", handleToast as EventListener);
    }, []);

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full glass flex items-center gap-2"
                    style={{
                        boxShadow: `0 8px 32px ${toast.color}40, 0 1px 2px rgba(0,0,0,0.1)`,
                        border: `1px solid ${toast.color}30`
                    }}
                >
                    <span className="text-base">{toast.icon}</span>
                    <span className="text-[13px] font-medium tracking-wide" style={{ color: "var(--text-primary)" }}>
                        {toast.message}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export const showToast = (message: string, icon: string = "✨", color?: string) => {
    const event = new CustomEvent("airtasks-toast", { detail: { id: Date.now(), message, icon, color } });
    window.dispatchEvent(event);
};
