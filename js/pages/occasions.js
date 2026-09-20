import { el } from '../router.js';
import { upcomingOccasions, getCompany } from '../data.js';
import { date, inDays, escapeHtml } from '../format.js';
import { openMessageModal } from '../modal.js';

const GROUPS = [
  { label: 'This week', max: 7 },
  { label: 'Next 30 days', max: 30 },
  { label: 'Next 90 days', max: 90 }
];

export function occasions() {
  const all = upcomingOccasions(90);

  let cursor = 0;
  const sections = GROUPS.map(g => {
    const items = all.filter(o => o.inDays >= cursor && o.inDays <= g.max);
    cursor = g.max + 1;
    return { label: g.label, items };
  });

  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Special Occasions</h1>
          <div class="sub">${all.length} director birthdays and incorporation anniversaries in the next 90 days</div>
        </div>
      </div>

      ${sections.map(s => `
        <div class="occ-group">
          <div class="section-title">${s.label} <span class="muted">· ${s.items.length}</span></div>
          <div class="table-wrap">
            ${s.items.length ? s.items.map(o => `
              <div class="occ">
                <span class="oi">${o.icon}</span>
                <span class="om">
                  <span class="ot">${escapeHtml(o.title)}</span><br>
                  <span class="os">${escapeHtml(o.subtitle)} · <a href="#/clients/${o.companyId}">View client</a></span>
                </span>
                <span class="od">${date(o.date)}<br>${inDays(o.inDays)}</span>
                <button class="small" data-occ="${o.kind}:${o.companyId}:${encodeURIComponent(o.title)}">Generate Wish</button>
              </div>`).join('')
              : '<div class="empty" style="padding:14px">Nothing in this window.</div>'}
          </div>
        </div>`).join('')}
    </div>`);

  root.addEventListener('click', e => {
    const btn = e.target.closest('button[data-occ]');
    if (!btn) return;
    const [kind, companyId, rawTitle] = btn.dataset.occ.split(':');
    const title = decodeURIComponent(rawTitle);
    const occasion = all.find(o => o.kind === kind && o.companyId === companyId && o.title === title);
    const company = getCompany(companyId);
    if (occasion && company) openMessageModal({ kind: 'occasion', company, occasion });
  });

  return root;
}
