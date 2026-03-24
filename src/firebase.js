import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "events-notion.firebaseapp.com",
  projectId: "events-notion",
  storageBucket: "events-notion.firebasestorage.app",
  messagingSenderId: "549617150699",
  appId: "1:549617150699:web:04a3064dee38c8f56f2cae",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);