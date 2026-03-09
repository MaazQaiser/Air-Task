"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Hand, Loader2, AlertCircle, X, ChevronRight } from "lucide-react";
import { useGestureEngine } from "@/hooks/useGestureEngine";
import { useTaskStore } from "@/stores/taskStore";
import { useReactFlow } from "reactflow";

const PHASE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    idle: { label: "Idle", icon: "✋", color: "var(--text-muted)" },
    ready: { label: "Ready", icon: "🤏", color: "#f59e0b" },
    grabbing: { label: "Grabbing!", icon: "🤏", color: "#00d4ff" },
    panning: { label: "Panning", icon: "✊", color: "#10b981" },
    swiping: { label: "Swiping →", icon: "✊", color: "#a855f7" },
    panel: { label: "View Details", icon: "🖐️", color: "#f59e0b" },
};

function HandCursor({ x, y, phase, confidence }: { x: number; y: number; phase: string; confidence: number }) {
    if (confidence === 0 || typeof window === "undefined") return null;
    const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.idle;
    const isGrabbing = phase === "grabbing";
    const isPanning = phase === "panning" || phase === "swiping";

    return (
        <motion.div
            className="fixed pointer-events-none z-[999]"
            animate={{ left: x * window.innerWidth, top: y * window.innerHeight }}
            transition={{ type: "spring", damping: 30, stiffness: 700, mass: 0.25 }}
            style={{ translateX: "-50%", translateY: "-50%" }}
        >
            <motion.div className="absolute rounded-full border-2" style={{ borderColor: cfg.color }}
                animate={{ width: isGrabbing ? 28 : isPanning ? 52 : 44, height: isGrabbing ? 28 : isPanning ? 52 : 44, opacity: 0.7, x: isGrabbing ? -14 : isPanning ? -26 : -22, y: isGrabbing ? -14 : isPanning ? -26 : -22 }}
                transition={{ type: "spring", damping: 16, stiffness: 340 }} />
            <motion.div className="rounded-full" style={{ background: cfg.color }}
                animate={{ width: isGrabbing ? 10 : 6, height: isGrabbing ? 10 : 6, boxShadow: `0 0 ${isGrabbing ? 18 : 10}px ${cfg.color}`, x: isGrabbing ? -5 : -3, y: isGrabbing ? -5 : -3 }}
                transition={{ type: "spring", damping: 16, stiffness: 340 }} />
            <motion.div key={phase} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}50` }}>
                {cfg.icon} {cfg.label}
            </motion.div>
            {isGrabbing && [...Array(6)].map((_, i) => (
                <motion.div key={i} className="absolute w-1 h-1 rounded-full"
                    style={{ background: cfg.color, left: "50%", top: "50%" }}
                    animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 20, y: Math.sin((i / 6) * Math.PI * 2) * 20, opacity: [1, 0], scale: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }} />
            ))}
        </motion.div>
    );
}

// ── Detail panel for three-finger gesture ─────────────────────────────────────
function TaskDetailPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
    const { tasks, toggleChecklist } = useTaskStore();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const typeColor: Record<string, string> = { task: "#00d4ff", checklist: "#a855f7", note: "#10b981" };
    const accent = typeColor[task.type] ?? "#00d4ff";

    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            className="fixed top-16 right-4 bottom-6 z-50 flex flex-col"
            style={{ width: 340 }}
        >
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
                style={{ background: "var(--toolbar-bg)", backdropFilter: "var(--glass-blur)", border: `1px solid ${accent}40`, boxShadow: `0 0 40px ${accent}20, var(--card-shadow)` }}>
                {/* Header stripe */}
                <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

                {/* Title */}
                <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: accent }}>
                            {task.type} · {task.status}
                        </div>
                        <h2 className="text-[17px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                            {task.title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 flex-shrink-0 mt-0.5"
                        style={{ color: "var(--text-muted)" }}>
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
                    {/* Description */}
                    {task.description && (
                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Description</div>
                            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{task.description}</p>
                        </div>
                    )}

                    {/* Due date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-2">
                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Due</div>
                            <div className="text-[12px] font-mono px-2 py-0.5 rounded" style={{ background: `${accent}15`, color: accent }}>{task.dueDate}</div>
                        </div>
                    )}

                    {/* Checklist items */}
                    {task.checklistItems && task.checklistItems.length > 0 && (
                        <div>
                            <div className="text-[11px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                                Checklist — {task.checklistItems.filter(i => i.done).length}/{task.checklistItems.length}
                            </div>
                            <div className="flex flex-col gap-2">
                                {task.checklistItems.map(item => (
                                    <motion.div key={item.id} whileHover={{ x: 2 }}
                                        className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer"
                                        style={{ background: item.done ? `${accent}10` : "var(--glass-surface)" }}
                                        onClick={() => toggleChecklist(task.id, item.id)}>
                                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                            style={{ background: item.done ? accent : "transparent", border: `1.5px solid ${item.done ? accent : "var(--glass-border)"}` }}>
                                            {item.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                                        </div>
                                        <span className="text-[13px]" style={{ color: item.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
                                            {item.label}
                                        </span>
                                        <ChevronRight size={12} className="ml-auto opacity-30" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Priority */}
                    {task.priority && (
                        <div className="flex items-center gap-2">
                            <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Priority</div>
                            <div className="w-2 h-2 rounded-full" style={{
                                background: task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981"
                            }} />
                            <span className="text-[12px] capitalize" style={{ color: "var(--text-secondary)" }}>{task.priority}</span>
                        </div>
                    )}
                </div>

                {/* Gesture hint */}
                <div className="px-5 py-3 text-[10px] font-mono text-center" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--glass-border)" }}>
                    🖐️ Open hand to close · ✊ Fist to dock
                </div>
            </div>
        </motion.div>
    );
}

export default function GestureOverlay() {
    const [enabled, setEnabled] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const { zoomIn, zoomOut, getViewport, setViewport } = useReactFlow();
    const { tasks, selectedId, setSelected } = useTaskStore();

    const handleZoom = useCallback((delta: number) => {
        if (delta > 0) zoomIn({ duration: 60 });
        else zoomOut({ duration: 60 });
    }, [zoomIn, zoomOut]);

    // Auto-select: uses real DOM bounds for 100% pixel-perfect precision
    const handleAutoSelect = useCallback((normX: number, normY: number) => {
        const handX = normX * window.innerWidth;
        const handY = normY * window.innerHeight;

        let hitCard: string | null = null;
        let closest: string | null = null;
        let minDist = Infinity;

        // Tolerance pad around the card
        const PAD = 40;

        for (const task of tasks) {
            if (task.docked) continue;

            // Query the literal DOM element React Flow provides
            const el = document.querySelector(`[data-id="${task.id}"]`);
            if (!el) continue;

            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // Direct bounds hit (hand is within the physical borders of this card node)
            if (
                handX >= rect.left - PAD &&
                handX <= rect.right + PAD &&
                handY >= rect.top - PAD &&
                handY <= rect.bottom + PAD
            ) {
                hitCard = task.id;
                break;
            }

            // Fallback to closest center if we missed all bounds
            const d = Math.hypot(handX - cx, handY - cy);
            if (d < minDist) {
                minDist = d;
                closest = task.id;
            }
        }

        // If direct hit, use it immediately. Otherwise snap to nearest if within a wide radius.
        const pick = hitCard ?? (minDist < 300 ? closest : null);
        if (pick) setSelected(pick);
        return pick;
    }, [tasks, setSelected]);

    const handlePanelGesture = useCallback(() => {
        setPanelOpen(true);
    }, []);

    const { handState, isReady, error } = useGestureEngine(
        enabled, handleZoom, handleAutoSelect, handlePanelGesture
    );

    const { gesture, phase, x, y, confidence, pinchDistance, dragDeltaX, dragDeltaY,
        panDeltaX, panDeltaY, swipeProgress, frameCount } = handState;

    // Canvas pan: apply fist movement directly to viewport
    useEffect(() => {
        if ((phase === "panning" || phase === "swiping") && (panDeltaX !== 0 || panDeltaY !== 0)) {
            const vp = getViewport();
            setViewport({ x: vp.x + panDeltaX, y: vp.y + panDeltaY, zoom: vp.zoom }, { duration: 0 });
        }
    }, [panDeltaX, panDeltaY, phase, getViewport, setViewport]);

    // Close panel on open hand
    useEffect(() => {
        if (gesture === "open" && panelOpen) setPanelOpen(false);
    }, [gesture, panelOpen]);

    const phaseCfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.idle;
    const selectedTask = tasks.find((t) => t.id === selectedId);

    return (
        <>
            {/* Hand cursor */}
            <AnimatePresence>
                {enabled && isReady && <HandCursor x={x} y={y} phase={phase} confidence={confidence} />}
            </AnimatePresence>

            {/* Three-finger detail panel */}
            <AnimatePresence>
                {panelOpen && selectedId && (
                    <TaskDetailPanel taskId={selectedId} onClose={() => setPanelOpen(false)} />
                )}
            </AnimatePresence>

            {/* Debug panel */}
            <AnimatePresence>
                {enabled && (
                    <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                        className="fixed top-20 left-4 z-40 flex flex-col gap-2" style={{ minWidth: 220 }}>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-mono"
                            style={{ background: "var(--toolbar-bg)", backdropFilter: "var(--glass-blur)", border: `1px solid ${confidence > 0 ? phaseCfg.color + "70" : "var(--glass-border)"}`, color: confidence > 0 ? phaseCfg.color : "var(--text-muted)" }}>
                            {!isReady ? (<><Loader2 size={13} className="animate-spin" /><span>Loading...</span></>)
                                : error ? (<><AlertCircle size={13} /><span>{error}</span></>)
                                    : confidence > 0 ? (<><span style={{ fontSize: 16 }}>{phaseCfg.icon}</span><span className="font-bold">{phaseCfg.label}</span><motion.div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: phaseCfg.color }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /></>)
                                        : (<><Hand size={13} /><span>Show your hand</span></>)}
                        </div>

                        {isReady && !error && (
                            <div className="flex flex-col gap-1.5 px-3 py-3 rounded-xl text-[11px] font-mono"
                                style={{ background: "var(--toolbar-bg)", backdropFilter: "var(--glass-blur)", border: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>

                                <div className="flex items-center gap-2 pb-1.5 mb-0.5" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                    {selectedTask
                                        ? <><span style={{ color: "#10b981" }}>🔲</span><span className="truncate" style={{ color: "#10b981", maxWidth: 160 }}>{selectedTask.title}</span></>
                                        : <span style={{ color: "var(--text-muted)" }}>Aim hand at a card</span>}
                                </div>

                                <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Cursor</span><span>{confidence > 0 ? `${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%` : "—"}</span></div>
                                <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Gesture</span><span>{confidence > 0 ? `${gesture} (${frameCount}fr)` : "—"}</span></div>
                                <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Pinch</span><span>{confidence > 0 ? pinchDistance.toFixed(3) : "—"}</span></div>

                                {phase === "grabbing" && <div className="flex justify-between" style={{ color: "#00d4ff" }}><span>Drag Δ</span><span>x:{dragDeltaX.toFixed(1)} y:{dragDeltaY.toFixed(1)}</span></div>}
                                {(phase === "panning") && <div className="flex justify-between" style={{ color: "#10b981" }}><span>Pan Δ</span><span>x:{panDeltaX.toFixed(1)} y:{panDeltaY.toFixed(1)}</span></div>}

                                {swipeProgress > 0 && (
                                    <div>
                                        <div className="flex justify-between mb-1" style={{ color: "#a855f7" }}><span>Dock swipe</span><span>{(swipeProgress * 100).toFixed(0)}%</span></div>
                                        <div className="w-full h-1 rounded-full" style={{ background: "var(--glass-surface)" }}>
                                            <motion.div className="h-1 rounded-full" style={{ background: "#a855f7" }} animate={{ width: `${swipeProgress * 100}%` }} transition={{ duration: 0.05 }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 pt-2 mt-0.5" style={{ borderTop: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                                    <div>🤏 <b>Pinch + move</b> → drag card</div>
                                    <div>✊ <b>Fist + move</b> → pan canvas</div>
                                    <div>✊ <b>Fist + swipe far</b> → dock</div>
                                    <div>🖐️ <b>3 fingers</b> → detail panel</div>
                                    <div>🤲 <b>Both hands</b> → zoom</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar toggle */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setEnabled((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium"
                style={{ background: enabled ? "rgba(0,212,255,0.12)" : "var(--glass-surface)", backdropFilter: "var(--glass-blur)", border: `1px solid ${enabled ? "rgba(0,212,255,0.4)" : "var(--glass-border)"}`, boxShadow: enabled ? "0 0 16px rgba(0,212,255,0.25)" : "none", color: enabled ? "#00d4ff" : "var(--text-primary)" }}
                title="Toggle gesture control (camera)">
                {enabled ? <Camera size={16} /> : <CameraOff size={16} />}
                <span>{enabled ? "Gesture ON" : "Gesture"}</span>
                {enabled && isReady && confidence > 0 && (
                    <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: phaseCfg.color }} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                )}
            </motion.button>
        </>
    );
}
