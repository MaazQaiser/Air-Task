"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

function stripFiller(s: string) {
    return s.replace(/^(and|then|to|called|named|titled|a|an|the|for|about)\s+/i, "").replace(/^[,:\-–—]\s*/, "").trim();
}

function parseVoiceCommand(transcript: string): { type: "task" | "checklist" | "note"; title: string } | null {
    const t = transcript.trim();

    // ── TASK ─────────────────────────────────────────────────────────────────
    const taskM = t.match(/^(?:add|create|make|new|start)\s+(?:a\s+|an\s+|the\s+|me\s+a\s+)?task[s]?[:\s,\-–]*(.*)/i)
        || t.match(/^task[:\s,\-–]+(.*)/i);
    if (taskM?.[1]?.trim()) return { type: "task", title: stripFiller(taskM[1]) };

    // ── NOTE ─────────────────────────────────────────────────────────────────
    const noteM = t.match(/^(?:add|create|make|new|write|take)\s+(?:a\s+|an\s+|the\s+)?note[s]?[:\s,\-–]*(.*)/i)
        || t.match(/^note[:\s,\-–]+(.*)/i);
    if (noteM?.[1]?.trim()) return { type: "note", title: stripFiller(noteM[1]) };

    // ── CHECKLIST ─────────────────────────────────────────────────────────────
    const listM = t.match(/^(?:add|create|make|new)\s+(?:a\s+|an\s+|the\s+)?(?:checklist|list|todo|to-do)[:\s,\-–]*(.*)/i)
        || t.match(/^(?:checklist|list)[:\s,\-–]+(.*)/i);
    if (listM?.[1]?.trim()) return { type: "checklist", title: stripFiller(listM[1]) };

    // ── FALLBACK: treat any 2-10 word phrase as a task title ─────────────────
    const words = t.trim().split(/\s+/);
    const ignoreWords = /^(um|uh|hmm|okay|ok|hey|hi|hello|yes|no|testing|test|stop|cancel)$/i;
    if (words.length >= 2 && words.length <= 10 && !ignoreWords.test(words[0])) {
        return { type: "task", title: stripFiller(t) };
    }

    return null;
}

export default function VoiceHUD() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
    const [supported, setSupported] = useState(true);

    // Use a ref so the onend closure always reads the latest transcript value
    const transcriptRef = useRef("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const { addTask } = useTaskStore();

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) setSupported(false);
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const startListening = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setListening(true);
            setStatus("listening");
            setTranscript("");
            transcriptRef.current = "";
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const current = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join(" ");
            setTranscript(current);
            // Keep ref in sync — this is what onend will read
            transcriptRef.current = current;
        };

        recognition.onend = () => {
            setListening(false);
            setStatus("processing");

            // Read from ref, not state — avoids stale closure
            const finalTranscript = transcriptRef.current;

            setTimeout(() => {
                if (!finalTranscript.trim()) {
                    setStatus("idle");
                    return;
                }

                const command = parseVoiceCommand(finalTranscript);
                if (command) {
                    // Place card at a natural canvas position
                    const x = 180 + Math.random() * 600;
                    const y = 120 + Math.random() * 350;
                    addTask(command.type, { x, y }, command.title);
                    setStatus("success");
                    setTimeout(() => { setStatus("idle"); setTranscript(""); transcriptRef.current = ""; }, 2500);
                } else {
                    setStatus("error");
                    setTimeout(() => { setStatus("idle"); setTranscript(""); transcriptRef.current = ""; }, 2500);
                }
            }, 300);
        };

        recognition.onerror = () => {
            setListening(false);
            setStatus("error");
            setTimeout(() => { setStatus("idle"); setTranscript(""); transcriptRef.current = ""; }, 2500);
        };

        recognition.start();
    }, [addTask]);

    if (!supported) return null;

    const isVisible = status !== "idle";

    return (
        <>
            {/* Mic trigger button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={listening ? stopListening : startListening}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                )}
                style={{
                    background: listening ? "var(--accent-danger)" : "var(--glass-surface)",
                    backdropFilter: "var(--glass-blur)",
                    border: `1px solid ${listening ? "var(--accent-danger)" : "var(--glass-border)"}`,
                    boxShadow: listening ? "0 0 20px rgba(239,68,68,0.5)" : "none",
                    color: listening ? "white" : "var(--text-primary)",
                }}
                title="Voice Command — say 'Add task: ...' or 'Add note: ...' or 'Add checklist: ...'"
            >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{listening ? "Listening..." : "Voice"}</span>
            </motion.button>

            {/* Voice HUD bar */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div
                            className="glass flex items-center gap-4 px-6 py-3 rounded-full min-w-[400px]"
                            style={{
                                borderColor:
                                    status === "success" ? "var(--accent-success)"
                                        : status === "error" ? "var(--accent-danger)"
                                            : "var(--glass-border-hover)",
                                boxShadow:
                                    status === "success" ? "var(--card-shadow), var(--glow-green)"
                                        : status === "error" ? "var(--card-shadow), var(--glow-red)"
                                            : "var(--card-shadow), var(--glow-cyan)",
                            }}
                        >
                            {/* Waveform */}
                            {status === "listening" && (
                                <div className="flex items-center gap-[3px] h-6 flex-shrink-0">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-[3px] rounded-full"
                                            style={{ background: "var(--accent-primary)" }}
                                            animate={{ scaleY: [0.3, 1, 0.3] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                                        />
                                    ))}
                                </div>
                            )}

                            {status === "processing" && (
                                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                                    style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
                            )}
                            {status === "success" && <span className="text-[var(--accent-success)] text-lg flex-shrink-0">✓</span>}
                            {status === "error" && <span className="text-[var(--accent-danger)] text-lg flex-shrink-0">✕</span>}

                            {/* Transcript */}
                            <span className="flex-1 text-[13px] font-mono truncate"
                                style={{
                                    color: status === "success" ? "var(--accent-success)"
                                        : status === "error" ? "var(--accent-danger)"
                                            : "var(--text-primary)",
                                }}>
                                {status === "listening" && !transcript
                                    ? <span style={{ color: "var(--text-muted)" }}>Say: &quot;Add task: your task name&quot;<span className="animate-typing-cursor">_</span></span>
                                    : status === "processing" ? "Processing command..."
                                        : status === "success" ? `✓ Created: "${transcript}"`
                                            : status === "error" && transcript ? `Not recognized. Try: "Add task: [name]"`
                                                : transcript}
                            </span>

                            <button
                                onClick={() => { stopListening(); setStatus("idle"); setTranscript(""); transcriptRef.current = ""; }}
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
