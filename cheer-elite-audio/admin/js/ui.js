import { $, escHtml } from './utils.js';
import { state }      from './state.js';

/* ── Toast ─────────────────────────────────────────────── */
let toastTimer;
export function showToast(msg) {
  const toastEl = $('toast');
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* ── Confirm Modal ─────────────────────────────────────── */
export function openConfirmModal({ title, message, actionLabel = 'Confirm', danger = true, onConfirm }) {
  $('confirm-title').textContent = title;
  $('confirm-text').textContent  = message;
  const confirmDelete = $('confirm-delete');
  confirmDelete.textContent = actionLabel;
  confirmDelete.classList.toggle('btn-danger',  danger);
  confirmDelete.classList.toggle('btn-primary', !danger);
  state.pendingAction = onConfirm;
  $('confirm-modal').classList.add('open');
}

export function initConfirmModal() {
  $('confirm-cancel')?.addEventListener('click', () => $('confirm-modal').classList.remove('open'));
  $('confirm-delete')?.addEventListener('click', () => {
    $('confirm-modal').classList.remove('open');
    if (state.pendingAction) { state.pendingAction(); state.pendingAction = null; }
  });
}

/* ── Receipt Modal ─────────────────────────────────────── */
export function showReceipt(p) {
  const receiptModal = $('receipt-modal');
  const receiptBody  = $('receipt-body');
  if (!receiptModal || !receiptBody) return;

  const symbol    = p.currency === 'PHP' ? '₱' : '$';
  const receiptId = 'CEA-' + Date.now().toString().slice(-6);

  if (p.isTrack) {
    receiptBody.innerHTML = `
      <div class="receipt-row"><span class="receipt-label">Receipt #</span><span class="receipt-value">${receiptId}</span></div>
      <div class="receipt-row"><span class="receipt-label">Date</span><span class="receipt-value">${p.date || new Date().toLocaleDateString()}</span></div>
      <div class="receipt-row"><span class="receipt-label">Client</span><span class="receipt-value">${escHtml(p.clientName || '—')}</span></div>
      <div class="receipt-row"><span class="receipt-label">Track</span><span class="receipt-value">${escHtml(p.trackName || '—')}</span></div>
      <div class="receipt-row"><span class="receipt-label">Version</span><span class="receipt-value">${escHtml(p.version || 'v1')}</span></div>
      <div class="receipt-row"><span class="receipt-label">Type</span><span class="receipt-value">Track Delivery</span></div>
      <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color:var(--teal-dim);font-weight:700;">✓ Delivered</span></div>
    `;
    const totalEl = receiptModal.querySelector('.receipt-total');
    if (totalEl) totalEl.style.display = 'none';
  } else {
    receiptBody.innerHTML = `
      <div class="receipt-row"><span class="receipt-label">Receipt #</span><span class="receipt-value">${receiptId}</span></div>
      <div class="receipt-row"><span class="receipt-label">Date</span><span class="receipt-value">${p.date || new Date().toLocaleDateString()}</span></div>
      <div class="receipt-row"><span class="receipt-label">Client</span><span class="receipt-value">${escHtml(p.clientName || '—')}</span></div>
      <div class="receipt-row"><span class="receipt-label">Service</span><span class="receipt-value">${escHtml(p.description || '—')}</span></div>
      <div class="receipt-row"><span class="receipt-label">Currency</span><span class="receipt-value">${p.currency || 'USD'}</span></div>
      <div class="receipt-row"><span class="receipt-label">Status</span><span class="receipt-value" style="color:${p.status === 'paid' ? '#10B981' : '#F59E0B'}">${p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</span></div>
    `;
    const totalEl = receiptModal.querySelector('.receipt-total');
    if (totalEl) {
      totalEl.style.display = '';
      totalEl.innerHTML = `<span>Total</span><span>${symbol}${parseFloat(p.amount || 0).toFixed(2)}</span>`;
    }
  }

  receiptModal.classList.add('open');
}

export function initReceiptModal() {
  $('receipt-close')?.addEventListener('click', () => $('receipt-modal').classList.remove('open'));
  $('receipt-print')?.addEventListener('click', () => window.print());
}

/* ── Navigation ────────────────────────────────────────── */
export function switchPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-nav-item').forEach(b => b.classList.remove('active'));
  $(`page-${page}`)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  const labels = {
    chats:      'Clients & Chats',
    dashboard:  'Dashboard',
    deliveries: 'Deliveries',
    settings:   'Settings'
  };
  const pageHeader = $('page-header-title');
  if (pageHeader) pageHeader.textContent = labels[page] || page;

  const backToList = $('back-to-list');
  if (page !== 'chats' && state.activeChatId && window.innerWidth <= 768) {
    backToList.style.display = 'flex';
  }
}

export function initNavigation() {
  document.querySelectorAll('.sb-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage(btn.dataset.page);
      closeSidebar();
    });
  });
}

/* ── Sidebar ───────────────────────────────────────────── */
export function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebar-overlay').classList.remove('open');
}

export function initSidebar() {
  $('hamburger')?.addEventListener('click', () => {
    $('sidebar').classList.toggle('open');
    $('sidebar-overlay').classList.toggle('open');
  });
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);
}