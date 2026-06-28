import { db }           from './firebase.js';
import { $, escHtml }   from './utils.js';
import { showReceipt }  from './ui.js';
import {
  collection, doc, query, orderBy, getDocs, addDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from './ui.js';

let chartInstance = null;
let chartPeriod   = 'monthly';
/* ── Unpaid orders dropdown ─────────────────────────────── */
let unpaidOrdersCache = [];

export async function loadUnpaidOrders() {
  const selectEl = $('pay-order-select');
  if (!selectEl) return;

  try {
    const snap = await getDocs(collection(db, 'orders'));
    unpaidOrdersCache = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(o => o.price != null && !o.paid && o.status !== 'declined');

    const currentVal = selectEl.value;
    selectEl.innerHTML = '<option value="">Select a pending order</option>';
    unpaidOrdersCache.forEach(o => {
      const symbol = o.type === 'PH' ? '₱' : '$';
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = `${o.clientName || 'Unknown'} — Mix ${o.orderNumber} (${symbol}${o.price})`;
      selectEl.appendChild(opt);
    });
    selectEl.value = currentVal && unpaidOrdersCache.some(o => o.id === currentVal) ? currentVal : '';
  } catch (err) {
    console.error('Unpaid orders load error:', err);
  }
}

/* ── Load & render ─────────────────────────────────────── */
export async function loadPayments() {
  try {
    const q        = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const snap     = await getDocs(q);
    const payments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPayments(payments);
    renderStats(payments);
    loadUnpaidOrders(); 
  } catch (err) {
    console.error('Payments load error:', err);
  }
}



function renderStats(payments) {
  const now       = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const usdMonth = payments
    .filter(p => p.currency !== 'PHP' && p.status !== 'pending')
    .reduce((s, p) => {
      const d = p.date ? new Date(p.date) : null;
      return d && d.getFullYear() === thisYear && d.getMonth() === thisMonth
        ? s + parseFloat(p.amount || 0) : s;
    }, 0);

  const phpMonth = payments
    .filter(p => p.currency === 'PHP' && p.status !== 'pending')
    .reduce((s, p) => {
      const d = p.date ? new Date(p.date) : null;
      return d && d.getFullYear() === thisYear && d.getMonth() === thisMonth
        ? s + parseFloat(p.amount || 0) : s;
    }, 0);

  const yearTotal = payments
    .filter(p => p.status !== 'pending' && p.currency !== 'PHP')
    .reduce((s, p) => {
      const d = p.date ? new Date(p.date) : null;
      return d && d.getFullYear() === thisYear ? s + parseFloat(p.amount || 0) : s;
    }, 0);

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const fmtUSD = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtPHP = n => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statMonth = $('stat-month');
  const statYear  = $('stat-year');
  const statPend  = $('stat-pending');
  if (statMonth) statMonth.textContent = fmtUSD(usdMonth) + (phpMonth > 0 ? ' / ' + fmtPHP(phpMonth) : '');
  if (statYear)  statYear.textContent  = fmtUSD(yearTotal);
  if (statPend)  statPend.textContent  = pendingCount;

  renderProfitChart(payments);
}

function renderPayments(payments) {
  const tbody = $('pay-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--ct-muted);">No payments logged yet.</td></tr>`;
    return;
  }

  payments.forEach(p => {
    const tr         = document.createElement('tr');
    const statusPill = p.status === 'pending'
      ? `<span class="pill pill-amber">Pending</span>`
      : `<span class="pill pill-green">Paid</span>`;
    const amtClass = p.status === 'pending' ? 'pay-pending' : 'pay-amount';
    const symbol   = p.currency === 'PHP' ? '₱' : '$';

    tr.innerHTML = `
      <td>${escHtml(p.date || '—')}</td>
      <td>${escHtml(p.clientName || '—')}</td>
      <td>${escHtml(p.description || '—')}</td>
      <td class="${amtClass}">${symbol}${parseFloat(p.amount || 0).toFixed(2)}</td>
      <td>${escHtml(p.currency || 'USD')}</td>
      <td>${statusPill}</td>
      <td>
        <button class="btn btn-ghost receipt-row-btn" style="padding:4px 10px;font-size:11px;"
          data-payment='${JSON.stringify({ clientName: p.clientName, amount: p.amount, description: p.description, date: p.date, status: p.status, currency: p.currency || 'USD' })}'>
          Receipt
        </button>
      </td>
    `;
    tr.querySelector('.receipt-row-btn')?.addEventListener('click', e => {
      showReceipt(JSON.parse(e.currentTarget.dataset.payment));
    });
    tbody.appendChild(tr);
  });
}

/* ── Add payment ────────────────────────────────────────── */
/* ── Add payment ────────────────────────────────────────── */
export function initPaymentForm() {
  $('pay-order-select')?.addEventListener('change', e => {
    const order = unpaidOrdersCache.find(o => o.id === e.target.value);
    if (!order) return;
    $('pay-client').value   = order.clientName || '';
    $('pay-amount').value   = order.price ?? '';
    $('pay-desc').value     = `Mix ${order.orderNumber}${order.formData?.['Music Duration'] ? ' — ' + order.formData['Music Duration'] : ''}`;
    $('pay-currency').value = order.type === 'PH' ? 'PHP' : 'USD';
  });

  $('add-payment-btn')?.addEventListener('click', async () => {
    const orderSelectEl = $('pay-order-select');
    const linkedOrderId = orderSelectEl?.value || null;

    const clientName  = $('pay-client').value.trim();
    const amount      = $('pay-amount').value.trim();
    const description = $('pay-desc').value.trim();
    const date        = $('pay-date').value;
    const status      = $('pay-status').value;
    const currency    = $('pay-currency')?.value || 'USD';

    if (!clientName || !amount || !date) return showToast('Fill in client, amount and date');

    await addDoc(collection(db, 'payments'), {
      clientName, amount: parseFloat(amount), description, date, status, currency,
      orderId: linkedOrderId || null,
      createdAt: serverTimestamp()
    });

    if (linkedOrderId && status === 'paid') {
      await updateDoc(doc(db, 'orders', linkedOrderId), { paid: true, paidAt: serverTimestamp() });
    }

    showReceipt({ clientName, amount: parseFloat(amount), description, date, status, currency });

    $('pay-client').value = '';
    $('pay-amount').value = '';
    $('pay-desc').value   = '';
    $('pay-date').value   = '';
    $('pay-status').value = 'paid';
    if (orderSelectEl) orderSelectEl.value = '';

    showToast('Payment logged!');
    loadPayments();
  });
}

/* ── Chart tabs ─────────────────────────────────────────── */
export function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartPeriod = btn.dataset.period;
      loadPayments();
    });
  });
}

/* ── Profit chart ───────────────────────────────────────── */
function renderProfitChart(payments) {
  const canvas = $('profit-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const now      = new Date();
  const thisYear = now.getFullYear();
  let labels = [], usdData = [], phpData = [];

  if (chartPeriod === 'monthly') {
    labels  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    usdData = labels.map((_, i) =>
      payments.filter(p => p.status !== 'pending' && p.currency !== 'PHP' && p.date
        && new Date(p.date).getFullYear() === thisYear && new Date(p.date).getMonth() === i)
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0));
    phpData = labels.map((_, i) =>
      payments.filter(p => p.status !== 'pending' && p.currency === 'PHP' && p.date
        && new Date(p.date).getFullYear() === thisYear && new Date(p.date).getMonth() === i)
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0));
  } else {
    const years = [thisYear - 4, thisYear - 3, thisYear - 2, thisYear - 1, thisYear];
    labels  = years.map(String);
    usdData = years.map(y =>
      payments.filter(p => p.status !== 'pending' && p.currency !== 'PHP' && p.date
        && new Date(p.date).getFullYear() === y)
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0));
    phpData = years.map(y =>
      payments.filter(p => p.status !== 'pending' && p.currency === 'PHP' && p.date
        && new Date(p.date).getFullYear() === y)
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0));
  }

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'USD Revenue',
          data: usdData,
          backgroundColor: 'rgba(0,229,195,0.65)',
          borderColor: '#00E5C3',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'PHP Revenue',
          data: phpData,
          backgroundColor: 'rgba(59,130,246,0.65)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const sym = ctx.datasetIndex === 0 ? '$' : '₱';
              return ` ${sym}${ctx.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, family: 'Inter' }, color: '#6B7280' }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          border: { dash: [4, 4] },
          ticks: {
            font: { size: 11, family: 'Inter' },
            color: '#6B7280',
            callback: v => '$' + v.toFixed(0)
          }
        }
      }
    }
  });
}