import { auth }              from './firebase.js';
import { state }             from './state.js';
import { $, escHtml }        from './utils.js';
import {
  showToast, openConfirmModal,
  initConfirmModal, initReceiptModal,
  initNavigation, initSidebar, switchPage
} from './ui.js';
import {
  startListeningToChats, initSearch,
  openChat, closeChat, deleteActiveChat,
  initReplyBar, initNotes, initUpload
} from './chat.js';
import { initNewOrderBtn }   from './orders.js';
import { startListeningToActiveClientsCount } from './orders.js';
import { startListeningToUsers } from './users.js';
import { loadPayments, initPaymentForm, initChartTabs } from './payments.js';
import { loadDeliveries }    from './deliveries.js';
import {
  getAuth, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { loadAdminProfile, initProfileEditor } from './admins.js';

/* ── Auth ──────────────────────────────────────────────── */
onAuthStateChanged(auth, user => {
  if (user) {
    $('app').classList.add('visible');
    loadAdminProfile(user);
    initProfileEditor(user);

    startListeningToChats();
    startListeningToActiveClientsCount();
    startListeningToUsers();
    loadPayments();
    loadDeliveries();
  } else {
    window.location.href = 'login.html';
    if (state.unsubChats)    { state.unsubChats();    state.unsubChats    = null; }
    if (state.unsubMessages) { state.unsubMessages(); state.unsubMessages = null; }
  }
});

/* ── Sign out ──────────────────────────────────────────── */
const signOutAction = () => openConfirmModal({
  title: 'Sign out?',
  message: "You'll need to sign in again to access the admin panel.",
  actionLabel: 'Sign out',
  danger: false,
  onConfirm: () => signOut(auth)
});
$('sb-logout')?.addEventListener('click', signOutAction);
$('settings-logout')?.addEventListener('click', signOutAction);

/* ── Delete chat button ────────────────────────────────── */
$('delete-chat-btn')?.addEventListener('click', () => {
  if (!state.activeChatId) return;
  openConfirmModal({
    title: 'Delete conversation?',
    message: 'This will permanently remove all messages in this chat. This cannot be undone.',
    actionLabel: 'Delete',
    danger: true,
    onConfirm: deleteActiveChat
  });
});

/* ── Back to list ──────────────────────────────────────── */
$('back-to-list')?.addEventListener('click', () => {
  if (state.currentPage !== 'chats') { switchPage('chats'); return; }
  closeChat();
});

/* ── Settings page — populate user info ────────────────── */
/* ── Init all modules ──────────────────────────────────── */
initNavigation();
initSidebar();
initConfirmModal();
initReceiptModal();
initSearch();
initReplyBar();
initNotes();
initUpload();
initNewOrderBtn();
initPaymentForm();
initChartTabs();
switchPage('chats');
/* ── Resizable order panel ─────────────────────────────── */
(function initOrderResize() {
  const handle = document.getElementById('order-resize-handle');
  const panel  = document.getElementById('order-panel');
  if (!handle || !panel) return;

  const MIN_W = 260;
  const MAX_W = 560;

  // Restore saved width
  const saved = localStorage.getItem('orderPanelWidth');
  if (saved) panel.style.width = saved + 'px';

  let startX, startW;

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX;
    startW = panel.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = e => {
      const delta = e.clientX - startX;
      const newW  = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
      panel.style.width = newW + 'px';
    };

    const onUp = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('orderPanelWidth', panel.offsetWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Touch support
  handle.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startW = panel.offsetWidth;
    handle.classList.add('dragging');

    const onMove = e => {
      const delta = e.touches[0].clientX - startX;
      const newW  = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
      panel.style.width = newW + 'px';
    };

    const onEnd = () => {
      handle.classList.remove('dragging');
      localStorage.setItem('orderPanelWidth', panel.offsetWidth);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
  }, { passive: true });
})();