"use client";
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    NodeTypes,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ReactFlowInstance,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useEffect, useRef } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useCanvasStore } from "@/stores/canvasStore";
import TaskCard from "@/components/cards/TaskCard";
import ChecklistCard from "@/components/cards/ChecklistCard";
import NoteCard from "@/components/cards/NoteCard";
import StickerCard from "@/components/cards/StickerCard";
import { Task } from "@/types/task";
import { gestureBridge } from "@/lib/gestureBridge";
import { useClipboardStore } from "@/stores/clipboardStore";
import CanvasPicker from "@/components/ui/CanvasPicker";
import CopyToast, { showToast } from "@/components/ui/CopyToast";
import { generateId } from "@/lib/utils";
import { CanvasEdge } from "@/types/task";

const nodeTypes: NodeTypes = {
    task: TaskCard,
    checklist: ChecklistCard,
    note: NoteCard,
    sticker: StickerCard,
};

export default function TaskCanvas() {
    const { tasks, selectedId, edges: storeEdges, setSelected, updatePosition, addConnection, removeConnection } = useTaskStore();
    const { theme, activeCanvasId } = useCanvasStore();
    const { copyCard, pasteCard, copiedCard } = useClipboardStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync store edges to React Flow
    useEffect(() => {
        setEdges(storeEdges);
    }, [storeEdges, setEdges]);

    // Fit viewport only once on initial data load
    const rfInstance = useRef<ReactFlowInstance | null>(null);
    const initialFitDone = useRef(false);

    // Flag: is gesture drag active?
    const gestureDragging = useRef(false);

    // Register gesture bridge — direct setNodes handler (no Zustand roundtrip during drag)
    useEffect(() => {
        gestureBridge.register((id, x, y) => {
            gestureDragging.current = true;
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, position: { x, y } } : n
                )
            );
        });
        return () => gestureBridge.unregister();
    }, [setNodes]);

    // Sync Zustand → React Flow nodes — skip during active gesture drag
    useEffect(() => {
        if (gestureDragging.current) {
            gestureDragging.current = false;
        }
        const mappedNodes = tasks
            .filter((t) => !t.docked)
            .map((t) => ({
                id: t.id,
                type: t.type,
                position: t.position,
                data: { ...t },
                draggable: !t.pinned,
                selected: t.id === selectedId,
            }));
        setNodes(mappedNodes);

        // Fit viewport once after initial data arrives
        if (!initialFitDone.current && mappedNodes.length > 0 && rfInstance.current) {
            initialFitDone.current = true;
            setTimeout(() => {
                rfInstance.current?.fitView({ padding: 0.3, maxZoom: 1 });
            }, 100);
        }
    }, [tasks, selectedId, setNodes]);

    const onInit = useCallback((instance: ReactFlowInstance) => {
        rfInstance.current = instance;
        // Fit immediately if nodes already exist
        setTimeout(() => instance.fitView({ padding: 0.3, maxZoom: 1 }), 200);
    }, []);

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;
            const edge: CanvasEdge = {
                id: `e-${generateId()}`,
                source: params.source,
                target: params.target,
                animated: true,
                style: { stroke: "var(--accent-primary)", strokeOpacity: 0.8, strokeWidth: 2 },
            };
            addConnection(edge);
        },
        [addConnection]
    );

    const onEdgesDelete = useCallback(
        (deletedEdges: any[]) => {
            deletedEdges.forEach((edge) => removeConnection(edge.id));
        },
        [removeConnection]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: { id: string }) => { setSelected(node.id); },
        [setSelected]
    );

    const onPaneClick = useCallback(() => { setSelected(null); }, [setSelected]);

    const onNodeDragStop = useCallback(
        (_: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
            updatePosition(node.id, node.position);
        },
        [updatePosition]
    );

    const onDoubleClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".react-flow__node")) return;
        const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
        useTaskStore.getState().addTask("task", { x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    }, []);

    // Handle Keyboard Copy/Paste/Cut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

            const isMacCmd = navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey;
            const isCtrl = !navigator.platform.toUpperCase().includes('MAC') && e.ctrlKey;
            const isModifier = isMacCmd || isCtrl;

            if (isModifier && e.key === "c") {
                const selectedTask = tasks.find(t => t.id === selectedId);
                if (selectedTask) {
                    copyCard(selectedTask, activeCanvasId);
                    showToast(`Copied: ${selectedTask.title}`, "📋", "#00d4ff");
                }
            } else if (isModifier && e.key === "x") {
                const selectedTask = tasks.find(t => t.id === selectedId);
                if (selectedTask) {
                    copyCard(selectedTask, activeCanvasId, true);
                    showToast(`Cut: ${selectedTask.title}`, "✂️", "#ef4444");
                }
            } else if (isModifier && !e.shiftKey && e.key === "v") {
                if (copiedCard) {
                    pasteCard(activeCanvasId);
                    showToast(`Pasted`, "✨", "#10b981");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, tasks, activeCanvasId, copyCard, pasteCard, copiedCard]);

    const minimapNodeColor = (node: { data: Task }) => {
        const colors: Record<string, string> = { task: "#00d4ff", checklist: "#a855f7", note: "#10b981" };
        return colors[node.data?.type] ?? "#888";
    };

    return (
        <div className="w-full h-full canvas-bg" onDoubleClick={onDoubleClick}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgesDelete}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                onInit={onInit}
                minZoom={0.1}
                maxZoom={2.5}
                deleteKeyCode={null}
                connectionMode={ConnectionMode.Loose}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={28}
                    size={1.2}
                    color={theme === "dark" ? "rgba(0,212,255,0.1)" : "rgba(99,102,241,0.1)"}
                />
                <Controls showInteractive={false} />
                <MiniMap
                    nodeColor={minimapNodeColor as (node: { data: unknown }) => string}
                    maskColor={theme === "dark" ? "rgba(8,12,20,0.7)" : "rgba(240,242,247,0.7)"}
                    pannable
                    zoomable
                />
            </ReactFlow>

            <div className="absolute bottom-6 right-6 text-[11px] font-mono pointer-events-none"
                style={{ color: "var(--text-muted)" }}>
                Double-click canvas to add task · Drag to move · Scroll to zoom
            </div>

            <CanvasPicker />
            <CopyToast />
        </div>
    );
}
