"use client";
import { create } from "zustand";
import { User, onAuthStateChanged, signOut as firebaseSignOut, updateProfile as firebaseUpdateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface AuthState {
  user: User | null;
  role: "admin" | "user" | null;
  loading: boolean;
  init: () => void;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  init: () => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        set({ user: currentUser, loading: true });

        let currentUserRole: "admin" | "user" = "user";

        try {
          // Ensure user document exists in Firestore and fetch role
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const isFirstAdminOverride = currentUser.email === "admin@example.com";
            currentUserRole = isFirstAdminOverride ? "admin" : "user";

            await setDoc(userRef, {
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: currentUserRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            currentUserRole = userSnap.data().role || "user";
          }
        } catch (err) {
          // Firestore may be offline — continue with default role
          console.warn("Firestore role fetch failed (offline?), using default role:", err);
        }

        set({ role: currentUserRole, loading: false });
      } else {
        set({ user: null, role: null, loading: false });
      }
    });
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, role: null });
  },

  updateUserProfile: async (displayName: string, photoURL: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Update Firebase Auth profile
    await firebaseUpdateProfile(currentUser, { displayName, photoURL });
    
    // Update Firestore user document
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { 
        displayName, 
        photoURL, 
        updatedAt: new Date().toISOString() 
      });
    } catch (err) {
      console.warn("Failed to update firestore user data:", err);
    }
    
    // Force a new object reference so Zustand triggers a re-render
    set({ user: Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser) });
  },
}));
