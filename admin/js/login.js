import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDwDS1RecOobP17YmUmQt5xcK_lofiyhSE",
  authDomain:        "cheer-elite-audio-chat-system.firebaseapp.com",
  projectId:         "cheer-elite-audio-chat-system",
  storageBucket:     "cheer-elite-audio-chat-system.firebasestorage.app",
  messagingSenderId: "445444846916",
  appId:             "1:445444846916:web:a9c0a6c9969ddd70489311"
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

async function doLogin() {
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
    loginError.style.display = 'block';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Sign In';
    loginError.textContent = 'Wrong email or password. Try again.';
  }
}

