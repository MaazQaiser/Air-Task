import { db } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { Canvas } from "@/types/canvas";

/**
 * Create a new canvas under a user's collection
 */
export const createCanvas = async (userId: string, canvas: Canvas) => {
    const ref = doc(db, `users/${userId}/canvases`, canvas.id);
    await setDoc(ref, {
        ...canvas,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

/**
 * Update a canvas (rename, recolor, re-icon, reorder)
 */
export const updateCanvas = async (
    userId: string,
    canvasId: string,
    updates: Partial<Canvas>
) => {
    const ref = doc(db, `users/${userId}/canvases`, canvasId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

/**
 * Delete a canvas (and all its cards — handled separately)
 */
export const deleteCanvas = async (userId: string, canvasId: string) => {
    const ref = doc(db, `users/${userId}/canvases`, canvasId);
    await deleteDoc(ref);
};

/**
 * Subscribe to the user's canvas list in real time
 */
export const subscribeToCanvases = (
    userId: string,
    callback: (canvases: Canvas[]) => void
) => {
    const q = query(
        collection(db, `users/${userId}/canvases`),
        orderBy("sortOrder", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const canvases = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id,
        })) as Canvas[];
        callback(canvases);
    });
};
