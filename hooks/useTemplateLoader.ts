"use client";
import { useCallback } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { createCard } from "@/lib/firestoreService";
import { Template, instantiateTemplate } from "@/lib/templates";

export function useTemplateLoader() {
    const { tasks, setTasks } = useTaskStore();
    const { user } = useAuthStore();
    const { activeCanvasId } = useCanvasStore();

    const loadTemplate = useCallback(
        async (template: Template) => {
            if (!user) return;

            // Center the template cluster in a reasonable viewport area
            const cx = 500 + Math.random() * 200;
            const cy = 300 + Math.random() * 150;

            const newCards = instantiateTemplate(template, cx, cy);

            // Optimistic update
            useTaskStore.setState((state) => ({
                tasks: [...state.tasks, ...newCards],
            }));

            // Persist all cards to Firestore
            await Promise.all(
                newCards.map((card) =>
                    createCard(user.uid, activeCanvasId, card).catch(console.error)
                )
            );
        },
        [user, activeCanvasId]
    );

    return { loadTemplate };
}
