import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: window.__ENV__?.FIREBASE_API_KEY || '',
  authDomain:        "cheer-elite-audio-chat-system.firebaseapp.com",
  projectId:         "cheer-elite-audio-chat-system",
  storageBucket:     "cheer-elite-audio-chat-system.firebasestorage.app",
  messagingSenderId: "445444846916",
  appId:             "1:445444846916:web:a9c0a6c9969ddd70489311"
};

export const app     = initializeApp(firebaseConfig, 'admin-app');
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);