import { auth, db } from "./firebaseClient";
import {
  doc, setDoc, getDoc, collection, addDoc, getDocs,
  query, where, orderBy, updateDoc, deleteDoc
} from "firebase/firestore";

// ===== PROFILE =====
export async function saveProfile(profile) {
  const uid = auth.currentUser.uid;
  await setDoc(doc(db, "users", uid), { ...profile, updatedAt: Date.now() }, { merge: true });
}
export async function getProfile() {
  const uid = auth.currentUser.uid;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ===== CONSUMPTIONS =====
export async function addConsumption(item) {
  const uid = auth.currentUser.uid;
  const ref = await addDoc(collection(db, "users", uid, "consumptions"), {
    ...item, createdAt: Date.now(), updatedAt: Date.now()
  });
  return ref.id;
}
export async function listConsumptionsByDate(date) {
  const uid = auth.currentUser.uid;
  const q = query(
    collection(db, "users", uid, "consumptions"),
    where("date", "==", date),
    orderBy("time")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function updateConsumption(id, patch) {
  const uid = auth.currentUser.uid;
  await updateDoc(doc(db, "users", uid, "consumptions", id), { ...patch, updatedAt: Date.now() });
}
export async function deleteConsumption(id) {
  const uid = auth.currentUser.uid;
  await deleteDoc(doc(db, "users", uid, "consumptions", id));
}

// ===== Utility ringkasan di klien =====
export function summarize(items) {
  return items.reduce((acc, x) => ({
    kcal: acc.kcal + (x.kcal || 0),
    protein: acc.protein + (x.protein || 0),
    carbs: acc.carbs + (x.carbs || 0),
    fat: acc.fat + (x.fat || 0)
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
