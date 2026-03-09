"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { gestureBridge } from "@/lib/gestureBridge";

export type GestureType = "pinch" | "open" | "fist" | "panel" | "none";
export type GesturePhase = "idle" | "ready" | "grabbing" | "panning" | "swiping" | "panel";

export interface HandState {
    gesture: GestureType;
    phase: GesturePhase;
    x: number;
    y: number;
    pinchDistance: number;
    confidence: number;
    dragDeltaX: number;
    dragDeltaY: number;
    panDeltaX: number;  // canvas pan (fist gesture)
    panDeltaY: number;
    swipeProgress: number;
    frameCount: number;
}

interface Landmark { x: number; y: number; z: number }

function dist(a: Landmark, b: Landmark) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Lower factor = more responsive, less lag. 0.40 gives good precision + stability.
function smooth(prev: number, next: number, factor = 0.40) {
    return prev * factor + next * (1 - factor);
}

function classifyGesture(lm: Landmark[]): { gesture: GestureType; pinchDistance: number } {
    const pinchDist = dist(lm[4], lm[8]);
    if (pinchDist < 0.08) return { gesture: "pinch", pinchDistance: pinchDist };

    const up = [
        lm[8].y < lm[6].y,   // index
        lm[12].y < lm[10].y, // middle
        lm[16].y < lm[14].y, // ring
        lm[20].y < lm[18].y, // pinky
    ];
    const count = up.filter(Boolean).length;

    if (count <= 1) return { gesture: "fist", pinchDistance: pinchDist };
    if (count === 3) return { gesture: "panel", pinchDistance: pinchDist }; // 3 fingers = open details
    if (count >= 4) return { gesture: "open", pinchDistance: pinchDist };
    return { gesture: "none", pinchDistance: pinchDist };
}

const EMPTY: HandState = {
    gesture: "none", phase: "idle",
    x: 0.5, y: 0.5, pinchDistance: 1, confidence: 0,
    dragDeltaX: 0, dragDeltaY: 0,
    panDeltaX: 0, panDeltaY: 0,
    swipeProgress: 0, frameCount: 0,
};
const SWIPE_THRESHOLD = 0.18;

export function useGestureEngine(
    enabled: boolean,
    onZoom?: (delta: number) => void,
    onAutoSelect?: (x: number, y: number) => string | null | void,
    onPanelGesture?: () => void,
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
    const prevFistX = useRef<number | null>(null);  // for canvas pan
    const prevFistY = useRef<number | null>(null);
    const twoHandPrevDist = useRef<number | null>(null);
    const isDragging = useRef(false);
    const noHandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draggedPos = useRef<{ x: number; y: number } | null>(null);
    const panelFired = useRef(false); // prevent repeated panel opens

    // Refs into Zustand — always fresh in the rAF loop
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

                    // ── TWO-HAND ZOOM ──────────────────────────────────────────────
                    if (numHands === 2) {
                        const w0 = result.landmarks[0][0] as Landmark;
                        const w1 = result.landmarks[1][0] as Landmark;
                        const d = dist(w0, w1);
                        if (twoHandPrevDist.current !== null) {
                            const delta = d - twoHandPrevDist.current;
                            if (Math.abs(delta) > 0.008) onZoom?.(delta * 14);
                        }
                        twoHandPrevDist.current = d;
                        setHandState((p) => ({ ...p, gesture: "open", phase: "idle", confidence: 1 }));
                        rafRef.current = requestAnimationFrame(frame);
                        return;
                    }
                    twoHandPrevDist.current = null;

                    // ── NO HAND ────────────────────────────────────────────────────
                    if (numHands === 0) {
                        if (isDragging.current && selectedIdRef.current && draggedPos.current) {
                            updatePositionRef.current(selectedIdRef.current, draggedPos.current);
                            draggedPos.current = null;
                        }
                        isDragging.current = false;
                        prevPinchX.current = null;
                        prevPinchY.current = null;
                        prevFistX.current = null;
                        prevFistY.current = null;
                        swipeStartX.current = null;
                        panelFired.current = false;

                        if (noHandTimer.current) clearTimeout(noHandTimer.current);
                        noHandTimer.current = setTimeout(() => setSelectedRef.current(null), 1200);

                        setHandState({ ...EMPTY, confidence: 0 });
                        rafRef.current = requestAnimationFrame(frame);
                        return;
                    }

                    if (noHandTimer.current) { clearTimeout(noHandTimer.current); noHandTimer.current = null; }

                    // ── SINGLE HAND ────────────────────────────────────────────────
                    const lm = result.landmarks[0];
                    const { gesture, pinchDistance } = classifyGesture(lm as Landmark[]);

                    // ── CURSOR TRACKING POINT ──────────────────────────────────────
                    // Index fingertip (lm[8]) is the most precise pointer — it's where
                    // users naturally aim. Pinching: use thumb+index midpoint instead.
                    const tip8 = lm[8] as Landmark;
                    const tip4 = lm[4] as Landmark;
                    const rawPX = gesture === "pinch"
                        ? (tip4.x + tip8.x) / 2   // pinch midpoint
                        : tip8.x;                  // index fingertip
                    const rawPY = gesture === "pinch"
                        ? (tip4.y + tip8.y) / 2
                        : tip8.y;

                    // Mirror x (selfie camera), smooth to reduce jitter
                    smoothX.current = smooth(smoothX.current, 1 - rawPX, 0.40);
                    smoothY.current = smooth(smoothY.current, rawPY, 0.40);

                    // Debounce gestures (3 frames to confirm)
                    if (gesture === lastGesture.current) {
                        gestureFrames.current = Math.min(gestureFrames.current + 1, 99);
                    } else {
                        gestureFrames.current = 0;
                        lastGesture.current = gesture;
                    }
                    const confirmed = gestureFrames.current >= 3 ? gesture : "none";

                    const sid = selectedIdRef.current;
                    let dragDeltaX = 0, dragDeltaY = 0;
                    let panDeltaX = 0, panDeltaY = 0;
                    let swipeProgress = 0;
                    let phase: GesturePhase = "idle";

                    // ── OPEN HAND → deselect immediately ──────────────────────────
                    if (confirmed === "open") {
                        if (isDragging.current && sid && draggedPos.current) {
                            updatePositionRef.current(sid, draggedPos.current);
                            draggedPos.current = null;
                        }
                        isDragging.current = false;
                        prevPinchX.current = null;
                        prevPinchY.current = null;
                        panelFired.current = false;
                        setSelectedRef.current(null);
                        phase = "idle";
                    }

                    // ── PINCH → DRAG CARD ─────────────────────────────────────────
                    if (confirmed === "pinch") {
                        if (prevPinchX.current === null) {
                            // New pinch — always re-auto-select fresh card under hand
                            const pickedId = onAutoSelect?.(smoothX.current, smoothY.current);
                            if (pickedId !== undefined) {
                                selectedIdRef.current = pickedId;
                            }
                            prevPinchX.current = smoothX.current;
                            prevPinchY.current = smoothY.current;
                            phase = "ready";
                        } else {
                            const rawDx = smoothX.current - prevPinchX.current;
                            const rawDy = smoothY.current - (prevPinchY.current ?? smoothY.current);
                            dragDeltaX = rawDx * 1600;
                            dragDeltaY = rawDy * 1100;

                            const activeSid = selectedIdRef.current;
                            if (activeSid && (Math.abs(dragDeltaX) > 0.2 || Math.abs(dragDeltaY) > 0.2)) {
                                const livePos = gestureBridge.getLivePosition(activeSid);
                                const task = tasksRef.current.find((t) => t.id === activeSid);
                                const basePos = livePos ?? task?.position ?? { x: 0, y: 0 };
                                const newPos = { x: basePos.x + dragDeltaX, y: basePos.y + dragDeltaY };
                                gestureBridge.drag(activeSid, newPos.x, newPos.y);
                                draggedPos.current = newPos;
                                isDragging.current = true;
                            }

                            phase = isDragging.current ? "grabbing" : "ready";
                            prevPinchX.current = smoothX.current;
                            prevPinchY.current = smoothY.current;
                        }
                    } else if (confirmed !== "open") {
                        if (isDragging.current && sid && draggedPos.current) {
                            updatePositionRef.current(sid, draggedPos.current);
                            draggedPos.current = null;
                        }
                        isDragging.current = false;
                        if (confirmed !== "fist") {
                            prevPinchX.current = null;
                            prevPinchY.current = null;
                        }
                    }

                    // ── THREE FINGERS → OPEN DETAIL PANEL ────────────────────────
                    if (confirmed === "panel") {
                        phase = "panel";
                        if (!panelFired.current) {
                            // Auto-select if no card selected, then open panel
                            if (!sid) {
                                const newSid = onAutoSelect?.(smoothX.current, smoothY.current);
                                if (newSid !== undefined) selectedIdRef.current = newSid;
                            }
                            onPanelGesture?.();
                            panelFired.current = true;
                        }
                    } else {
                        panelFired.current = false;
                    }

                    // ── FIST → PAN CANVAS (+ swipe-to-dock) ──────────────────────
                    if (confirmed === "fist") {
                        phase = "panning";

                        // Pan delta: fist movement → canvas viewport shift
                        if (prevFistX.current !== null) {
                            panDeltaX = (smoothX.current - prevFistX.current) * 1400;
                            panDeltaY = (smoothY.current - (prevFistY.current ?? smoothY.current)) * 1000;
                        }
                        prevFistX.current = smoothX.current;
                        prevFistY.current = smoothY.current;

                        // Track total horizontal displacement for dock swipe
                        if (swipeStartX.current === null) swipeStartX.current = smoothX.current;
                        swipeProgress = Math.min(
                            Math.abs(smoothX.current - (swipeStartX.current ?? smoothX.current)) / SWIPE_THRESHOLD,
                            1
                        );

                        // Dock on large swipe
                        if (swipeProgress >= 1 && sid) {
                            toggleDockRef.current(sid);
                            setSelectedRef.current(null);
                            swipeStartX.current = null;
                            swipeProgress = 0;
                        }

                        if (swipeProgress > 0.3) phase = "swiping";
                    } else {
                        prevFistX.current = null;
                        prevFistY.current = null;
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
                        panDeltaX,
                        panDeltaY,
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
    }, [enabled, stop, onZoom, onAutoSelect, onPanelGesture]);

    return { handState, isReady, error };
}
