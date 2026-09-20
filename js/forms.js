// Add / edit forms for clients and loans.
//
// Prototype behaviour: records are written to the in-memory mock arrays only.
// Nothing is persisted — reloading the page restores the original sample data.

import { escapeHtml } from './format.js';
import {
  companies, saveCompany, saveLoan,
  CLIENT_STATUSES, LOAN_STATUSES, LOAN_TYPES
} from './data.js';
import { toast } from './modal.js';
import { refresh, navigate } from './router.js';

const root = document.getElementById('modal-root');

const REPAYMENT_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-yearly', 'Bullet'];

function closeForm() {
  root.innerHTML = '';
  document.removeEventListener('keydown', onKey);
}

function onKey(e) {
  if (e.key !== 'Escape') return;
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) { a.blur(); return; }
  closeForm();
}

function field(label, name, value, { type = 'text', required = false, span = 1, placeholder = '' } = {}) {
  return `
    <label class="ff" style="grid-column: span ${span}">
      <span class="k">${escapeHtml(label)}${required ? ' *' : ''}</span>
      <input type="${type}" name="${name}" value="${escapeHtml(value ?? '')}"
        placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>
    </label>`;
}

function select(label, name, value, options, { span = 1 } = {}) {
  return `
    <label class="ff" style="grid-column: span ${span}">
      <span class="k">${escapeHtml(label)}</span>
      <select name="${name}">
        ${options.map(o => {
          const val = typeof o === 'string' ? o : o.value;
          const text = typeof o === 'string' ? o : o.label;
          return `<option value="${escapeHtml(val)}" ${val === value ? 'selected' : ''}>${escapeHtml(text)}</option>`;
        }).join('')}
      </select>
    </label>`;
}

function textarea(label, name, value, { span = 2 } = {}) {
  return `
    <label class="ff" style="grid-column: span ${span}">
      <span class="k">${escapeHtml(label)}</span>
      <textarea name="${name}" rows="3">${escapeHtml(value ?? '')}</textarea>
    </label>`;
}

function shell(title, subtitle, bodyHtml) {
  root.innerHTML = `
    <div class="backdrop" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal wide">
        <header>
          <h3>${escapeHtml(title)}</h3>
          <span class="tag">prototype · saved in memory</span>
          <button class="x" data-close aria-label="Close">✕</button>
        </header>
        <form id="rec-form" novalidate>
          <div class="body">
            ${subtitle ? `<div class="to">${escapeHtml(subtitle)}</div>` : ''}
            ${bodyHtml}
            <div class="form-error" id="err" hidden></div>
          </div>
          <footer>
            <button type="submit" class="primary">Save</button>
            <button type="button" data-close>Cancel</button>
            <span class="note">Not persisted — resets on reload</span>
          </footer>
        </form>
      </div>
    </div>`;

  const backdrop = root.querySelector('.backdrop');
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeForm(); });
  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeForm));
  document.addEventListener('keydown', onKey);
  return root.querySelector('#rec-form');
}

function showError(form, message) {
  const err = form.querySelector('#err');
  err.textContent = message;
  err.hidden = false;
}

/* ---------------- client form ---------------- */

export function openClientForm(existing = null) {
  const c = existing || {
    name: '', uen: '', incorporationDate: '', industry: '',
    contactName: '', contactRole: '', contactPhone: '', contactEmail: '',
    status: 'Prospect', notes: '', directors: []
  };
  // Working copy of the directors so Cancel discards row edits too.
  let directors = c.directors.map(d => ({ ...d }));

  const form = shell(
    existing ? 'Edit Client' : 'Add Client',
    existing ? existing.name : 'New company record',
    `
    <div class="form-grid">
      ${field('Company name', 'name', c.name, { required: true, span: 2 })}
      ${field('UEN', 'uen', c.uen, { placeholder: '201812934M' })}
      ${field('Incorporation date', 'incorporationDate', c.incorporationDate, { type: 'date' })}
      ${field('Industry', 'industry', c.industry)}
      ${select('Status', 'status', c.status, CLIENT_STATUSES)}
      ${field('Primary contact', 'contactName', c.contactName)}
      ${field('Contact role', 'contactRole', c.contactRole)}
      ${field('Phone', 'contactPhone', c.contactPhone, { placeholder: '+65 9123 4567' })}
      ${field('Email', 'contactEmail', c.contactEmail)}
      ${textarea('Notes', 'notes', c.notes)}
    </div>

    <div class="section-title" style="margin-top:18px">Directors</div>
    <div id="directors"></div>
    <button type="button" class="small" id="add-director" style="margin-top:8px">+ Add director</button>
    `
  );

  const list = form.querySelector('#directors');

  function renderDirectors() {
    list.innerHTML = directors.length ? directors.map((d, i) => `
      <div class="subform" data-i="${i}">
        <div class="form-grid tight">
          ${field('Name', `d-name-${i}`, d.name)}
          ${field('Role', `d-role-${i}`, d.role)}
          ${field('Birthday', `d-birthday-${i}`, d.birthday, { type: 'date' })}
          ${field('Phone', `d-phone-${i}`, d.phone)}
          ${field('Email', `d-email-${i}`, d.email, { span: 2 })}
        </div>
        <button type="button" class="small remove" data-remove="${i}">Remove</button>
      </div>`).join('')
      : '<div class="empty">No directors yet.</div>';
  }

  /** Read the director rows back out of the DOM before re-rendering or saving. */
  function collectDirectors() {
    return [...list.querySelectorAll('.subform')].map(row => {
      const i = row.dataset.i;
      const get = n => (form.elements[`d-${n}-${i}`]?.value || '').trim();
      return { name: get('name'), role: get('role'), birthday: get('birthday'), phone: get('phone'), email: get('email') };
    });
  }

  form.querySelector('#add-director').addEventListener('click', () => {
    directors = collectDirectors();
    directors.push({ name: '', role: 'Director', birthday: '', phone: '', email: '' });
    renderDirectors();
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    directors = collectDirectors();
    directors.splice(Number(btn.dataset.remove), 1);
    renderDirectors();
  });

  renderDirectors();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => (form.elements[n].value || '').trim();

    if (!v('name')) return showError(form, 'Company name is required.');

    const rows = collectDirectors().filter(d => d.name);   // drop blank rows
    const missingBirthday = rows.some(d => !d.birthday);   // birthday is optional, but flag it

    const draft = {
      id: existing ? existing.id : undefined,
      name: v('name'),
      uen: v('uen'),
      incorporationDate: v('incorporationDate'),
      industry: v('industry'),
      contactName: v('contactName'),
      contactRole: v('contactRole'),
      contactPhone: v('contactPhone'),
      contactEmail: v('contactEmail'),
      status: v('status'),
      notes: v('notes'),
      directors: rows
    };

    const saved = saveCompany(draft);
    closeForm();
    toast(existing
      ? 'Client updated (in memory only)'
      : `Client added (in memory only)${missingBirthday ? ' — a director has no birthday set' : ''}`);

    if (existing) refresh();
    else navigate(`#/clients/${saved.id}`);
  });
}

/* ---------------- loan form ---------------- */

export function openLoanForm(existing = null, defaults = {}) {
  const l = existing || {
    companyId: defaults.companyId || (companies[0] && companies[0].id) || '',
    lender: '', type: LOAN_TYPES[0], amountApproved: '', outstanding: '',
    disbursementDate: '', tenureMonths: '', interestRate: '',
    repaymentFrequency: 'Monthly', maturityDate: '', status: 'Pending', notes: ''
  };

  const form = shell(
    existing ? 'Edit Loan' : 'Add Loan',
    existing ? `${existing.lender} · ${existing.type}` : 'New facility record',
    `
    <div class="form-grid">
      ${select('Client', 'companyId', l.companyId,
        companies.map(c => ({ value: c.id, label: c.name })), { span: 2 })}
      ${field('Lender', 'lender', l.lender, { required: true, placeholder: 'DBS Bank' })}
      ${select('Loan type', 'type', l.type, LOAN_TYPES)}
      ${field('Amount approved (S$)', 'amountApproved', l.amountApproved, { type: 'number', required: true })}
      ${field('Outstanding balance (S$)', 'outstanding', l.outstanding, { type: 'number' })}
      ${field('Disbursement date', 'disbursementDate', l.disbursementDate, { type: 'date' })}
      ${field('Maturity date', 'maturityDate', l.maturityDate, { type: 'date', required: true })}
      ${field('Tenure (months)', 'tenureMonths', l.tenureMonths, { type: 'number' })}
      ${field('Interest rate (% p.a.)', 'interestRate', l.interestRate, { type: 'number' })}
      ${select('Repayment frequency', 'repaymentFrequency', l.repaymentFrequency, REPAYMENT_FREQUENCIES)}
      ${select('Status', 'status', l.status, LOAN_STATUSES)}
      ${textarea('Notes', 'notes', l.notes)}
    </div>`
  );

  form.querySelector('[name="interestRate"]').step = '0.01';

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => (form.elements[n].value || '').trim();
    const num = n => (v(n) === '' ? null : Number(v(n)));

    if (!v('lender')) return showError(form, 'Lender is required.');
    if (v('amountApproved') === '') return showError(form, 'Amount approved is required.');
    if (!v('maturityDate')) return showError(form, 'Maturity date is required.');

    const approved = num('amountApproved');
    const outstanding = v('outstanding') === '' ? 0 : num('outstanding');
    if (outstanding > approved) {
      return showError(form, 'Outstanding balance cannot exceed the amount approved.');
    }
    if (v('disbursementDate') && v('disbursementDate') > v('maturityDate')) {
      return showError(form, 'Maturity date must fall after the disbursement date.');
    }

    const draft = {
      id: existing ? existing.id : undefined,
      companyId: v('companyId'),
      lender: v('lender'),
      type: v('type'),
      amountApproved: approved,
      outstanding,
      disbursementDate: v('disbursementDate') || null,
      tenureMonths: num('tenureMonths') ?? 0,
      interestRate: num('interestRate') ?? 0,
      repaymentFrequency: v('repaymentFrequency'),
      maturityDate: v('maturityDate'),
      status: v('status'),
      notes: v('notes')
    };

    const saved = saveLoan(draft);
    closeForm();
    toast(existing ? 'Loan updated (in memory only)' : 'Loan added (in memory only)');

    if (existing) refresh();
    else navigate(`#/loans/${saved.id}`);
  });
}
