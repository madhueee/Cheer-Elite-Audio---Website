import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey:            window.__ENV__?.FIREBASE_API_KEY || '',
  authDomain:        window.__ENV__?.FIREBASE_AUTH_DOMAIN || '',
  projectId:         window.__ENV__?.FIREBASE_PROJECT_ID || '',
  storageBucket:     window.__ENV__?.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: window.__ENV__?.FIREBASE_MESSAGING_SENDER || '',
  appId:             window.__ENV__?.FIREBASE_APP_ID || '',
};

export const app     = initializeApp(firebaseConfig, 'admin-app');
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);