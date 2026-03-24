import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
import { auth, provider } from "./firebase.js";
import { signInWithPopup, signOut } from "firebase/auth";
import { setupDashboard } from "./dashboard.js";
// 🔐 Your Firebase config (same as yours)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "events-notion.firebaseapp.com",
  projectId: "events-notion",
  storageBucket: "events-notion.firebasestorage.app",
  messagingSenderId: "549617150699",
  appId: "1:549617150699:web:04a3064dee38c8f56f2cae",
  measurementId: "G-FE5XGV72W4"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 Auth setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🎯 Button click
const loginBtn = document.getElementById("loginBtn");
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

loginBtn.addEventListener("click", async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  loginSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  setupDashboard(user);
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});