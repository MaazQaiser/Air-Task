"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";

const ONBOARDING_KEY = "airtasks-onboarding-done";

interface Slide {
    keyword: string;
    title: string;
    subtitle: string;
    image: string;
    tryIt: string;
    accentColor: string;
    accentColor2: string;
}

const SLIDES: Slide[] = [
    {
        keyword: "CANVAS.",
        title: "Organize on your",
        subtitle: "Drag, drop, and arrange tasks on an infinite spatial board. Like sticky notes — but way better.",
        image: "/onboarding/canvas.png",
        tryIt: "Double-click anywhere on the canvas to create your first task!",
        accentColor: "#06b6d4",
        accentColor2: "#f97316",
    },
    {
        keyword: "WORKSPACES.",
        title: "Organize with",
        subtitle: "Create separate boards for each project. Switch between them from the sidebar — keep everything tidy.",
        image: "/onboarding/workspace.png",
        tryIt: "Click 'My Workspace' in the top-left to open the sidebar.",
        accentColor: "#6366f1",
        accentColor2: "#06b6d4",
    },
    {
        keyword: "VOICE.",
        title: "Create with your",
        subtitle: 'Speak naturally to create tasks, canvases, and more. Say "Add task: Buy groceries" — done!',
        image: "/onboarding/voice.png",
        tryIt: 'Click the Voice button → say "Add task: Buy groceries"',
        accentColor: "#f59e0b",
        accentColor2: "#ef4444",
    },
    {
        keyword: "GESTURES.",
        title: "Control with",
        subtitle: "Use your webcam for spatial hand tracking. Point to move, pinch to grab, open hand to drop!",
        image: "/onboarding/gesture.png",
        tryIt: "Click the Gesture button → allow camera → point at the screen!",
        accentColor: "#ef4444",
        accentColor2: "#f97316",
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
    const isLast = step >= SLIDES.length - 1;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: "rgba(245,247,251,0.92)", backdropFilter: "blur(16px)" }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        style={{
                            width: "100%",
                            maxWidth: 480,
                            borderRadius: 28,
                            background: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.06)",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {/* Geometric accent stripes */}
                        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
                            <div style={{
                                position: "absolute", top: -30, right: -20,
                                width: 180, height: 6, borderRadius: 3,
                                background: slide.accentColor,
                                transform: "rotate(-35deg)",
                                transition: "all 0.4s ease",
                            }} />
                            <div style={{
                                position: "absolute", top: 10, right: -40,
                                width: 200, height: 6, borderRadius: 3,
                                background: slide.accentColor2,
                                transform: "rotate(-35deg)",
                                transition: "all 0.4s ease",
                            }} />
                        </div>

                        {/* Skip */}
                        <div style={{ position: "absolute", top: 18, left: 24, zIndex: 10, display: "flex", alignItems: "center", gap: 6 }}>
                             <img src="/assets/logo.png" alt="Logo" style={{ width: 18, height: 18, objectFit: "contain" }} />
                             <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>AirTasks</span>
                        </div>

                        <button
                            onClick={finish}
                            style={{
                                position: "absolute", top: 20, right: 24, zIndex: 10,
                                fontSize: 13, fontWeight: 500,
                                color: "rgba(17,24,39,0.35)", background: "none", border: "none",
                                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(17,24,39,0.35)"; }}
                        >
                            Skip
                        </button>

                        {/* Content */}
                        <div style={{ padding: "40px 40px 0", position: "relative", zIndex: 1 }}>
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    initial={{ opacity: 0, x: direction * 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: direction * -40 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    {/* Character illustration */}
                                    <div style={{
                                        display: "flex", justifyContent: "center",
                                        marginBottom: 28,
                                    }}>
                                        <img
                                            src={slide.image}
                                            alt=""
                                            style={{
                                                width: 180, height: 180,
                                                objectFit: "contain",
                                                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.06))",
                                            }}
                                        />
                                    </div>

                                    {/* Title with bold keyword */}
                                    <div style={{ marginBottom: 14 }}>
                                        <p style={{
                                            fontSize: 16, fontWeight: 400,
                                            color: "rgba(17,24,39,0.5)",
                                            fontFamily: "'Outfit', sans-serif",
                                            marginBottom: 2,
                                        }}>
                                            {slide.title}
                                        </p>
                                        <h2 style={{
                                            fontSize: 36, fontWeight: 800,
                                            color: "#111827",
                                            fontFamily: "'Outfit', sans-serif",
                                            letterSpacing: "-0.04em",
                                            lineHeight: 1.1,
                                        }}>
                                            {slide.keyword}
                                        </h2>
                                    </div>

                                    {/* Subtitle */}
                                    <p style={{
                                        fontSize: 14, lineHeight: 1.7,
                                        color: "rgba(17,24,39,0.45)",
                                        fontFamily: "'Outfit', sans-serif",
                                        marginBottom: 16,
                                    }}>
                                        {slide.subtitle}
                                    </p>

                                    {/* Try-it hint */}
                                    <div style={{
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        background: `${slide.accentColor}08`,
                                        border: `1px dashed ${slide.accentColor}30`,
                                        fontSize: 12.5, fontWeight: 500,
                                        color: slide.accentColor,
                                        fontFamily: "'Outfit', sans-serif",
                                        lineHeight: 1.5,
                                    }}>
                                        💡 {slide.tryIt}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "24px 40px 32px",
                        }}>
                            {/* Nav left */}
                            <div className="flex items-center" style={{ gap: 8 }}>
                                {step > 0 ? (
                                    <button
                                        onClick={goPrev}
                                        style={{
                                            fontSize: 13, fontWeight: 700,
                                            color: "rgba(17,24,39,0.35)",
                                            background: "none", border: "none",
                                            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                                            display: "flex", alignItems: "center", gap: 4,
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(17,24,39,0.35)"; }}
                                    >
                                        <ArrowLeft size={14} />
                                        PREV
                                    </button>
                                ) : (
                                    <div />
                                )}
                            </div>

                            {/* Step dots */}
                            <div className="flex items-center" style={{ gap: 5 }}>
                                {SLIDES.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                                        style={{
                                            width: i === step ? 22 : 8, height: 8, borderRadius: 4,
                                            background: i === step ? slide.accentColor : "rgba(17,24,39,0.1)",
                                            border: "none", cursor: "pointer",
                                            transition: "all 0.3s ease",
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Next / GO! */}
                            <button
                                onClick={goNext}
                                className="flex items-center"
                                style={{
                                    gap: 4,
                                    padding: "10px 22px",
                                    borderRadius: 24,
                                    fontSize: 13, fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    background: slide.accentColor,
                                    color: "#ffffff",
                                    border: "none", cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: `0 4px 12px ${slide.accentColor}30`,
                                    letterSpacing: "0.02em",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = `0 6px 20px ${slide.accentColor}45`;
                                    e.currentTarget.style.transform = "scale(1.03)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${slide.accentColor}30`;
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                            >
                                {isLast ? "GO!" : "NEXT"}
                                {!isLast && <ArrowRight size={14} />}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
