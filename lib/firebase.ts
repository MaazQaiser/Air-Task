import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have at least an API key to avoid crash on build
const isConfigValid = !!firebaseConfig.apiKey;

// Initialize Firebase only once
let app: FirebaseApp;
if (isConfigValid) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
    // During build or if keys are missing, we use a minimal dummy app config
    // We only provide enough to avoid errors during "import" evaluation
    app = !getApps().length 
        ? initializeApp({ apiKey: "AIza-DUMMY-API-KEY-FOR-BUILD", projectId: "airtasks-build-dummy" }) 
        : getApp();
}

// Export services safely. If config is invalid and we're on the server, 
// we return dummy objects to prevent the build from crashing during prerendering.
export const auth: Auth = (isConfigValid || typeof window !== "undefined") 
    ? getAuth(app) 
    : ({}) as Auth;

export const storage: FirebaseStorage = (isConfigValid || typeof window !== "undefined") 
    ? getStorage(app) 
    : ({}) as FirebaseStorage;

// Use persistent local cache only on client side
export const db: Firestore = (typeof window !== "undefined" && isConfigValid)
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
        }),
    })
    : getFirestore(app);
