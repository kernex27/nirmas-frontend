import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// GANTI DENGAN CONFIG DARI CONSOLE
const firebaseConfig = {
  apiKey: "PASTE_HERE",
  authDomain: "react-nutrition-web.firebaseapp.com",
  projectId: "react-nutrition-web",
  appId: "PASTE_HERE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
