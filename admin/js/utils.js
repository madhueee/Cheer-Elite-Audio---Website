export const $ = id => document.getElementById(id);

export function getInitials(name) {
  return (name || '?').trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatTime(date) {
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatFull(date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtDuration(s) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export function statusClass(st) {
  return ['in-progress', 'delivered', 'revision'].includes(st) ? st : 'none';
}