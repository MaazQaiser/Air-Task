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
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useEffect, useRef } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useCanvasStore } from "@/stores/canvasStore";
import TaskCard from "@/components/cards/TaskCard";
import ChecklistCard from "@/components/cards/ChecklistCard";
import NoteCard from "@/components/cards/NoteCard";
import { Task } from "@/types/task";
import { gestureBridge } from "@/lib/gestureBridge";

const nodeTypes: NodeTypes = {
    task: TaskCard,
    checklist: ChecklistCard,
    note: NoteCard,
};

export default function TaskCanvas() {
    const { tasks, setSelected, updatePosition, selectedId } = useTaskStore();
    const { theme } = useCanvasStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Flag: is gesture drag active? If yes, skip the Zustand→nodes sync
    // (gesture bridge is updating nodes directly to avoid jitter)
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
            // Drag ended (Zustand position was updated) — clear flag and sync
            gestureDragging.current = false;
        }
        setNodes(
            tasks
                .filter((t) => !t.docked)
                .map((t) => ({
                    id: t.id,
                    type: t.type,
                    position: t.position,
                    data: { ...t },
                    draggable: !t.pinned,
                    selected: t.id === selectedId,
                }))
        );
    }, [tasks, selectedId, setNodes]);

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    { ...params, animated: true, style: { stroke: "var(--accent-primary)", strokeOpacity: 0.4 } },
                    eds
                )
            ),
        [setEdges]
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
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
                minZoom={0.1}
                maxZoom={2.5}
                deleteKeyCode={null}
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
        </div>
    );
}
