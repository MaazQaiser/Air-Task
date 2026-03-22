"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { subscribeToCards } from "@/lib/firestoreService";

export default function FirestoreSync() {
  const { user } = useAuthStore();
  const { activeCanvasId, setTasks } = useTaskStore();

  useEffect(() => {
    if (!user || !activeCanvasId) return;

    // Optional migration
    const migrateData = async () => {
      try {
        const localData = localStorage.getItem("airtasks-store");
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed?.state?.tasks?.length > 0) {
            const { migrateLocalStorageToFirestore } = await import("@/lib/firestoreService");
            await migrateLocalStorageToFirestore(user.uid, parsed.state.tasks);
            // Delete local storage after successful migration so we don't do it again
            localStorage.removeItem("airtasks-store");
          }
        }
      } catch (err) {
        console.error("Migration failed:", err);
      }
    };

    migrateData();

    // Set up real-time listener
    const unsubscribe = subscribeToCards(user.uid, activeCanvasId, (cards) => {
      setTasks(cards);
    });

    return () => unsubscribe();
  }, [user, activeCanvasId, setTasks]);

  return null; // This is a logic-only component
}
