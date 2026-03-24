import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuthStore } from "@/stores/authStore";

export interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    createdAt: number;
    reactions: Record<string, string[]>; // Context: { '🔥': ['userA', 'userB'] }
}

export function subscribeToComments(
    canvasId: string,
    cardId: string,
    onUpdate: (comments: Comment[]) => void
) {
    const user = useAuthStore.getState().user;
    if (!user) return () => {};

    const commentsRef = collection(db, "users", user.uid, "canvases", canvasId, "cards", cardId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Ensure valid frontend timestamp array fallback
            createdAt: doc.data().createdAt?.toMillis() || Date.now(),
            reactions: doc.data().reactions || {},
        })) as Comment[];
        onUpdate(comments);
    });
}

export async function addComment(canvasId: string, cardId: string, text: string) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Must be logged in to comment.");

    const commentsRef = collection(db, "users", user.uid, "canvases", canvasId, "cards", cardId, "comments");
    await addDoc(commentsRef, {
        text,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
        reactions: {},
    });

    // Update the parent card's denormalized comment count
    const cardRef = doc(db, "users", user.uid, "canvases", canvasId, "cards", cardId);
    const cardSnap = await getDoc(cardRef);
    if (cardSnap.exists()) {
        const currentCount = cardSnap.data().commentCount || 0;
        await updateDoc(cardRef, { commentCount: currentCount + 1 });
    }
}

export async function toggleReaction(canvasId: string, cardId: string, commentId: string, emoji: string) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Must be logged in to react.");

    const commentRef = doc(db, "users", user.uid, "canvases", canvasId, "cards", cardId, "comments", commentId);
    const snap = await getDoc(commentRef);

    if (snap.exists()) {
        const data = snap.data();
        const reactions = data.reactions || {};
        const users = reactions[emoji] || [];
        
        const hasReacted = users.includes(user.uid);
        
        let newUsers;
        if (hasReacted) {
            newUsers = users.filter((u: string) => u !== user.uid);
        } else {
            newUsers = [...users, user.uid];
        }

        const newReactions = { ...reactions };
        if (newUsers.length === 0) {
            delete newReactions[emoji];
        } else {
            newReactions[emoji] = newUsers;
        }

        await updateDoc(commentRef, { reactions: newReactions });
    }
}

export async function deleteComment(canvasId: string, cardId: string, commentId: string) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Must be logged in.");

    const commentRef = doc(db, "users", user.uid, "canvases", canvasId, "cards", cardId, "comments", commentId);
    await deleteDoc(commentRef);

    // Decrement the parent card's comment count
    const cardRef = doc(db, "users", user.uid, "canvases", canvasId, "cards", cardId);
    const cardSnap = await getDoc(cardRef);
    if (cardSnap.exists()) {
        const currentCount = cardSnap.data().commentCount || 0;
        await updateDoc(cardRef, { commentCount: Math.max(0, currentCount - 1) });
    }
}
