"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X } from "lucide-react";

const ONBOARDING_KEY = "airtasks-onboarding-done";

interface Slide {
    emoji: string;
    title: string;
    subtitle: string;
    visual: React.ReactNode;
    tryIt?: string;
    color: string;
}

/* ──────── Visual illustrations (inline SVG-style) ──────── */
const CanvasVisual = () => (
    <div style={{
        width: "100%", height: 160, borderRadius: 14,
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,180,255,0.06)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
    }}>
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            {Array.from({ length: 8 }).map((_, r) => (
                <div key={r} style={{ display: "flex", justifyContent: "space-evenly", padding: "8px 12px" }}>
                    {Array.from({ length: 10 }).map((_, c) => (
                        <div key={c} style={{ width: 3, height: 3, borderRadius: "50%", background: "#22d3ee" }} />
                    ))}
                </div>
            ))}
        </div>
        {/* Fake cards */}
        <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
                position: "absolute", top: 24, left: 30,
                width: 120, height: 56, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,180,255,0.04))",
                border: "1px solid rgba(0,212,255,0.2)",
                padding: "10px 12px",
            }}
        >
            <div style={{ fontSize: 8, color: "#22d3ee", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>TASK</div>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>Design homepage</div>
        </motion.div>
        <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
                position: "absolute", top: 42, right: 40,
                width: 110, height: 52, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
                border: "1px solid rgba(16,185,129,0.2)",
                padding: "10px 12px",
            }}
        >
            <div style={{ fontSize: 8, color: "#34d399", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>NOTE</div>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>Meeting notes</div>
        </motion.div>
        <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
                position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
                width: 100, height: 48, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04))",
                border: "1px solid rgba(168,85,247,0.2)",
                padding: "10px 12px",
            }}
        >
            <div style={{ fontSize: 8, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>LIST</div>
            <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>Sprint tasks</div>
        </motion.div>
        {/* Cursor */}
        <motion.div
            animate={{ x: [0, 40, 40, 0], y: [0, 20, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
                position: "absolute", bottom: 30, right: 60,
                width: 16, height: 16, borderRadius: "50%",
                background: "rgba(255,255,255,0.3)", border: "2px solid white",
                boxShadow: "0 0 10px rgba(255,255,255,0.3)",
            }}
        />
    </div>
);

const WorkspaceVisual = () => (
    <div style={{
        width: "100%", height: 160, borderRadius: 14,
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(168,85,247,0.06)",
        display: "flex", overflow: "hidden", position: "relative",
    }}>
        {/* Sidebar */}
        <div style={{
            width: 140, borderRight: "1px solid rgba(168,85,247,0.1)",
            padding: 12, display: "flex", flexDirection: "column" as const, gap: 6,
        }}>
            <div style={{ fontSize: 9, color: "rgba(148,163,184,0.4)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>WORKSPACES</div>
            {[{ icon: "🏠", name: "My Board", active: true }, { icon: "🚀", name: "Sprint 3", active: false }, { icon: "💡", name: "Ideas", active: false }].map((ws, i) => (
                <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 8px", borderRadius: 6,
                        background: ws.active ? "rgba(168,85,247,0.1)" : "transparent",
                        border: ws.active ? "1px solid rgba(168,85,247,0.15)" : "1px solid transparent",
                        fontSize: 11, color: ws.active ? "#c4b5fd" : "rgba(203,213,225,0.5)",
                        fontWeight: ws.active ? 600 : 400,
                    }}
                >
                    <span style={{ fontSize: 13 }}>{ws.icon}</span>
                    {ws.name}
                </motion.div>
            ))}
        </div>
        {/* Canvas area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(148,163,184,0.3)", textAlign: "center" as const }}>
                Each workspace<br />has its own canvas
            </div>
        </div>
    </div>
);

const VoiceVisual = () => (
    <div style={{
        width: "100%", height: 160, borderRadius: 14,
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(16,185,129,0.06)",
        display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
        gap: 14, position: "relative",
    }}>
        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    style={{ width: 3, borderRadius: 2, background: "#34d399" }}
                    animate={{ height: [6, 18 + Math.random() * 10, 6] }}
                    transition={{ duration: 0.7 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
                />
            ))}
        </div>
        {/* Example commands */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, alignItems: "center" }}>
            {['"Add task: Design homepage"', '"Create new canvas: Sprint 3"', '"Share canvas"'].map((cmd, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.2 }}
                    style={{
                        fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: i === 0 ? "#34d399" : "rgba(148,163,184,0.4)",
                        background: i === 0 ? "rgba(16,185,129,0.08)" : "transparent",
                        padding: i === 0 ? "3px 10px" : "0px 10px",
                        borderRadius: 4,
                    }}
                >
                    🎤 {cmd}
                </motion.div>
            ))}
        </div>
    </div>
);

const GestureVisual = () => (
    <div style={{
        width: "100%", height: 160, borderRadius: 14,
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(245,158,11,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
    }}>
        {/* Hand illustration */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[
                { gesture: "☝️", label: "Point", desc: "Move cursor" },
                { gesture: "🤏", label: "Pinch", desc: "Select & drag" },
                { gesture: "🖐️", label: "Open", desc: "Release" },
            ].map((g, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                    style={{
                        display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6,
                    }}
                >
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24,
                    }}>
                        {g.gesture}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24" }}>{g.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(148,163,184,0.4)" }}>{g.desc}</div>
                </motion.div>
            ))}
        </div>
    </div>
);

const SLIDES: Slide[] = [
    {
        emoji: "✨",
        title: "Welcome to AirTasks",
        subtitle: "Your spatial workspace — drag, drop, and organize tasks on an infinite canvas. Like sticky notes, but way better.",
        visual: <CanvasVisual />,
        tryIt: "💡 Try it: Double-click anywhere on the canvas to create your first task!",
        color: "#22d3ee",
    },
    {
        emoji: "📁",
        title: "Multi-Canvas Workspaces",
        subtitle: "Organize projects into separate workspaces. Each canvas is independent — switch between them from the sidebar.",
        visual: <WorkspaceVisual />,
        tryIt: "💡 Try it: Click 'My Workspace' in the top-left toolbar to open the sidebar",
        color: "#a78bfa",
    },
    {
        emoji: "🎤",
        title: "Voice Commands",
        subtitle: "Create cards and manage canvases completely hands-free. Just click the Voice button and speak.",
        visual: <VoiceVisual />,
        tryIt: '💡 Try it: Click Voice → say "Add task: Buy groceries"',
        color: "#34d399",
    },
    {
        emoji: "✋",
        title: "Gesture Controls",
        subtitle: "Use your webcam for spatial hand-gesture control. Point to move, pinch to grab, release to drop.",
        visual: <GestureVisual />,
        tryIt: "💡 Try it: Click the Gesture button → allow camera → point at the screen!",
        color: "#f59e0b",
    },
];

export default function OnboardingGuide() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        const done = localStorage.getItem(ONBOARDING_KEY);
        if (!done) setShow(true);
    }, []);

    const finish = () => {
        localStorage.setItem(ONBOARDING_KEY, "true");
        setShow(false);
    };

    const goNext = () => {
        if (step >= SLIDES.length - 1) {
            finish();
        } else {
            setDirection(1);
            setStep((s) => s + 1);
        }
    };

    const goPrev = () => {
        if (step > 0) {
            setDirection(-1);
            setStep((s) => s - 1);
        }
    };

    const slide = SLIDES[step];

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: "rgba(4,8,16,0.88)", backdropFilter: "blur(16px)" }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        style={{
                            width: "100%",
                            maxWidth: 520,
                            borderRadius: 24,
                            background: "linear-gradient(145deg, rgba(12,18,34,0.98), rgba(8,12,24,0.99))",
                            border: "1px solid rgba(0,180,255,0.08)",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {/* Close */}
                        <button
                            onClick={finish}
                            style={{
                                position: "absolute", top: 18, right: 18, zIndex: 10,
                                color: "rgba(148,163,184,0.3)", background: "none", border: "none", cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(148,163,184,0.3)"; }}
                        >
                            <X size={16} />
                        </button>

                        {/* Content */}
                        <div style={{ padding: "36px 36px 28px" }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    initial={{ opacity: 0, x: direction * 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: direction * -30 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                >
                                    {/* Emoji + Title */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                        <span style={{ fontSize: 28 }}>{slide.emoji}</span>
                                        <h2 style={{
                                            fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em",
                                            color: "#f1f5f9", lineHeight: 1.25,
                                        }}>
                                            {slide.title}
                                        </h2>
                                    </div>

                                    {/* Subtitle */}
                                    <p style={{
                                        fontSize: 14, lineHeight: 1.6,
                                        color: "rgba(148,163,184,0.65)",
                                        marginBottom: 20, maxWidth: 440,
                                    }}>
                                        {slide.subtitle}
                                    </p>

                                    {/* Visual illustration */}
                                    {slide.visual}

                                    {/* Try it prompt */}
                                    {slide.tryIt && (
                                        <div style={{
                                            marginTop: 16,
                                            padding: "10px 14px",
                                            borderRadius: 10,
                                            background: `${slide.color}08`,
                                            border: `1px solid ${slide.color}15`,
                                            fontSize: 12,
                                            color: slide.color,
                                            fontWeight: 500,
                                            lineHeight: 1.5,
                                        }}>
                                            {slide.tryIt}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "16px 36px 28px",
                        }}>
                            {/* Step dots */}
                            <div className="flex items-center" style={{ gap: 6 }}>
                                {SLIDES.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                                        style={{
                                            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                                            background: i === step ? slide.color : "rgba(148,163,184,0.15)",
                                            border: "none", cursor: "pointer",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Nav */}
                            <div className="flex items-center" style={{ gap: 8 }}>
                                {step > 0 && (
                                    <button
                                        onClick={goPrev}
                                        className="flex items-center justify-center"
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: 10,
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            color: "rgba(203,213,225,0.6)",
                                            cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                    >
                                        <ArrowLeft size={14} />
                                    </button>
                                )}

                                <button
                                    onClick={goNext}
                                    className="flex items-center"
                                    style={{
                                        gap: 6, padding: "9px 22px",
                                        borderRadius: 10, fontSize: 13, fontWeight: 600,
                                        background: `linear-gradient(135deg, ${slide.color}, ${slide.color}cc)`,
                                        color: "#0a0e1a",
                                        border: "none", cursor: "pointer",
                                        boxShadow: `0 0 20px ${slide.color}25`,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${slide.color}40`; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${slide.color}25`; }}
                                >
                                    {step >= SLIDES.length - 1 ? "Get Started 🚀" : "Next"}
                                    {step < SLIDES.length - 1 && <ArrowRight size={14} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
