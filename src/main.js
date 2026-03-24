import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// 🔐 Your Firebase config (same as yours)
const firebaseConfig = {
  apiKey: "AIzaSyCMinx_tvlOYSCEnUvhvnW05xcDrPKzOfE",
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
document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log(result.user);
    alert("Login successful 😎");
  } catch (error) {
    console.error(error);
  }
});