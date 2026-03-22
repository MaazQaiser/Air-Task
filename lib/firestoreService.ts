import { db } from "./firebase";
import { 
  collection, doc, setDoc, updateDoc, 
  deleteDoc, onSnapshot, query, where,
  getDocs, getDoc,
  serverTimestamp
} from "firebase/firestore";
import { Task } from "@/types/task";

export const createCard = async (userId: string, canvasId: string, task: Task) => {
  const cardRef = doc(db, `users/${userId}/canvases/${canvasId}/cards`, task.id);
  await setDoc(cardRef, {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCard = async (userId: string, canvasId: string, taskId: string, updates: Partial<Task>) => {
  const cardRef = doc(db, `users/${userId}/canvases/${canvasId}/cards`, taskId);
  await updateDoc(cardRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCard = async (userId: string, canvasId: string, taskId: string) => {
  const cardRef = doc(db, `users/${userId}/canvases/${canvasId}/cards`, taskId);
  await deleteDoc(cardRef);
};

export const subscribeToCards = (userId: string, canvasId: string, callback: (cards: Task[]) => void) => {
  const q = query(collection(db, `users/${userId}/canvases/${canvasId}/cards`));
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Task);
    callback(cards);
  });
};

export const migrateLocalStorageToFirestore = async (userId: string, localCards: Task[]) => {
  const migrationsRef = doc(db, `users/${userId}`);
  const snap = await getDoc(migrationsRef);
  if (snap.exists() && snap.data().migrated) return; // already migrated

  // Create a default 'Migrated Canvas'
  const canvasId = "default-canvas";
  const canvasRef = doc(db, `users/${userId}/canvases`, canvasId);
  await setDoc(canvasRef, {
    name: "Migrated Workspace",
    icon: "🏠",
    color: "#6366f1",
    sortOrder: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Upload local cards
  for (const card of localCards) {
    await createCard(userId, canvasId, card);
  }

  // Mark as migrated
  await updateDoc(migrationsRef, { migrated: true });
};
