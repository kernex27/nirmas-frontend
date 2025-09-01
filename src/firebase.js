// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// (opsional) Analytics, hanya jika kamu benar-benar butuh
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbdnn83plGBt2J7PIQAXj1AoBNjg-cNcY",
  authDomain: "react-nutrition-web.firebaseapp.com",
  projectId: "react-nutrition-web",
  storageBucket: "react-nutrition-web.firebasestorage.app",
  messagingSenderId: "446986898741",
  appId: "1:446986898741:web:6bde19b51b602bb6ec907c",
  measurementId: "G-JPQDYD63TJ"
};

// Hindari inisialisasi dobel saat HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// === Inilah yang “harus diexport” ===
export const auth = getAuth(app);
export const db = getFirestore(app);

// (opsional) Analytics – aman untuk diabaikan jika tidak perlu
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app);
  });
}