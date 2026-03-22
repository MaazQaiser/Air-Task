"use client";
import { create } from "zustand";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthState {
  user: User | null;
  role: "admin" | "user" | null;
  loading: boolean;
  init: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  init: () => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        set({ user: currentUser, loading: true });

        // Ensure user document exists in Firestore and fetch role
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        let currentUserRole: "admin" | "user" = "user";
        
        if (!userSnap.exists()) {
          // If first user, make them admin? Hard to say, we default to user, or make it dynamic.
          // For now, if no users exist, we could check, but let's simply create them with defaults.
          const isFirstAdminOverride = currentUser.email === "admin@example.com"; // Adjust logic as needed
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
}));
