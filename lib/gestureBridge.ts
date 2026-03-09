// A zero-React bridge: gesture engine → canvas setNodes bypass
// This avoids Zustand → useEffect → setNodes on every rAF frame during drag (which causes jitter)
// Instead, during drag we call canvas directly, and only write to Zustand on drag END.

type DragFn = (id: string, x: number, y: number) => void;
type PositionRecord = Record<string, { x: number; y: number }>;

let _dragFn: DragFn | null = null;
let _livePositions: PositionRecord = {};

export const gestureBridge = {
    /** Canvas calls this on mount to register its setNodes handler */
    register(fn: DragFn) {
        _dragFn = fn;
    },
    unregister() {
        _dragFn = null;
        _livePositions = {};
    },
    /** Gesture engine calls this every rAF frame during drag — direct, no React state */
    drag(id: string, x: number, y: number) {
        _livePositions[id] = { x, y };
        _dragFn?.(id, x, y);
    },
    /** Get current live position for a task (may differ from Zustand during active drag) */
    getLivePosition(id: string) {
        return _livePositions[id] ?? null;
    },
};
