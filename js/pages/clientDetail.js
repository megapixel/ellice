import { el, navigate } from '../router.js';
import { getCompany, loansForCompany, daysUntilAnniversary, nextOccurrence } from '../data.js';
import { date, money, badge, escapeHtml, inDays, dateNoYear } from '../format.js';
import { openMessageModal } from '../modal.js';
import { openClientForm, openLoanForm } from '../forms.js';

export function clientDetail({ id }) {
  const company = getCompany(id);
  if (!company) {
    return el('<div><a class="back" href="#/clients">← Clients</a><div class="empty">Client not found.</div></div>');
  }

  const clientLoans = loansForCompany(company.id);

  const root = el(`
    <div>
      <a class="back" href="#/clients">← Clients</a>
      <div class="page-head">
        <div>
          <h1>${escapeHtml(company.name)}</h1>
          <div class="sub">UEN ${escapeHtml(company.uen)} · ${escapeHtml(company.industry)}</div>
        </div>
        <div class="spacer"></div>
        <div style="display:flex;gap:10px;align-items:center">
          ${badge(company.status)}
          <button id="edit">Edit Client</button>
          <button class="primary" id="gen">Generate Message</button>
        </div>
      </div>

      <section class="card">
        <div class="detail-grid">
          <div class="field"><div class="k">Incorporated</div><div class="v">${date(company.incorporationDate)}</div></div>
          <div class="field"><div class="k">Primary contact</div><div class="v">${escapeHtml(company.contactName)} <span class="muted">· ${escapeHtml(company.contactRole)}</span></div></div>
          <div class="field"><div class="k">Phone</div><div class="v">${escapeHtml(company.contactPhone)}</div></div>
          <div class="field"><div class="k">Email</div><div class="v">${escapeHtml(company.contactEmail)}</div></div>
          <div class="field"><div class="k">Active facilities</div><div class="v">${clientLoans.filter(l => l.status === 'Active' || l.status === 'Approved').length}</div></div>
          <div class="field"><div class="k">Total outstanding</div><div class="v">${money(clientLoans.reduce((s, l) => s + l.outstanding, 0))}</div></div>
        </div>
        <div class="section-title">Notes</div>
        <div class="notes">${escapeHtml(company.notes)}</div>
      </section>

      <div class="section-title">Directors</div>
      <div class="people">
        ${company.directors.map(d => `
          <div class="person">
            <div class="pn">${escapeHtml(d.name)}</div>
            <div class="pr">${escapeHtml(d.role)}</div>
            <div class="pl">🎂 ${dateNoYear(d.birthday)} <span class="muted">(${inDays(daysUntilAnniversary(d.birthday))})</span></div>
            <div class="pl">${escapeHtml(d.phone)}</div>
            <div class="pl">${escapeHtml(d.email)}</div>
          </div>`).join('')}
      </div>

      <div class="section-title" style="display:flex;align-items:center;gap:10px">
        Loans (${clientLoans.length})
        <button class="small" id="add-loan" style="margin-left:auto">+ Add Loan</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Lender</th><th>Type</th>
              <th class="num">Approved</th><th class="num">Outstanding</th>
              <th>Maturity</th><th>Status</th>
            </tr>
          </thead>
          <tbody id="rows">
            ${clientLoans.length ? clientLoans.map(l => `
              <tr class="clickable" data-id="${l.id}">
                <td class="strong">${escapeHtml(l.lender)}</td>
                <td>${escapeHtml(l.type)}</td>
                <td class="num">${money(l.amountApproved)}</td>
                <td class="num">${money(l.outstanding)}</td>
                <td>${date(l.maturityDate)}</td>
                <td>${badge(l.status)}</td>
              </tr>`).join('')
              : '<tr><td colspan="6"><div class="empty">No loans recorded for this client.</div></td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section-title">Upcoming anniversary</div>
      <div class="card">
        🏢 ${date(nextOccurrence(company.incorporationDate))} —
        <span class="muted">${inDays(daysUntilAnniversary(company.incorporationDate))}</span>
      </div>
    </div>`);

  root.querySelector('#gen').addEventListener('click', () => {
    openMessageModal({ kind: 'client', company });
  });

  root.querySelector('#edit').addEventListener('click', () => openClientForm(company));
  root.querySelector('#add-loan').addEventListener('click', () => openLoanForm(null, { companyId: company.id }));

  root.querySelector('#rows').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/loans/${tr.dataset.id}`);
  });

  return root;
}
