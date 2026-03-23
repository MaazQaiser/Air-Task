import { db } from "./firebase";
import { generateId } from "@/lib/utils";
import { 
  collection, doc, setDoc, updateDoc, 
  deleteDoc, onSnapshot, query, where,
  getDocs, getDoc,
  serverTimestamp
} from "firebase/firestore";
import { Task, CanvasEdge } from "@/types/task";

/** Firestore rejects `undefined` field values — strip them before writing. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export const createCard = async (userId: string, canvasId: string, task: Task) => {
  const cardRef = doc(db, `users/${userId}/canvases/${canvasId}/cards`, task.id);
  await setDoc(cardRef, stripUndefined({
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
};

export const updateCard = async (userId: string, canvasId: string, taskId: string, updates: Partial<Task>) => {
  const cardRef = doc(db, `users/${userId}/canvases/${canvasId}/cards`, taskId);
  await updateDoc(cardRef, stripUndefined({
    ...updates,
    updatedAt: serverTimestamp(),
  }));
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

export const createEdge = async (userId: string, canvasId: string, edge: any) => {
  const edgeRef = doc(db, `users/${userId}/canvases/${canvasId}/edges`, edge.id);
  await setDoc(edgeRef, edge);
};

export const deleteEdge = async (userId: string, canvasId: string, edgeId: string) => {
  const edgeRef = doc(db, `users/${userId}/canvases/${canvasId}/edges`, edgeId);
  await deleteDoc(edgeRef);
};

export const subscribeToEdges = (userId: string, canvasId: string, callback: (edges: any[]) => void) => {
  const q = query(collection(db, `users/${userId}/canvases/${canvasId}/edges`));
  return onSnapshot(q, (snapshot) => {
    const edges = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(edges);
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

export const sendInviteCard = async (targetEmail: string, senderEmail: string, currentCanvasId: string) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", targetEmail));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No teammate found with that email address.");
  }

  const targetUserId = snap.docs[0].id;

  // Find their first canvas to drop the invite in
  const canvasesRef = collection(db, `users/${targetUserId}/canvases`);
  const canvasSnap = await getDocs(canvasesRef);
  let targetCanvasId = "default-canvas";
  if (!canvasSnap.empty) {
    targetCanvasId = canvasSnap.docs[0].id; // Give it to their first available workspace
  }

  const taskId = generateId();
  const link = window.location.origin; // Create absolute link based on env
  
  const task: Task = {
    id: taskId,
    type: "task",
    title: `💌 Canvas Invite from ${senderEmail}`,
    description: `You have been invited to collaborate!\n\nCanvas ID: ${currentCanvasId}\nLink: ${link}/?invite=${currentCanvasId}`,
    status: "todo",
    priority: "high",
    dueDate: null,
    pinned: true,
    docked: false,
    color: "#6366f1",
    position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
    createdAt: new Date().toISOString()
  };

  // Push directly to their board
  await createCard(targetUserId, targetCanvasId, task);
};
