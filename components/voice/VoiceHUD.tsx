"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { useTaskStore } from "@/stores/taskStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { showToast } from "@/components/ui/CopyToast";
import { cn } from "@/lib/utils";

function stripFiller(s: string) {
    return s.replace(/^(and|then|to|called|named|titled|a|an|the|for|about)\s+/i, "").replace(/^[,:\-–—]\s*/, "").trim();
}

type VoiceResult =
    | { kind: "card"; type: "task" | "checklist" | "note"; title: string }
    | { kind: "canvas"; action: "create"; name: string }
    | { kind: "canvas"; action: "share" }
    | { kind: "canvas"; action: "open" }
    | { kind: "clipboard"; action: "copy" | "paste" | "duplicate" }
    | { kind: "clipboard"; action: "copy_to" | "move_to"; targetCanvasName: string };

function parseVoiceCommand(transcript: string): VoiceResult | null {
    const t = transcript.trim();

    // ── CANVAS: share ──────────────────────────────────────────────
    if (/^(share|export)\s+(this\s+)?(canvas|workspace|board)/i.test(t)) {
        return { kind: "canvas", action: "share" };
    }

    // ── CANVAS: create new canvas ──────────────────────────────────
    const canvasM = t.match(
        /^(?:create|make|add|new|start)\s+(?:a\s+)?(?:new\s+)?(?:canvas|workspace|board)[:\s,\-–]*(.*)/i
    );
    if (canvasM) {
        return { kind: "canvas", action: "create", name: stripFiller(canvasM[1] || "") || "New Canvas" };
    }

    // ── CANVASES: open workspace sidebar ─────────────────────────────
    if (/^(open|show|toggle)\s+(the\s+)?(workspace|sidebar|canvas\s*list|canvases)/i.test(t)) {
        return { kind: "canvas", action: "open" };
    }

    // ── CLIPBOARD: copy / paste / move ────────────────────────────────
    const moveToM = t.match(/^(?:move)\s+(?:this|it|the\s+card|selected|task|note|list)\s+to\s+(.*)/i);
    if (moveToM) return { kind: "clipboard", action: "move_to", targetCanvasName: stripFiller(moveToM[1]) };

    const copyToM = t.match(/^(?:copy|send)\s+(?:this|it|the\s+card|selected|task|note|list)\s+to\s+(.*)/i);
    if (copyToM) return { kind: "clipboard", action: "copy_to", targetCanvasName: stripFiller(copyToM[1]) };

    if (/^(copy)\s+(this|it|selected|the\s+card|task|note|list)$/i.test(t) || /^copy$/i.test(t)) {
        return { kind: "clipboard", action: "copy" };
    }
    if (/^(paste)(?:\s+(here|it))?$/i.test(t)) {
        return { kind: "clipboard", action: "paste" };
    }
    if (/^(duplicate|clone)(?:\s+(this|it|selected|the\s+card|task|note|list))?$/i.test(t)) {
        return { kind: "clipboard", action: "duplicate" };
    }

    // ── CARD: task ──────────────────────────────────────────────────
    const taskM = t.match(/^(?:add|create|make|new|start)\s+(?:a\s+|an\s+|the\s+|me\s+a\s+)?task[s]?[:\s,\-–]*(.*)/i)
        || t.match(/^task[:\s,\-–]+(.*)/i);
    if (taskM?.[1]?.trim()) return { kind: "card", type: "task", title: stripFiller(taskM[1]) };

    // ── CARD: note ──────────────────────────────────────────────────
    const noteM = t.match(/^(?:add|create|make|new|write|take)\s+(?:a\s+|an\s+|the\s+)?note[s]?[:\s,\-–]*(.*)/i)
        || t.match(/^note[:\s,\-–]+(.*)/i);
    if (noteM?.[1]?.trim()) return { kind: "card", type: "note", title: stripFiller(noteM[1]) };

    // ── CARD: checklist ─────────────────────────────────────────────
    const listM = t.match(/^(?:add|create|make|new)\s+(?:a\s+|an\s+|the\s+)?(?:checklist|list|todo|to-do)[:\s,\-–]*(.*)/i)
        || t.match(/^(?:checklist|list)[:\s,\-–]+(.*)/i);
    if (listM?.[1]?.trim()) return { kind: "card", type: "checklist", title: stripFiller(listM[1]) };

    // ── FALLBACK: 2-10 word phrase → task ───────────────────────────
    const words = t.trim().split(/\s+/);
    const ignoreWords = /^(um|uh|hmm|okay|ok|hey|hi|hello|yes|no|testing|test|stop|cancel)$/i;
    if (words.length >= 2 && words.length <= 10 && !ignoreWords.test(words[0])) {
        return { kind: "card", type: "task", title: stripFiller(t) };
    }

    return null;
}

export default function VoiceHUD() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [supported, setSupported] = useState(true);

    const { theme } = useCanvasStore();
    const isDark = theme === "dark";

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

    const clearAfter = useCallback((ms: number) => {
        setTimeout(() => { setStatus("idle"); setTranscript(""); setFeedbackMsg(""); transcriptRef.current = ""; }, ms);
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
            setFeedbackMsg("");
            transcriptRef.current = "";
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const current = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join(" ");
            setTranscript(current);
            transcriptRef.current = current;
        };

        recognition.onend = () => {
            setListening(false);
            setStatus("processing");

            const finalTranscript = transcriptRef.current;

            setTimeout(() => {
                if (!finalTranscript.trim()) {
                    setStatus("idle");
                    return;
                }

                const result = parseVoiceCommand(finalTranscript);
                if (!result) {
                    setStatus("error");
                    setFeedbackMsg(`Not recognized: "${finalTranscript}"`);
                    clearAfter(2500);
                    return;
                }

                if (result.kind === "card") {
                    const x = 180 + Math.random() * 600;
                    const y = 120 + Math.random() * 350;
                    addTask(result.type, { x, y }, result.title);
                    setStatus("success");
                    setFeedbackMsg(`✓ Created ${result.type}: "${result.title}"`);
                    clearAfter(2500);
                } else if (result.kind === "canvas") {
                    if (result.action === "create") {
                        useCanvasStore.getState().addCanvas(result.name);
                        setStatus("success");
                        setFeedbackMsg(`✓ Created workspace: "${result.name}"`);
                    } else if (result.action === "share") {
                        // Copy share link (placeholder — fire share action)
                        navigator.clipboard?.writeText(window.location.href);
                        setStatus("success");
                        setFeedbackMsg("✓ Canvas link copied to clipboard");
                    } else if (result.action === "open") {
                        useCanvasStore.getState().toggleSidebar();
                        setStatus("success");
                        setFeedbackMsg("✓ Workspace sidebar opened");
                    }
                    clearAfter(2500);
                } else if (result.kind === "clipboard") {
                    const taskStore = useTaskStore.getState();
                    const canvasStore = useCanvasStore.getState();
                    const clipStore = useClipboardStore.getState();
                    
                    const activeCanvasId = canvasStore.activeCanvasId;
                    const selectedItem = taskStore.tasks.find(t => t.id === taskStore.selectedId);

                    if (result.action === "paste") {
                        if (clipStore.copiedCard) {
                            clipStore.pasteCard(activeCanvasId);
                            setStatus("success");
                            setFeedbackMsg("✓ Pasted successfully");
                            showToast("Pasted", "✨", "#10b981");
                        } else {
                            setStatus("error");
                            setFeedbackMsg("Clipboard is empty");
                        }
                    } else if (!selectedItem) {
                        setStatus("error");
                        setFeedbackMsg("Select a card first");
                    } else {
                        // Actions requiring a selected card
                        if (result.action === "copy") {
                            clipStore.copyCard(selectedItem, activeCanvasId);
                            setStatus("success");
                            setFeedbackMsg(`✓ Copied: "${selectedItem.title}"`);
                            showToast(`Copied: ${selectedItem.title}`, "📋", "#00d4ff");
                        } else if (result.action === "duplicate") {
                            clipStore.copyCard(selectedItem, activeCanvasId);
                            clipStore.pasteCard(activeCanvasId);
                            setStatus("success");
                            setFeedbackMsg(`✓ Duplicated: "${selectedItem.title}"`);
                        } else if (result.action === "copy_to" || result.action === "move_to") {
                            const targetQuery = result.targetCanvasName.toLowerCase();
                            const targetCanvas = canvasStore.canvases.find(c => c.name.toLowerCase().includes(targetQuery));
                            if (targetCanvas) {
                                const isCut = result.action === "move_to";
                                clipStore.copyCard(selectedItem, activeCanvasId, isCut);
                                clipStore.pasteCard(targetCanvas.id);
                                setStatus("success");
                                const actionVerb = isCut ? "Moved" : "Copied";
                                setFeedbackMsg(`✓ ${actionVerb} to ${targetCanvas.name}`);
                                showToast(`${actionVerb} to ${targetCanvas.name}`, isCut ? "✂️" : "📋", isCut ? "#ef4444" : "#00d4ff");
                            } else {
                                setStatus("error");
                                setFeedbackMsg(`Canvas not found: "${result.targetCanvasName}"`);
                            }
                        }
                    }
                    clearAfter(2500);
                }
            }, 300);
        };

        recognition.onerror = () => {
            setListening(false);
            setStatus("error");
            setFeedbackMsg("Microphone error — try again");
            clearAfter(2500);
        };

        recognition.start();
    }, [addTask, clearAfter]);

    if (!supported) return null;

    const isVisible = status !== "idle";

    return (
        <>
            {/* Mic trigger button */}
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={listening ? stopListening : startListening}
                className={cn(
                    "flex items-center justify-center gap-2 transition-all"
                )}
                style={{
                    padding: "10px 18px",
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    background: listening ? "#ef4444" : (isDark ? "rgba(255,255,255,0.05)" : "#ffffff"),
                    color: listening ? "white" : (isDark ? "#ef4444" : "#111827"),
                    border: `2.5px solid ${listening ? "#b91c1c" : (isDark ? "#ef4444" : "#111827")}`,
                    boxShadow: `2px 2px 0 ${listening ? "#b91c1c" : (isDark ? "black" : "#111827")}`,
                    cursor: "pointer",
                }}
                title="Voice Command — say 'Add task: ...', 'Create new canvas: ...', 'Share canvas', or 'Open workspace'"
            >
                {listening ? <MicOff size={16} strokeWidth={3} /> : <Mic size={16} strokeWidth={3} />}
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

                            {/* Transcript / Feedback */}
                            <span className="flex-1 text-[13px] font-mono truncate"
                                style={{
                                    color: status === "success" ? "var(--accent-success)"
                                        : status === "error" ? "var(--accent-danger)"
                                            : "var(--text-primary)",
                                }}>
                                {status === "listening" && !transcript
                                    ? <span style={{ color: "var(--text-muted)" }}>
                                        Say: &quot;Add task: ...&quot; or &quot;Create new canvas: ...&quot;
                                        <span className="animate-typing-cursor">_</span>
                                      </span>
                                    : status === "processing" ? "Processing command..."
                                        : feedbackMsg ? feedbackMsg
                                            : transcript}
                            </span>

                            <button
                                onClick={() => { stopListening(); setStatus("idle"); setTranscript(""); setFeedbackMsg(""); transcriptRef.current = ""; }}
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
