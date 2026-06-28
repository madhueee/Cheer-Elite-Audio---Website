import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey:            window.__ENV__?.FIREBASE_API_KEY || '',
  authDomain:        window.__ENV__?.FIREBASE_AUTH_DOMAIN || '',
  projectId:         window.__ENV__?.FIREBASE_PROJECT_ID || '',
  storageBucket:     window.__ENV__?.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: window.__ENV__?.FIREBASE_MESSAGING_SENDER || '',
  appId:             window.__ENV__?.FIREBASE_APP_ID || '',
};

const app  = initializeApp(firebaseConfig, 'admin-app');
const auth = getAuth(app);

const $ = id => document.getElementById(id);

const adminEmailInp  = $('admin-email');
const adminPassInp   = $('admin-password');
const loginBtn       = $('login-btn');
const loginError     = $('login-error');

onAuthStateChanged(auth, user => {
  if (user) {
    window.location.href = 'index.html';
  }
});

loginBtn.addEventListener('click', doLogin);
adminPassInp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

async function doLogin() {
  if (loginAttempts >= MAX_ATTEMPTS) {
    loginError.textContent = 'Too many attempts. Please wait before trying again.';
    loginError.style.display = 'block';
    return;
  }
  const email = adminEmailInp.value.trim();
  const pass  = adminPassInp.value;

  loginError.style.display = 'none';

  if (!email && !pass) {
    loginError.textContent = 'Please enter your email and password.';
    loginError.style.display = 'block';
    return;
  }
  if (!email) {
    loginError.textContent = 'Please enter your email.';
    loginError.style.display = 'block';
    return;
  }
  if (!pass) {
    loginError.textContent = 'Please enter your password.';
    loginError.style.display = 'block';
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Signing in';
  loginError.style.display = 'none';

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch {
    loginAttempts++; 
    loginError.style.display = 'block';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Sign In';
    loginError.textContent = loginAttempts >= MAX_ATTEMPTS
    ? 'Too many failed attempts. Please wait.'
    : 'Wrong email or password. Try again.';
  }
}

