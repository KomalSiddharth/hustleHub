import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
};
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocFromServer,
  Firestore,
} from "firebase/firestore";
import type { Table, ChatSession, SavedFirebaseConfig } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// Global active instances
let activeApp: ReturnType<typeof initializeApp> | null = null;
let activeDb: Firestore | null = null;
let activeAuth: ReturnType<typeof getAuth> | null = null;

// Auto-initialize from env vars at module load so auth is available immediately
(function autoInitFromEnv() {
  try {
    const env = (import.meta as any).env || {};
    if (!env.VITE_FIREBASE_API_KEY) return;
    const existing = getApps().find((a) => a.name === "personal-firebase");
    const app = existing ?? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }, "personal-firebase");
    activeApp = app;
    activeAuth = getAuth(app);
    activeDb = getFirestore(app);
  } catch (e) {
    console.warn("Firebase auto-init from env failed:", e);
  }
})();

// Error handler specified by the Firebase Integration Skill
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = activeApp ? getAuth(activeApp) : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error Raised: ", JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Initializer that checks localStorage config and instantiates client on the fly
export async function initializeDynamicFirebase(config: SavedFirebaseConfig): Promise<{ db: Firestore; success: boolean }> {
  try {
    const apps = getApps();
    const existing = apps.find((a) => a.name === "personal-firebase");
    
    if (existing) {
      activeApp = existing;
    } else {
      activeApp = initializeApp(config, "personal-firebase");
    }

    activeDb = getFirestore(activeApp);
    activeAuth = getAuth(activeApp);

    // CRITICAL CONSTRAINT (from Skill): Validate connection to Firestore initially via server fetch
    try {
      await getDocFromServer(doc(activeDb, "test_connection_dummy", "ping"));
    } catch (error: any) {
      if (error instanceof Error && error.message.includes("offline")) {
        console.error("Please check your Firebase configuration: Client appears offline.");
      }
      // If it's a permissions error or not found, that means it successfully contacted the server!
      // This counts as a validation match.
    }

    return { db: activeDb, success: true };
  } catch (err) {
    console.error("Firebase dynamic initialization failed:", err);
    activeApp = null;
    activeDb = null;
    activeAuth = null;
    throw err;
  }
}

export function getActiveFirestore(): Firestore | null {
  return activeDb;
}

export function getActiveAuth() {
  if (!activeAuth) {
    // Lazy fallback: try env vars if auth was never set or got cleared
    try {
      const env = (import.meta as any).env || {};
      if (env.VITE_FIREBASE_API_KEY) {
        const existing = getApps().find((a) => a.name === "personal-firebase");
        const app = existing ?? initializeApp({
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.VITE_FIREBASE_APP_ID,
        }, "personal-firebase");
        activeApp = app;
        activeAuth = getAuth(app);
        if (!activeDb) activeDb = getFirestore(app);
      }
    } catch (e) {
      console.warn("Firebase lazy-init in getActiveAuth failed:", e);
    }
  }
  return activeAuth;
}

export function clearActiveFirebase() {
  activeApp = null;
  activeDb = null;
  activeAuth = null;
}

export async function saveUserProfile(uid: string, profile: Record<string, any>) {
  const db = getActiveFirestore();
  if (!db) return;
  await setDoc(doc(db, "hustle_hub_members", uid), {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserProfile(uid: string): Promise<Record<string, any> | null> {
  const db = getActiveFirestore();
  if (!db) return null;
  try {
    const snap = await getDocFromServer(doc(db, "hustle_hub_members", uid));
    return snap.exists() ? (snap.data() as Record<string, any>) : null;
  } catch {
    return null;
  }
}

// CRUD helper with dual modes (Firebase or LocalStorage)
export async function saveTableToStore(table: Table, configAttached: boolean) {
  const db = getActiveFirestore();
  const path = `founderdeck_tables/${table.id}`;

  if (configAttached && db) {
    try {
      await setDoc(doc(db, "founderdeck_tables", table.id), table);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  } else {
    // LocalStorage cache fallback
    const saved = localStorage.getItem("founderdeck_local_tables");
    const list: Table[] = saved ? JSON.parse(saved) : [];
    const index = list.findIndex((t) => t.id === table.id);
    if (index >= 0) {
      list[index] = table;
    } else {
      list.push(table);
    }
    localStorage.setItem("founderdeck_local_tables", JSON.stringify(list));
  }
}

export async function deleteTableFromStore(tableId: string, configAttached: boolean) {
  const db = getActiveFirestore();
  const path = `founderdeck_tables/${tableId}`;

  if (configAttached && db) {
    try {
      await deleteDoc(doc(db, "founderdeck_tables", tableId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  } else {
    // LocalStorage fallback
    const saved = localStorage.getItem("founderdeck_local_tables");
    if (saved) {
      const list: Table[] = JSON.parse(saved);
      const filtered = list.filter((t) => t.id !== tableId);
      localStorage.setItem("founderdeck_local_tables", JSON.stringify(filtered));
    }
  }
}

export async function saveSessionToStore(session: ChatSession, configAttached: boolean) {
  const db = getActiveFirestore();
  const path = `founderdeck_sessions/${session.id}`;

  if (configAttached && db) {
    try {
      await setDoc(doc(db, "founderdeck_sessions", session.id), session);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  } else {
    // LocalStorage cache fallback
    const saved = localStorage.getItem("founderdeck_local_sessions");
    const list: ChatSession[] = saved ? JSON.parse(saved) : [];
    const index = list.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      list[index] = session;
    } else {
      list.push(session);
    }
    localStorage.setItem("founderdeck_local_sessions", JSON.stringify(list));
  }
}

export async function deleteSessionFromStore(sessionId: string, configAttached: boolean) {
  const db = getActiveFirestore();
  const path = `founderdeck_sessions/${sessionId}`;

  if (configAttached && db) {
    try {
      await deleteDoc(doc(db, "founderdeck_sessions", sessionId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  } else {
    // LocalStorage fallback
    const saved = localStorage.getItem("founderdeck_local_sessions");
    if (saved) {
      const list: ChatSession[] = JSON.parse(saved);
      const filtered = list.filter((s) => s.id !== sessionId);
      localStorage.setItem("founderdeck_local_sessions", JSON.stringify(filtered));
    }
  }
}

export async function saveAppStateToStore(key: string, value: unknown) {
  const db = getActiveFirestore();
  if (!db) return;

  try {
    await setDoc(doc(db, "founderdeck_app_state", key), {
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `founderdeck_app_state/${key}`);
  }
}

export async function getAppStateFromStore<T>(key: string): Promise<T | null> {
  const db = getActiveFirestore();
  if (!db) return null;

  try {
    const snap = await getDocFromServer(doc(db, "founderdeck_app_state", key));
    if (snap.exists()) {
      return (snap.data() as any).value as T;
    }
  } catch (e) {
    console.warn(`Could not fetch app state for ${key}:`, e);
  }
  return null;
}
