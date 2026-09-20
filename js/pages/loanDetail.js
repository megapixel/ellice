import { el } from '../router.js';
import { getLoan, getCompany, daysUntil } from '../data.js';
import { date, money, badge, escapeHtml, pct, inDays } from '../format.js';
import { openMessageModal } from '../modal.js';
import { openLoanForm } from '../forms.js';

export function loanDetail({ id }) {
  const loan = getLoan(id);
  if (!loan) {
    return el('<div><a class="back" href="#/loans">← Loans</a><div class="empty">Loan not found.</div></div>');
  }
  const company = getCompany(loan.companyId);
  const repaid = loan.amountApproved - loan.outstanding;
  const repaidPct = pct(repaid, loan.amountApproved);
  const days = daysUntil(loan.maturityDate);

  const root = el(`
    <div>
      <a class="back" href="#/loans">← Loans</a>
      <div class="page-head">
        <div>
          <h1>${escapeHtml(loan.lender)} · ${escapeHtml(loan.type)}</h1>
          <div class="sub"><a href="#/clients/${company.id}">${escapeHtml(company.name)}</a> · UEN ${escapeHtml(company.uen)}</div>
        </div>
        <div class="spacer"></div>
        <div style="display:flex;gap:10px;align-items:center">
          ${badge(loan.status)}
          <button id="edit">Edit Loan</button>
          <button class="primary" id="gen">Generate Message</button>
        </div>
      </div>

      <section class="card">
        <div class="detail-grid">
          <div class="field"><div class="k">Lender</div><div class="v">${escapeHtml(loan.lender)}</div></div>
          <div class="field"><div class="k">Amount approved</div><div class="v">${money(loan.amountApproved)}</div></div>
          <div class="field"><div class="k">Outstanding balance</div><div class="v">${money(loan.outstanding)}</div></div>
          <div class="field"><div class="k">Disbursement date</div><div class="v">${date(loan.disbursementDate)}</div></div>
          <div class="field"><div class="k">Tenure</div><div class="v">${loan.tenureMonths} months</div></div>
          <div class="field"><div class="k">Interest rate</div><div class="v">${loan.interestRate}% p.a.</div></div>
          <div class="field"><div class="k">Repayment frequency</div><div class="v">${escapeHtml(loan.repaymentFrequency)}</div></div>
          <div class="field"><div class="k">Maturity date</div><div class="v">${date(loan.maturityDate)} <span class="muted">(${inDays(days)})</span></div></div>
          <div class="field"><div class="k">Status</div><div class="v">${badge(loan.status)}</div></div>
        </div>

        <div class="section-title">Repayment progress</div>
        <div class="muted" style="font-size:13px">${money(repaid)} repaid of ${money(loan.amountApproved)} (${repaidPct}%)</div>
        <div class="bar"><i style="width:${repaidPct}%"></i></div>

        <div class="section-title">Notes</div>
        <div class="notes">${escapeHtml(loan.notes)}</div>
      </section>

      <div class="section-title">Client</div>
      <a class="card row-link" href="#/clients/${company.id}" style="display:flex">
        <span class="row-main">
          <span class="row-title">${escapeHtml(company.name)}</span>
          <span class="row-meta">${escapeHtml(company.contactName)} · ${escapeHtml(company.contactPhone)}</span>
        </span>
        <span class="row-right">${badge(company.status)}</span>
      </a>
    </div>`);

  root.querySelector('#gen').addEventListener('click', () => {
    openMessageModal({ kind: 'loan', company, loan });
  });

  root.querySelector('#edit').addEventListener('click', () => openLoanForm(loan));

  return root;
}
