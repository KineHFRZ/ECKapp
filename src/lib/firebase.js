import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasConfig = firebaseConfig.projectId;

let app = null;
let db_firestore = null;

if (hasConfig) {
  app = initializeApp(firebaseConfig);
  db_firestore = getFirestore(app);
}

async function firestoreHandler(entityName) {
  const col = collection(db_firestore, entityName);
  return {
    list: async (sortField, lim) => {
      const q = sortField
        ? query(col, orderBy(sortField.replace('-', ''), sortField.startsWith('-') ? 'desc' : 'asc'), ...(lim ? [limit(lim)] : []))
        : query(col, limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    get: async (id) => {
      const snap = await getDoc(doc(col, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    create: async (data) => {
      const now = new Date().toISOString();
      const ref = await addDoc(col, { ...data, created_date: now, updated_date: now });
      return { id: ref.id, ...data, created_date: now, updated_date: now };
    },
    update: async (id, data) => {
      const ref = doc(col, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const updated = { ...snap.data(), ...data, updated_date: new Date().toISOString() };
      await updateDoc(ref, { ...data, updated_date: updated.updated_date });
      return { id, ...updated };
    },
    delete: async (id) => { await deleteDoc(doc(col, id)); return { success: true }; },
  };
}

export { hasConfig, firestoreHandler };
