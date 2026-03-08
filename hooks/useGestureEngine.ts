"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { gestureBridge } from "@/lib/gestureBridge";

export type GestureType = "pinch" | "open" | "fist" | "none";
export type GesturePhase = "idle" | "ready" | "grabbing" | "swiping";

export interface HandState {
    gesture: GestureType;
    phase: GesturePhase;
    x: number;
    y: number;
    pinchDistance: number;
    confidence: number;
    dragDeltaX: number;
    dragDeltaY: number;
    swipeProgress: number;
    frameCount: number;
}

interface Landmark { x: number; y: number; z: number }

function dist(a: Landmark, b: Landmark) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function smooth(prev: number, next: number, factor = 0.65) {
    return prev * factor + next * (1 - factor);
}

function classifyGesture(lm: Landmark[]): { gesture: GestureType; pinchDistance: number } {
    const pinchDist = dist(lm[4], lm[8]);
    if (pinchDist < 0.08) return { gesture: "pinch", pinchDistance: pinchDist };

    const fingersUp = [
        lm[8].y < lm[6].y,
        lm[12].y < lm[10].y,
        lm[16].y < lm[14].y,
        lm[20].y < lm[18].y,
    ].filter(Boolean).length;

    if (fingersUp <= 1) return { gesture: "fist", pinchDistance: pinchDist };
    if (fingersUp >= 3) return { gesture: "open", pinchDistance: pinchDist };
    return { gesture: "none", pinchDistance: pinchDist };
}

const EMPTY: HandState = {
    gesture: "none", phase: "idle", x: 0.5, y: 0.5,
    pinchDistance: 1, confidence: 0,
    dragDeltaX: 0, dragDeltaY: 0, swipeProgress: 0, frameCount: 0,
};

const SWIPE_THRESHOLD = 0.20;
const AUTO_DESELECT_MS = 1800; // deselect if hand idle for this long

export function useGestureEngine(
    enabled: boolean,
    onZoom?: (delta: number) => void,
    onAutoSelect?: (x: number, y: number) => void,
) {
    const [handState, setHandState] = useState<HandState>(EMPTY);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rafRef = useRef<number>(0);
    const smoothX = useRef(0.5);
    const smoothY = useRef(0.5);
    const lastGesture = useRef<GestureType>("none");
    const gestureFrames = useRef(0);
    const swipeStartX = useRef<number | null>(null);
    const prevPinchX = useRef<number | null>(null);
    const prevPinchY = useRef<number | null>(null);
    const twoHandPrevDist = useRef<number | null>(null);
    const isDragging = useRef(false);
    const dragEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const noHandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Cooldown: prevent auto-select from re-firing every rAF frame during the same pinch
    const autoSelectFired = useRef(false);

    // Live position of the task being dragged (from gesture bridge)
    const draggedPos = useRef<{ x: number; y: number } | null>(null);

    // Refs into Zustand — rAF always reads fresh values
    const tasksRef = useRef(useTaskStore.getState().tasks);
    const selectedIdRef = useRef(useTaskStore.getState().selectedId);
    const updatePositionRef = useRef(useTaskStore.getState().updatePosition);
    const toggleDockRef = useRef(useTaskStore.getState().toggleDock);
    const setSelectedRef = useRef(useTaskStore.getState().setSelected);

    useEffect(() => {
        return useTaskStore.subscribe((s) => {
            tasksRef.current = s.tasks;
            selectedIdRef.current = s.selectedId;
            updatePositionRef.current = s.updatePosition;
            toggleDockRef.current = s.toggleDock;
            setSelectedRef.current = s.setSelected;
        });
    }, []);

    const stop = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        if (dragEndTimer.current) clearTimeout(dragEndTimer.current);
        if (noHandTimer.current) clearTimeout(noHandTimer.current);
        const stream = videoRef.current?.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsReady(false);
        setHandState(EMPTY);
        isDragging.current = false;
    }, []);

    useEffect(() => {
        if (!enabled) { stop(); return; }

        let active = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let detector: any = null;

        async function init() {
            try {
                const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                detector = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                });

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                });
                if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }

                const video = document.createElement("video");
                video.srcObject = stream;
                video.playsInline = true;
                video.muted = true;
                await video.play();
                videoRef.current = video;
                setIsReady(true);
                setError(null);

                function frame(time: number) {
                    if (!active || !detector || !videoRef.current) return;

                    const result = detector.detectForVideo(videoRef.current, time);
                    const numHands = result.landmarks?.length ?? 0;

                    // ── TWO-HAND ZOOM ──────────────────────────────────────────────────
                    if (numHands === 2) {
                        const w0 = result.landmarks[0][0] as Landmark;
                        const w1 = result.landmarks[1][0] as Landmark;
                        const d = dist(w0, w1);
                        if (twoHandPrevDist.current !== null) {
                            const delta = d - twoHandPrevDist.current;
                            if (Math.abs(delta) > 0.008) onZoom?.(delta * 12);
                        }
                        twoHandPrevDist.current = d;
                        setHandState((p) => ({ ...p, gesture: "open", phase: "idle", confidence: 1 }));
                        rafRef.current = requestAnimationFrame(frame);
                        return;
                    }
                    twoHandPrevDist.current = null;

                    // ── NO HAND ────────────────────────────────────────────────────────
                    if (numHands === 0) {
                        // On drag end: persist the final gesture-bridge position to Zustand
                        if (isDragging.current && selectedIdRef.current && draggedPos.current) {
                            updatePositionRef.current(selectedIdRef.current, draggedPos.current);
                            draggedPos.current = null;
                        }
                        isDragging.current = false;
                        prevPinchX.current = null;
                        prevPinchY.current = null;
                        swipeStartX.current = null;
                        autoSelectFired.current = false; // reset so next pinch can auto-select

                        // Deselect after short idle timeout
                        if (noHandTimer.current) clearTimeout(noHandTimer.current);
                        noHandTimer.current = setTimeout(() => {
                            setSelectedRef.current(null);
                        }, AUTO_DESELECT_MS);

                        setHandState({ ...EMPTY, confidence: 0 });
                        rafRef.current = requestAnimationFrame(frame);
                        return;
                    }

                    // Hand detected — cancel deselect timer
                    if (noHandTimer.current) { clearTimeout(noHandTimer.current); noHandTimer.current = null; }

                    // ── SINGLE HAND ───────────────────────────────────────────────────
                    const lm = result.landmarks[0];
                    const { gesture, pinchDistance } = classifyGesture(lm as Landmark[]);
                    const wrist = lm[0] as Landmark;

                    // Higher smoothing (0.65) = less jitter, slightly more lag
                    smoothX.current = smooth(smoothX.current, 1 - wrist.x, 0.65);
                    smoothY.current = smooth(smoothY.current, wrist.y, 0.65);

                    // Debounce: need 3 same-gesture frames to confirm
                    if (gesture === lastGesture.current) {
                        gestureFrames.current = Math.min(gestureFrames.current + 1, 99);
                    } else {
                        gestureFrames.current = 0;
                        lastGesture.current = gesture;
                    }
                    const confirmed = gestureFrames.current >= 3 ? gesture : "none";

                    const sid = selectedIdRef.current;
                    let dragDeltaX = 0;
                    let dragDeltaY = 0;
                    let phase: GesturePhase = "idle";
                    let swipeProgress = 0;

                    // ── PINCH → DRAG ──────────────────────────────────────────────────
                    if (confirmed === "pinch") {
                        // First frame of a new pinch (prevPinchX is null = fresh pinch gesture)
                        const isFreshPinch = prevPinchX.current === null;

                        if (isFreshPinch) {
                            // Reset cooldown so we can auto-select for this new pinch
                            autoSelectFired.current = false;
                        }

                        // Auto-select nearest card on fresh pinch, regardless of current selection.
                        // This is the fix for sticky-card: even if a card is already selected,
                        // a fresh pinch re-selects the nearest card under the hand.
                        if (isFreshPinch && !autoSelectFired.current) {
                            // Briefly clear current selection for a clean handoff (smooth deselect)
                            if (sid) setSelectedRef.current(null);
                            onAutoSelect?.(smoothX.current, smoothY.current);
                            autoSelectFired.current = true;
                        }

                        const activeSid = selectedIdRef.current;

                        if (isFreshPinch) {
                            prevPinchX.current = smoothX.current;
                            prevPinchY.current = smoothY.current;
                            phase = "ready";
                        } else {
                            const rawDx = (smoothX.current - (prevPinchX.current ?? smoothX.current));
                            const rawDy = (smoothY.current - (prevPinchY.current ?? smoothY.current));
                            dragDeltaX = rawDx * 1600;
                            dragDeltaY = rawDy * 1100;

                            if (activeSid && (Math.abs(dragDeltaX) > 0.3 || Math.abs(dragDeltaY) > 0.3)) {
                                const livePos = gestureBridge.getLivePosition(activeSid);
                                const task = tasksRef.current.find((t) => t.id === activeSid);
                                const basePos = livePos ?? task?.position ?? { x: 0, y: 0 };
                                const newPos = { x: basePos.x + dragDeltaX, y: basePos.y + dragDeltaY };
                                // Direct canvas update (no Zustand, no re-render)
                                gestureBridge.drag(activeSid, newPos.x, newPos.y);
                                draggedPos.current = newPos;
                                isDragging.current = true;
                            }

                            phase = isDragging.current ? "grabbing" : "ready";
                            prevPinchX.current = smoothX.current;
                            prevPinchY.current = smoothY.current;
                        }
                    } else {
                        // Pinch released — persist final position to Zustand
                        if (isDragging.current && sid && draggedPos.current) {
                            updatePositionRef.current(sid, draggedPos.current);
                            draggedPos.current = null;
                        }
                        isDragging.current = false;
                        prevPinchX.current = null;
                        prevPinchY.current = null;
                        autoSelectFired.current = false; // ready for next pinch
                        swipeStartX.current = null;     // prevent swipe glitch on pinch→fist transition
                    }

                    // ── FIST → SWIPE DOCK ─────────────────────────────────────────────
                    if (confirmed === "fist") {
                        phase = "swiping";
                        if (swipeStartX.current === null) swipeStartX.current = smoothX.current;

                        const swipeDelta = Math.abs(smoothX.current - (swipeStartX.current ?? smoothX.current));
                        swipeProgress = Math.min(swipeDelta / SWIPE_THRESHOLD, 1);

                        // Trigger immediately when threshold is crossed (no need to release fist)
                        if (swipeProgress >= 1 && sid) {
                            toggleDockRef.current(sid);
                            setSelectedRef.current(null);
                            swipeStartX.current = null;
                            swipeProgress = 0;
                        }
                    } else {
                        // Released fist without reaching threshold — reset
                        swipeStartX.current = null;
                    }

                    setHandState({
                        gesture: confirmed,
                        phase,
                        x: smoothX.current,
                        y: smoothY.current,
                        pinchDistance,
                        confidence: 1,
                        dragDeltaX,
                        dragDeltaY,
                        swipeProgress,
                        frameCount: gestureFrames.current,
                    });

                    rafRef.current = requestAnimationFrame(frame);
                }

                rafRef.current = requestAnimationFrame(frame);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "";
                setError(
                    msg.toLowerCase().includes("permission")
                        ? "Camera access denied"
                        : "Gesture engine failed — try refreshing"
                );
            }
        }

        init();
        return () => { active = false; stop(); };
    }, [enabled, stop, onZoom, onAutoSelect]);

    return { handState, isReady, error };
}
