"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { subscribeToCards } from "@/lib/firestoreService";
import { subscribeToCanvases, createCanvas } from "@/lib/canvasService";
import { Canvas } from "@/types/canvas";

export default function FirestoreSync() {
    const { user } = useAuthStore();
    const { activeCanvasId, setCanvases } = useCanvasStore();
    const { setTasks } = useTaskStore();

    // ── 1. Subscribe to user's canvases ──────────────────────
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToCanvases(user.uid, (canvases: Canvas[]) => {
            if (canvases.length === 0) {
                // First-time user — create a default canvas
                const defaultCanvas: Canvas = {
                    id: "default-canvas",
                    name: "My Workspace",
                    icon: "🏠",
                    color: "#6366f1",
                    sortOrder: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                createCanvas(user.uid, defaultCanvas).catch(console.error);
                setCanvases([defaultCanvas]);
            } else {
                setCanvases(canvases);
            }
        });

        return () => unsubscribe();
    }, [user, setCanvases]);

    // ── 2. Subscribe to cards of active canvas ───────────────
    useEffect(() => {
        if (!user || !activeCanvasId) return;

        const unsubscribe = subscribeToCards(user.uid, activeCanvasId, (cards) => {
            setTasks(cards);
        });

        return () => unsubscribe();
    }, [user, activeCanvasId, setTasks]);

    // ── 3. Optional: migrate local storage (first login only)
    useEffect(() => {
        if (!user) return;

        const migrateData = async () => {
            try {
                const localData = localStorage.getItem("airtasks-store");
                if (localData) {
                    const parsed = JSON.parse(localData);
                    if (parsed?.state?.tasks?.length > 0) {
                        const { migrateLocalStorageToFirestore } = await import(
                            "@/lib/firestoreService"
                        );
                        await migrateLocalStorageToFirestore(user.uid, parsed.state.tasks);
                        localStorage.removeItem("airtasks-store");
                    }
                }
            } catch (err) {
                console.error("Migration failed:", err);
            }
        };

        migrateData();
    }, [user]);

    return null; // Logic-only component
}
