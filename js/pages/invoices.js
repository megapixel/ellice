// Invoices — broker list + detail, and the printable invoice document shared with the
// client portal. Invoices are raised automatically when a disbursement is recorded
// (see autoInvoice in js/data.js) or created by hand for other services. Mock only:
// "Sent" means visible in the client's portal; nothing is emailed.

import { el, navigate, refresh } from '../router.js';
import {
  invoices, getInvoice, getCompany, getLoan, invoiceStatus, setInvoiceStatus, GST_RATE
} from '../data.js';
import { money, date, badge, escapeHtml } from '../format.js';
import { statTile } from '../charts.js';
import { toast } from '../modal.js';
import { openInvoiceForm } from '../forms.js';

const STATUSES = ['Draft', 'Sent', 'Overdue', 'Paid'];

const sum = list => list.reduce((s, i) => s + i.total, 0);

export function invoicesPage() {
  const unpaid = invoices.filter(i => ['Sent', 'Overdue'].includes(invoiceStatus(i)));
  const overdue = invoices.filter(i => invoiceStatus(i) === 'Overdue');
  const paid = invoices.filter(i => i.status === 'Paid');

  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Invoices</h1>
          <div class="sub">Arrangement-fee invoices are raised automatically when a disbursement is recorded</div>
        </div>
        <div class="spacer"></div>
        <button class="primary" id="add">+ New Invoice</button>
      </div>

      <div class="grid c3">
        ${statTile({ label: 'Awaiting payment', value: money(sum(unpaid)), sub: `${unpaid.length} invoices` })}
        ${statTile({ label: 'Overdue', value: money(sum(overdue)), sub: `${overdue.length} invoices` })}
        ${statTile({ label: 'Paid', value: money(sum(paid)), sub: `${paid.length} invoices` })}
      </div>

      <div class="toolbar" style="margin-top:16px">
        <input type="text" id="q" placeholder="Search invoice no. or client...">
        <select id="status">
          <option value="">All statuses</option>
          ${STATUSES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <span class="result-count" id="count"></span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Invoice</th><th>Client</th><th>For</th><th>Issued</th><th>Due</th><th class="num">Total</th><th>Status</th></tr>
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
    const list = invoices.filter(i => {
      const c = getCompany(i.companyId);
      return (!term || i.number.toLowerCase().includes(term) || c.name.toLowerCase().includes(term))
        && (!status.value || invoiceStatus(i) === status.value);
    }).sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));

    count.textContent = `${list.length} of ${invoices.length}`;
    tbody.innerHTML = list.length ? list.map(i => `
      <tr class="clickable" data-id="${i.id}">
        <td class="strong">${escapeHtml(i.number)}${i.auto ? ' <span class="badge neutral">auto</span>' : ''}</td>
        <td>${escapeHtml(getCompany(i.companyId).name)}</td>
        <td>${escapeHtml(i.service)}</td>
        <td>${date(i.issueDate)}</td>
        <td>${date(i.dueDate)}</td>
        <td class="num">${money(i.total)}</td>
        <td>${badge(invoiceStatus(i))}</td>
      </tr>`).join('')
      : '<tr><td colspan="7"><div class="empty">No invoices match those filters.</div></td></tr>';
  }

  q.addEventListener('input', render);
  status.addEventListener('change', render);
  tbody.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/invoices/${tr.dataset.id}`);
  });
  root.querySelector('#add').addEventListener('click', () => openInvoiceForm());

  render();
  return root;
}

/** The invoice itself — used by the broker detail page and the client portal. */
export function invoiceDocument(inv) {
  const company = getCompany(inv.companyId);
  const loan = inv.loanId ? getLoan(inv.loanId) : null;
  return `
    <section class="card invoice-doc">
      <div class="inv-head">
        <div>
          <div class="brand"><span class="brand-mark">LD</span><span class="brand-name">LoanDesk Capital Advisory</span></div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">INVOICE</div>
          <div><b>${escapeHtml(inv.number)}</b></div>
          <div class="muted">Issued ${date(inv.issueDate)}</div>
          <div class="muted">Due ${date(inv.dueDate)}</div>
          <div style="margin-top:6px">${badge(invoiceStatus(inv))}</div>
        </div>
      </div>

      <div class="field" style="margin:18px 0">
        <div class="k">Bill to</div>
        <div class="v"><b>${escapeHtml(company.name)}</b></div>
        <div class="muted" style="font-size:13.5px">UEN ${escapeHtml(company.uen)}<br>Attn: ${escapeHtml(company.contactName)}, ${escapeHtml(company.contactRole)}</div>
      </div>

      <table>
        <thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
        <tbody>
          <tr>
            <td><b>${escapeHtml(inv.service)}</b><br><span class="muted">${escapeHtml(inv.description)}</span>${loan ? `<br><span class="muted">Facility amount ${money(loan.amountApproved)}</span>` : ''}</td>
            <td class="num">${money(inv.subtotal)}</td>
          </tr>
        </tbody>
      </table>
      <div class="inv-totals">
        <div><span>Subtotal</span><span>${money(inv.subtotal)}</span></div>
        <div><span>GST (${Math.round(GST_RATE * 100)}%)</span><span>${inv.gst ? money(inv.gst) : '—'}</span></div>
        <div class="inv-total"><span>Total due</span><span>${money(inv.total)}</span></div>
      </div>
      <p class="muted" style="font-size:12.5px;margin:16px 0 0">Payment terms: 14 days. Mock invoice for prototype purposes.</p>
    </section>`;
}

export function invoiceDetail({ id }) {
  const inv = getInvoice(id);
  if (!inv) return el('<div><a class="back" href="#/invoices">← Invoices</a><div class="empty">Invoice not found.</div></div>');
  const st = invoiceStatus(inv);

  const root = el(`
    <div>
      <a class="back no-print" href="#/invoices">← Invoices</a>
      <div class="page-head no-print">
        <div>
          <h1>${escapeHtml(inv.number)}</h1>
          <div class="sub"><a href="#/clients/${inv.companyId}">${escapeHtml(getCompany(inv.companyId).name)}</a>${inv.loanId ? ` · <a href="#/loans/${inv.loanId}">view facility</a>` : ''}${inv.auto ? ' · raised automatically on disbursement' : ''}</div>
        </div>
        <div class="spacer"></div>
        <div style="display:flex;gap:10px;align-items:center">
          ${inv.status === 'Draft' ? '<button id="send">Mark as sent</button>' : ''}
          ${st !== 'Paid' && inv.status !== 'Draft' ? '<button class="primary" id="paid">Mark as paid</button>' : ''}
          <button id="print">Print</button>
        </div>
      </div>
      ${invoiceDocument(inv)}
    </div>`);

  const on = (sel, fn) => { const b = root.querySelector(sel); if (b) b.addEventListener('click', fn); };
  on('#send', () => { setInvoiceStatus(inv.id, 'Sent'); toast('Marked as sent — now visible in the client portal (nothing emailed)'); refresh(); });
  on('#paid', () => { setInvoiceStatus(inv.id, 'Paid'); toast('Marked as paid'); refresh(); });
  on('#print', () => window.print());
  return root;
}
