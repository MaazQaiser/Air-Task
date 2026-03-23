"use client";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "reactflow";
import Toolbar from "@/components/ui/Toolbar";
import TaskDock from "@/components/dock/TaskDock";
import FirestoreSync from "@/components/canvas/FirestoreSync";
import CanvasSidebar from "@/components/canvas/CanvasSidebar";

const TaskCanvas = dynamic(() => import("@/components/canvas/TaskCanvas"), { ssr: false });

export default function HomePage() {
  return (
    // ReactFlowProvider wraps everything so Toolbar + Canvas can both use useReactFlow()
    <ReactFlowProvider>
      <main className="w-screen h-screen overflow-hidden relative">
        {/* Global background gradients */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 20% 20%, rgba(0,212,255,0.06) 0%, transparent 70%),
              radial-gradient(ellipse 50% 60% at 80% 70%, rgba(168,85,247,0.06) 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 50% 50%, rgba(16,185,129,0.03) 0%, transparent 70%)
            `,
          }}
        />

        <FirestoreSync />
        <CanvasSidebar />

        {/* Top toolbar — has access to useReactFlow() via the provider above */}
        <Toolbar />

        {/* Main canvas */}
        <div className="absolute inset-0 z-10">
          <TaskCanvas />
        </div>

        {/* Task dock */}
        <TaskDock />
      </main>
    </ReactFlowProvider>
  );
}
