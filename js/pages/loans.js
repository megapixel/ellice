import { el, navigate } from '../router.js';
import { loans, getCompany, LOAN_STATUSES, LOAN_TYPES } from '../data.js';
import { date, money, badge, escapeHtml } from '../format.js';
import { openLoanForm } from '../forms.js';

export function loansPage() {
  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Loan Management</h1>
          <div class="sub">${loans.length} facilities across all clients</div>
        </div>
        <div class="spacer"></div>
        <button class="primary" id="add">+ Add Loan</button>
      </div>

      <div class="toolbar">
        <input type="text" id="q" placeholder="Search client or lender...">
        <select id="status">
          <option value="">All statuses</option>
          ${LOAN_STATUSES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <select id="type">
          <option value="">All types</option>
          ${LOAN_TYPES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <span class="result-count" id="count"></span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th><th>Lender</th><th>Type</th>
              <th class="num">Amount</th><th class="num">Outstanding</th>
              <th>Maturity</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>`);

  const q = root.querySelector('#q');
  const status = root.querySelector('#status');
  const type = root.querySelector('#type');
  const tbody = root.querySelector('#rows');
  const count = root.querySelector('#count');

  function render() {
    const term = q.value.trim().toLowerCase();
    const st = status.value;
    const ty = type.value;

    const list = loans.filter(l => {
      const company = getCompany(l.companyId);
      const matchesTerm = !term
        || company.name.toLowerCase().includes(term)
        || l.lender.toLowerCase().includes(term);
      return matchesTerm && (!st || l.status === st) && (!ty || l.type === ty);
    });

    count.textContent = `${list.length} of ${loans.length}`;
    tbody.innerHTML = list.length ? list.map(l => {
      const company = getCompany(l.companyId);
      return `
        <tr class="clickable" data-id="${l.id}">
          <td class="strong">${escapeHtml(company.name)}</td>
          <td>${escapeHtml(l.lender)}</td>
          <td>${escapeHtml(l.type)}</td>
          <td class="num">${money(l.amountApproved)}</td>
          <td class="num">${money(l.outstanding)}</td>
          <td>${date(l.maturityDate)}</td>
          <td>${badge(l.status)}</td>
          <td class="num"><button class="small" data-edit="${l.id}">Edit</button></td>
        </tr>`;
    }).join('')
      : '<tr><td colspan="8"><div class="empty">No loans match those filters.</div></td></tr>';
  }

  q.addEventListener('input', render);
  status.addEventListener('change', render);
  type.addEventListener('change', render);
  root.querySelector('#add').addEventListener('click', () => openLoanForm());
  tbody.addEventListener('click', e => {
    const editBtn = e.target.closest('button[data-edit]');
    if (editBtn) {
      openLoanForm(loans.find(l => l.id === editBtn.dataset.edit));
      return;
    }
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/loans/${tr.dataset.id}`);
  });

  render();
  return root;
}
