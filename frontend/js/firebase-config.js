import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfMWN_oPLW0YBj9h9XZ0Jq79h_dL88WcY",
  authDomain: "ai-wardrobe-assistant-16bd6.firebaseapp.com",
  projectId: "ai-wardrobe-assistant-16bd6",
  storageBucket: "ai-wardrobe-assistant-16bd6.firebasestorage.app",
  messagingSenderId: "1002513422157",
  appId: "1:1002513422157:web:14e68d186e07ea75154904"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Update this if you deploy a Cloudflare Worker backend; local styling works automatically without it
export const BACKEND_URL = "https://wardrobe-ai-backend.workers.dev";
