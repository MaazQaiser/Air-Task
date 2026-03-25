import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have the config (prevents build crashes on Vercel)
const isConfigValid = !!firebaseConfig.apiKey;

// Initialize Firebase only once
let app;
if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
    // During build or if keys are missing, we use a fallback to avoid crashing
    // But this won't work for actual auth/db operations on the server if they were triggered
    app = !getApps().length ? initializeApp({ apiKey: "DUMMY", projectId: "DUMMY" }) : getApp();
}

export const auth = getAuth(app);
export const storage = getStorage(app);

// Use persistent local cache only on client side to avoid server-side crashes during build
export const db = (typeof window !== "undefined")
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
        }),
    })
    : getFirestore(app);
