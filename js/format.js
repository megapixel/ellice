// Small formatting helpers shared across pages.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function money(n) {
  if (n === null || n === undefined) return '—';
  return 'S$' + n.toLocaleString('en-SG');
}

export function moneyShort(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return 'S$' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2) + 'M';
  if (n >= 1000) return 'S$' + Math.round(n / 1000) + 'k';
  return 'S$' + n;
}

export function date(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateNoYear(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function inDays(n) {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n < 0) return `${Math.abs(n)} days ago`;
  return `in ${n} days`;
}

export function pct(part, whole) {
  if (!whole) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function statusClass(status) {
  switch (status) {
    case 'Active': return 'ok';
    case 'Approved': return 'info';
    case 'Pending': return 'warn';
    case 'Rejected': return 'bad';
    case 'Matured': return 'neutral';
    case 'Prospect': return 'info';
    case 'Dormant': return 'neutral';
    default: return 'neutral';
  }
}

export function badge(status) {
  return `<span class="badge ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

/** Colour a maturity countdown: urgent inside 30 days, warning inside 60. */
export function maturityBadge(days) {
  const cls = days <= 30 ? 'bad' : days <= 60 ? 'warn' : 'neutral';
  return `<span class="badge ${cls}">${inDays(days)}</span>`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/** First name, used in the mock message drafts. */
export function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'there';
}
