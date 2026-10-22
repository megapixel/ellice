import { el } from '../router.js';
import { SERVICE_CATALOGUE, loans } from '../data.js';
import { money, escapeHtml } from '../format.js';

function loanStats(name) {
  const list = loans.filter(l => l.type === name);
  const disbursed = list.filter(l => l.disbursementDate).reduce((s, l) => s + l.amountApproved, 0);
  return { count: list.length, disbursed };
}

function itemHtml(item) {
  const stats = item.loan ? loanStats(item.name) : null;
  return `
    <div class="svc-item">
      <div class="svc-name">${escapeHtml(item.name)}
        ${stats ? `<span class="badge ${stats.count ? 'info' : 'neutral'}">${stats.count} ${stats.count === 1 ? 'facility' : 'facilities'}${stats.disbursed ? ' · ' + money(stats.disbursed) : ''}</span>` : ''}
      </div>
      ${item.note ? `<div class="muted" style="font-size:13px">${escapeHtml(item.note)}</div>` : ''}
      ${item.details ? `<ul class="svc-details">${item.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

export function services() {
  const loanProducts = SERVICE_CATALOGUE.flatMap(c => c.groups.flatMap(g => g.items)).filter(i => i.loan).length;
  return el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Services</h1>
          <div class="sub">${loanProducts} loan products plus corporate secretarial, accounting and related services</div>
        </div>
      </div>
      ${SERVICE_CATALOGUE.map(cat => `
        <div class="section-title">${escapeHtml(cat.title)}</div>
        <div class="grid c2">
          ${cat.groups.map(g => `
            <section class="card">
              <div class="card-head"><h2>${escapeHtml(g.title)}</h2></div>
              ${g.items.map(itemHtml).join('')}
            </section>`).join('')}
        </div>`).join('')}
      <p class="muted" style="font-size:12.5px;margin-top:16px">Loan products are the choices offered as "Loan type" on facilities; other services can be invoiced from the Invoices page.</p>
    </div>`);
}
