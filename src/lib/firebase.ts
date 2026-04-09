import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgYMV12ytzdxbs4jB0GI5PVrivemGKE-s",
  authDomain: "painel-de-vendas-c032e.firebaseapp.com",
  projectId: "painel-de-vendas-c032e",
  storageBucket: "painel-de-vendas-c032e.firebasestorage.app",
  messagingSenderId: "1053506080807",
  appId: "1:1053506080807:web:74904805e1c7831ecb7e02",
  measurementId: "G-1XN6GMEF30"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
