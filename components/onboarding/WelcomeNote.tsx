"use client";
import { useEffect, useRef } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore";

/**
 * Creates a welcome sticky note on the canvas for first-time users.
 * Tracks per-canvas so switching to a brand-new canvas also shows welcome content.
 * Logic-only component — no UI.
 */
export default function WelcomeNote() {
    const { user } = useAuthStore();
    const { tasks, addTask, updateTask } = useTaskStore();
    const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
    const seenCanvases = useRef<Set<string>>(new Set());
    const creatingRef = useRef(false);

    useEffect(() => {
        if (!user || creatingRef.current) return;

        // Check if we've already processed this canvas in this session
        if (seenCanvases.current.has(activeCanvasId)) return;

        const timer = setTimeout(() => {
            // Re-check tasks after settling (Firestore sync may have loaded cards)
            const currentTasks = useTaskStore.getState().tasks;
            if (currentTasks.length > 0) {
                // Canvas already has cards — mark as seen and skip
                seenCanvases.current.add(activeCanvasId);
                return;
            }

            // Check localStorage for per-canvas flag
            const key = `airtasks-welcome-${activeCanvasId}`;
            if (localStorage.getItem(key)) {
                seenCanvases.current.add(activeCanvasId);
                return;
            }

            creatingRef.current = true;
            seenCanvases.current.add(activeCanvasId);

            // Create a welcome note
            const noteId = addTask("note", { x: 300, y: 180 }, "👋 Welcome to AirTasks!");
            updateTask(noteId, {
                description: [
                    "This is your spatial workspace! Quick tips:",
                    "",
                    "🖱️  Double-click canvas → create a task",
                    "✋  Drag cards to arrange freely",
                    "🎤  Voice: \"Add task: Buy groceries\"",
                    "🤚  Gesture: point, pinch, release",
                    "📁  Sidebar → manage workspaces",
                    "⭐  Stickers & avatars in toolbar",
                    "",
                    "Delete this note anytime!",
                ].join("\n"),
                color: "#22d3ee",
            });

            // Add a sample task 
            addTask("task", { x: 680, y: 160 }, "My first task ✨");

            // Add a welcome sticker
            addTask("sticker", { x: 220, y: 170 }, "🚀");

            localStorage.setItem(key, "true");
            creatingRef.current = false;
        }, 3000); // Wait for Firestore sync to deliver existing cards

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeCanvasId]);

    return null;
}
