// config.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { isSupported, getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdlicO-1AveKnXr0b9_8F9QndW8KT7iA8",
  authDomain: "student-management-system-3.firebaseapp.com",
  projectId: "student-management-system-3",
  storageBucket: "student-management-system-3.appspot.com",
  messagingSenderId: "155211391796",
  appId: "1:155211391796:web:69823dd887ff5acd2d3b61",
  measurementId: "G-F3VHFZK8DE",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser, if supported)
import type { Analytics } from "firebase/analytics";
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize other Firebase services
export const auth = getAuth(app); // Authentication
export const firestore = getFirestore(app); // Firestore Database
export const realtimeDB = getDatabase(app); // Realtime Database
export const storage = getStorage(app); // Storage
export { analytics, app };
