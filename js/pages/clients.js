import { el, navigate } from '../router.js';
import { companies, activeLoanCount, CLIENT_STATUSES } from '../data.js';
import { date, badge, escapeHtml } from '../format.js';
import { openClientForm } from '../forms.js';

export function clients() {
  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Client Management</h1>
          <div class="sub">${companies.length} companies</div>
        </div>
        <div class="spacer"></div>
        <button class="primary" id="add">+ Add Client</button>
      </div>

      <div class="toolbar">
        <input type="text" id="q" placeholder="Search name, UEN or contact...">
        <select id="status">
          <option value="">All statuses</option>
          ${CLIENT_STATUSES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <span class="result-count" id="count"></span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>UEN</th>
              <th>Incorporated</th>
              <th>Primary contact</th>
              <th class="num">Active loans</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>`);

  const q = root.querySelector('#q');
  const status = root.querySelector('#status');
  const tbody = root.querySelector('#rows');
  const count = root.querySelector('#count');

  function render() {
    const term = q.value.trim().toLowerCase();
    const st = status.value;
    const list = companies.filter(c => {
      const matchesTerm = !term
        || c.name.toLowerCase().includes(term)
        || c.uen.toLowerCase().includes(term)
        || c.contactName.toLowerCase().includes(term);
      return matchesTerm && (!st || c.status === st);
    });

    count.textContent = `${list.length} of ${companies.length}`;
    tbody.innerHTML = list.length ? list.map(c => `
      <tr class="clickable" data-id="${c.id}">
        <td>
          <div class="strong">${escapeHtml(c.name)}</div>
          <div class="sub">${escapeHtml(c.industry)}</div>
        </td>
        <td>${escapeHtml(c.uen)}</td>
        <td>${date(c.incorporationDate)}</td>
        <td>
          <div>${escapeHtml(c.contactName)}</div>
          <div class="sub">${escapeHtml(c.contactRole)}</div>
        </td>
        <td class="num">${activeLoanCount(c.id)}</td>
        <td>${badge(c.status)}</td>
        <td class="num"><button class="small" data-edit="${c.id}">Edit</button></td>
      </tr>`).join('')
      : '<tr><td colspan="7"><div class="empty">No clients match those filters.</div></td></tr>';
  }

  q.addEventListener('input', render);
  status.addEventListener('change', render);
  root.querySelector('#add').addEventListener('click', () => openClientForm());
  tbody.addEventListener('click', e => {
    const editBtn = e.target.closest('button[data-edit]');
    if (editBtn) {
      openClientForm(companies.find(c => c.id === editBtn.dataset.edit));
      return;
    }
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/clients/${tr.dataset.id}`);
  });

  render();
  return root;
}
