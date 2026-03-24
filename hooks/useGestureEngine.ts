"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { gestureBridge } from "@/lib/gestureBridge";

export type GestureType = "pinch" | "open" | "fist" | "panel" | "point" | "peace" | "horns" | "none";
export type GesturePhase = "idle" | "ready" | "grabbing" | "panning" | "swiping" | "panel" | "pointing" | "switching" | "sharing";

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
    pointHoldProgress: number;    // 0–1, fills up while holding point gesture
    switchDirection: "left" | "right" | null; // peace-swipe direction
}

interface Landmark { x: number; y: number; z: number }

function dist(a: Landmark, b: Landmark) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── 1€ Adaptive Filter ────────────────────────────────────────────────
// Gives near-zero lag during fast hand movements but strong jitter
// reduction when the hand is still. Much better than fixed smoothing.
// Reference: https://gery.casiez.net/1euro/
class OneEuroFilter {
    private xPrev: number;
    private dxPrev: number;
    private tPrev: number;
    private initialized: boolean;

    constructor(
        private minCutoff: number = 1.0,   // lower = more smoothing at low speed
        private beta: number = 0.007,      // higher = less lag during fast moves
        private dCutoff: number = 1.0,     // cutoff for derivative filter
    ) {
        this.xPrev = 0;
        this.dxPrev = 0;
        this.tPrev = 0;
        this.initialized = false;
    }

    private alpha(cutoff: number, dt: number): number {
        const tau = 1.0 / (2 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / dt);
    }

    filter(x: number, t: number): number {
        if (!this.initialized) {
            this.xPrev = x;
            this.dxPrev = 0;
            this.tPrev = t;
            this.initialized = true;
            return x;
        }

        const dt = Math.max(t - this.tPrev, 1e-6);
        this.tPrev = t;

        // Derivative (speed) estimation
        const dx = (x - this.xPrev) / dt;
        const aD = this.alpha(this.dCutoff, dt);
        const dxFiltered = aD * dx + (1 - aD) * this.dxPrev;
        this.dxPrev = dxFiltered;

        // Adaptive cutoff: fast movement → higher cutoff → less smoothing
        const cutoff = this.minCutoff + this.beta * Math.abs(dxFiltered);
        const aX = this.alpha(cutoff, dt);
        const xFiltered = aX * x + (1 - aX) * this.xPrev;
        this.xPrev = xFiltered;

        return xFiltered;
    }

    reset() {
        this.initialized = false;
    }
}

// ── Gesture Classification with Per-Gesture Confidence ─────────────────
// Uses relative pinch threshold (ratio of pinch distance to palm size)
// so it adapts to different hand sizes and camera distances.
function palmSize(lm: Landmark[]): number {
    // Wrist (0) to middle-finger MCP (9) — stable palm reference
    return dist(lm[0], lm[9]);
}

interface ClassifyResult {
    gesture: GestureType;
    pinchDistance: number;
    confidence: number;   // 0.0–1.0 how certain we are about this gesture
}

function classifyGesture(lm: Landmark[]): ClassifyResult {
    const pinchDist = dist(lm[4], lm[8]);
    const palm = palmSize(lm);

    // Guard against degenerate frames
    if (palm < 0.01) return { gesture: "none", pinchDistance: pinchDist, confidence: 0 };

    // Relative pinch ratio — independent of hand size & camera distance
    const pinchRatio = pinchDist / palm;

    // Pinch: thumb tip close to index tip relative to palm
    if (pinchRatio < 0.25) {
        // Confidence ramps from 0.5 at the threshold to 1.0 at very tight pinch
        const conf = Math.min(1.0, 0.5 + (0.25 - pinchRatio) * 4);
        return { gesture: "pinch", pinchDistance: pinchDist, confidence: conf };
    }

    // Finger-up detection with hysteresis
    const fingerExtension = [
        (lm[6].y - lm[8].y) / palm,   // index: how far tip is above PIP
        (lm[10].y - lm[12].y) / palm, // middle
        (lm[14].y - lm[16].y) / palm, // ring
        (lm[18].y - lm[20].y) / palm, // pinky
    ];

    const UP_THRESHOLD = 0.04;   // normalize threshold to palm size
    const up = fingerExtension.map(e => e > UP_THRESHOLD);
    const [indexUp, middleUp, ringUp, pinkyUp] = up;
    const count = up.filter(Boolean).length;

    // Average extension for confidence (how clearly extended/curled)
    const avgExtension = fingerExtension.reduce((a, b) => a + Math.abs(b), 0) / 4;
    const extensionConf = Math.min(1.0, avgExtension * 5);

    // ── POINT: only index finger extended (👆) ──────────────────────────
    if (count === 1 && indexUp && !middleUp && !ringUp && !pinkyUp) {
        return { gesture: "point", pinchDistance: pinchDist, confidence: extensionConf };
    }

    // ── PEACE / V-SIGN: index + middle up, ring + pinky down (✌️) ──────
    if (count === 2 && indexUp && middleUp && !ringUp && !pinkyUp) {
        return { gesture: "peace", pinchDistance: pinchDist, confidence: extensionConf * 0.9 };
    }

    // ── HORNS / ROCK-ON: index + pinky up, middle + ring down (🤘) ─────
    if (count === 2 && indexUp && !middleUp && !ringUp && pinkyUp) {
        return { gesture: "horns", pinchDistance: pinchDist, confidence: extensionConf * 0.9 };
    }

    if (count <= 1) {
        return { gesture: "fist", pinchDistance: pinchDist, confidence: extensionConf };
    }
    if (count === 3) {
        // Panel gesture: exactly 3 fingers — medium confidence if 2 or 4 are close
        return { gesture: "panel", pinchDistance: pinchDist, confidence: extensionConf * 0.85 };
    }
    if (count >= 4) {
        return { gesture: "open", pinchDistance: pinchDist, confidence: extensionConf };
    }
    return { gesture: "none", pinchDistance: pinchDist, confidence: 0.3 };
}

const EMPTY: HandState = {
    gesture: "none", phase: "idle",
    x: 0.5, y: 0.5, pinchDistance: 1, confidence: 0,
    dragDeltaX: 0, dragDeltaY: 0,
    panDeltaX: 0, panDeltaY: 0,
    swipeProgress: 0, frameCount: 0,
    pointHoldProgress: 0, switchDirection: null,
};
const SWIPE_THRESHOLD = 0.18;
const GESTURE_COOLDOWN_MS = 150; // prevent rapid gesture toggling

const SHARE_HOLD_MS = 800;    // hold point gesture this long to share (snappier)
const SWITCH_THRESHOLD = 0.12; // peace-swipe distance to trigger canvas switch

export function useGestureEngine(
    enabled: boolean,
    onZoom?: (delta: number) => void,
    onAutoSelect?: (x: number, y: number) => string | null | void,
    onPanelGesture?: () => void,
    onCopyGesture?: () => void,
    onPasteGesture?: (x: number, y: number) => void,
    onSwitchCanvas?: (direction: "left" | "right") => void,
) {
    const [handState, setHandState] = useState<HandState>(EMPTY);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rafRef = useRef<number>(0);

    // 1€ Filters for cursor x/y — fine-tuned for high precision & low lag
    const filterX = useRef(new OneEuroFilter(0.3, 0.015, 1.0));
    const filterY = useRef(new OneEuroFilter(0.3, 0.015, 1.0));
    const smoothX = useRef(0.5);
    const smoothY = useRef(0.5);

    const lastGesture = useRef<GestureType>("none");
    const gestureFrames = useRef(0);
    const lastGestureChangeTime = useRef(0);  // cooldown timestamp
    const swipeStartX = useRef<number | null>(null);
    const prevPinchX = useRef<number | null>(null);
    const prevPinchY = useRef<number | null>(null);
    const prevFistX = useRef<number | null>(null);  // for canvas pan
    const prevFistY = useRef<number | null>(null);
    const prevPeaceX = useRef<number | null>(null);
    const twoHandPrevDist = useRef<number | null>(null);
    const isDragging = useRef(false);
    const noHandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draggedPos = useRef<{ x: number; y: number } | null>(null);
    const panelFired = useRef(false); // prevent repeated panel opens
    const pointHoldFrames = useRef(0);
    const gestureActionFired = useRef(false);

    // Point and Horns state
    const pointStartTime = useRef<number | null>(null);
    const hornsStartTime = useRef<number | null>(null);
    const shareFired = useRef(false);

    // Peace-to-switch state
    const peaceStartX = useRef<number | null>(null);
    const switchFired = useRef(false);

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
        setStream(null);
        setHandState(EMPTY);
        isDragging.current = false;
        filterX.current.reset();
        filterY.current.reset();
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
                    minHandDetectionConfidence: 0.6,
                    minHandPresenceConfidence: 0.6,
                    minTrackingConfidence: 0.6,
                });

                // Higher resolution for better landmark precision
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 },
                        facingMode: "user",
                    },
                });
                if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }

                const video = document.createElement("video");
                video.srcObject = stream;
                video.playsInline = true;
                video.muted = true;
                await video.play();
                videoRef.current = video;
                setStream(stream);
                setIsReady(true);
                setError(null);

                function frame(time: number) {
                    if (!active || !detector || !videoRef.current) return;

                    const result = detector.detectForVideo(videoRef.current, time);
                    const numHands = result.landmarks?.length ?? 0;
                    const now = performance.now();

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
                        setHandState((p) => ({ ...p, gesture: "open", phase: "idle", confidence: 1, shareHoldProgress: 0, switchDirection: null }));
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
                        hornsStartTime.current = null;
                        shareFired.current = false;
                        peaceStartX.current = null;
                        switchFired.current = false;

                        if (noHandTimer.current) clearTimeout(noHandTimer.current);
                        noHandTimer.current = setTimeout(() => setSelectedRef.current(null), 1200);

                        setHandState({ ...EMPTY, confidence: 0 });
                        rafRef.current = requestAnimationFrame(frame);
                        return;
                    }

                    if (noHandTimer.current) { clearTimeout(noHandTimer.current); noHandTimer.current = null; }

                    // ── SINGLE HAND ────────────────────────────────────────────────
                    const lm = result.landmarks[0];
                    const { gesture, pinchDistance, confidence: gestureConfidence } =
                        classifyGesture(lm as Landmark[]);

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

                    // Mirror x (selfie camera), apply 1€ adaptive filter
                    const timeInSeconds = now / 1000;
                    smoothX.current = filterX.current.filter(1 - rawPX, timeInSeconds);
                    smoothY.current = filterY.current.filter(rawPY, timeInSeconds);

                    // Debounce gestures (3 frames to confirm) with cooldown
                    if (gesture === lastGesture.current) {
                        gestureFrames.current = Math.min(gestureFrames.current + 1, 99);
                    } else {
                        // Cooldown: ignore rapid changes within GESTURE_COOLDOWN_MS
                        if (now - lastGestureChangeTime.current < GESTURE_COOLDOWN_MS) {
                            // Keep previous gesture, don't reset frame count
                        } else {
                            gestureFrames.current = 0;
                            lastGesture.current = gesture;
                            lastGestureChangeTime.current = now;
                            pointHoldFrames.current = 0;
                            gestureActionFired.current = false;
                        }
                    }
                    const confirmed = gestureFrames.current >= 3 ? lastGesture.current : "none";

                    const sid = selectedIdRef.current;
                    let dragDeltaX = 0, dragDeltaY = 0;
                    let panDeltaX = 0, panDeltaY = 0;
                    let swipeProgress = 0;
                    let pointHoldProgress = 0;
                    let switchDirection: "left" | "right" | null = null;
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
                        prevPeaceX.current = null;
                        panelFired.current = false;
                        gestureActionFired.current = false;
                        pointHoldFrames.current = 0;
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

                    // ── POINT → JUST POINTER & AUTO-SELECT ────────────────────────
                    if (confirmed === "point") {
                        phase = "pointing";
                        if (pointStartTime.current === null) {
                            pointStartTime.current = now;
                            shareFired.current = false;
                            
                            // Aggressively target item under pointer
                            const newSid = onAutoSelect?.(smoothX.current, smoothY.current);
                            if (newSid !== undefined) selectedIdRef.current = newSid;
                        }
                        const elapsed = now - pointStartTime.current;
                        pointHoldProgress = Math.min(elapsed / SHARE_HOLD_MS, 1);

                        if (pointHoldProgress >= 1 && !shareFired.current) {
                            if (selectedIdRef.current) {
                                onCopyGesture?.();
                            } else {
                                onPasteGesture?.(smoothX.current, smoothY.current);
                            }
                            shareFired.current = true;
                        }
                    } else {
                        pointStartTime.current = null;
                        shareFired.current = false;
                    }

                    // ── PEACE / V-SIGN → SWITCH CANVAS (swipe L/R) ────────────────
                    if (confirmed === "peace") {
                        phase = "switching";
                        if (peaceStartX.current === null) {
                            peaceStartX.current = smoothX.current;
                            switchFired.current = false;
                        }
                        const dx = smoothX.current - peaceStartX.current;

                        if (Math.abs(dx) > SWITCH_THRESHOLD && !switchFired.current) {
                            switchDirection = dx > 0 ? "right" : "left";
                            onSwitchCanvas?.(switchDirection);
                            switchFired.current = true;
                            // Reset origin so they can swipe again after returning
                            peaceStartX.current = smoothX.current;
                        } else if (!switchFired.current && Math.abs(dx) > 0.03) {
                            // Show preview direction while swiping
                            switchDirection = dx > 0 ? "right" : "left";
                        }
                    } else {
                        peaceStartX.current = null;
                        switchFired.current = false;
                    }

                    setHandState({
                        gesture: confirmed,
                        phase,
                        x: smoothX.current,
                        y: smoothY.current,
                        pinchDistance,
                        confidence: gestureConfidence,
                        dragDeltaX,
                        dragDeltaY,
                        panDeltaX,
                        panDeltaY,
                        swipeProgress,
                        frameCount: gestureFrames.current,
                        pointHoldProgress,
                        switchDirection,
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
    }, [enabled, stop, onZoom, onAutoSelect, onPanelGesture, onCopyGesture, onPasteGesture, onSwitchCanvas]);

    return { handState, isReady, error, stream };
}
