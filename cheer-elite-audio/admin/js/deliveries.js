import { db }                from './firebase.js';
import { $, escHtml, formatFull } from './utils.js';
import {
  collection, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadDeliveries() {
  const listEl = $('deliveries-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  try {
    const q    = query(collection(db, 'deliveries'), orderBy('deliveredAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="es-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M8 12l16-8 16 8v24l-16 8L8 36V12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M24 4v40M8 12l16 8 16-8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <p>No tracks delivered yet.</p>
        </div>`;
      return;
    }
    snap.forEach(d => {
      const data = d.data();
      const row  = document.createElement('div');
      row.className = 'delivery-row';
      const date = data.deliveredAt ? formatFull(data.deliveredAt.toDate()) : '—';
      row.innerHTML = `
        <div class="delivery-icon">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="delivery-info">
          <div class="delivery-name">${escHtml(data.trackName || 'Track')}</div>
          <div class="delivery-meta">To: ${escHtml(data.clientName || '—')} · ${escHtml(data.fileName || '')}</div>
        </div>
        <span class="delivery-version">${escHtml(data.version || 'v1')}</span>
        <span class="delivery-date">${date}</span>
        <a href="${escHtml(data.fileUrl)}" download="${escHtml(data.fileName || 'track')}" class="btn btn-ghost" style="padding:5px 12px;font-size:12px;">
          <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px;">
            <path d="M8 2v9M5 8l3 3 3-3M2 13h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Download
        </a>
      `;
      listEl.appendChild(row);
    });
  } catch (err) {
    console.error('Deliveries load error:', err);
  }
}