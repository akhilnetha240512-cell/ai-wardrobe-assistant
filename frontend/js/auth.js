import { auth, db } from "./firebase-config.js";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();

export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create personal user record in Firestore if logging in for the first time
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "Fashion Enthusiast",
        email: user.email,
        photoURL: user.photoURL || "",
        preferredCollection: "women",
        createdAt: Date.now()
      });
    }
    return user;
  } catch (error) {
    alert("Google Sign-In note: " + error.message);
  }
}
window.handleGoogleSignIn = handleGoogleSignIn;

export async function handleSignOut() {
  await signOut(auth);
  window.location.reload();
}
window.handleSignOut = handleSignOut;
