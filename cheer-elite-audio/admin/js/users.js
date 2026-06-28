import { db }                       from './firebase.js';
import { $, escHtml, getInitials, formatFull } from './utils.js';
import {
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let unsubUsers = null;

/* ── Live "all users" listener ─────────────────────────────
   Populated by recordUserLogin() in the client widget's chat.js —
   every Google sign-in writes/updates a doc here, whether or not
   that person ever sends a message. ── */
export function startListeningToUsers() {
  if (unsubUsers) unsubUsers();

  const tryOrderedQuery = () => {
    const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    unsubUsers = onSnapshot(usersQ, snap => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderUsers(users);
    }, err => {
      console.error('Users listener failed:', err);
      if (err.code === 'failed-precondition') {
        // Index not ready — fall back to unordered collection snapshot
        console.warn('Falling back to unordered users query');
        unsubUsers = onSnapshot(collection(db, 'users'), snap2 => {
          const users = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
          renderUsers(users);
        }, err2 => console.error('Users fallback listener failed:', err2));
      }
    });
  };
  tryOrderedQuery();
}

function renderUsers(users) {
  const listEl  = $('users-list');
  const countEl = $('users-count');
  if (!listEl) return;

  if (countEl) countEl.textContent = users.length;
  listEl.innerHTML = '';

  if (users.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">
          <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="17" r="7" stroke="currentColor" stroke-width="2"/><path d="M10 40c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <p>No users yet.<br/>They'll appear here as soon as someone signs in with Google.</p>
      </div>`;
    return;
  }

  users.forEach(u => {
    const item = document.createElement('div');
    item.className = 'client-item static';

    const initials  = getInitials(u.name || '?');
    const avatarHTML = u.photo
      ? `<img src="${escHtml(u.photo)}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
      : `<div class="ci-av">${initials}</div>`;

    const joined = u.createdAt  ? formatFull(u.createdAt.toDate())  : '—';
    const lastIn = u.lastLogin  ? formatFull(u.lastLogin.toDate())  : '—';

    item.innerHTML = `
      ${avatarHTML}
      <div class="ci-meta">
        <div class="ci-name">${escHtml(u.name || 'Unknown')}</div>
        <div class="ci-preview">${escHtml(u.email || '—')}</div>
      </div>
      <div class="ci-right">
        <span class="ci-time">Joined ${joined}</span>
        <span class="ci-time" style="opacity:.7;">Last in ${lastIn}</span>
      </div>
    `;
    listEl.appendChild(item);
  });
}