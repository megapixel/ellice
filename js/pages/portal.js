// Client portal — what a signed-in client sees. Everything is scoped to the company
// on the session; the broker's internal notes and other clients' data never appear.
// Instalments are estimates from js/schedule.js (a real build would read the lender's
// repayment schedule).

import { el, navigate } from '../router.js';
import { currentUser } from '../auth.js';
import { getCompany, getLoan, loansForCompany, daysUntil } from '../data.js';
import { money, date, badge, maturityBadge, escapeHtml, pct, inDays } from '../format.js';
import { statTile } from '../charts.js';
import { toast } from '../modal.js';
import { isRepaying, nextInstalment, upcomingInstalments, instalmentAmount } from '../schedule.js';

const BROKER = { name: 'Ellice Au', phone: '+65 9123 4567', email: 'ellice@loandesk.example' };

/** Loans a client can meaningfully monitor (excludes rejected/pending applications). */
function liveLoans(companyId) {
  return loansForCompany(companyId).filter(l => ['Active', 'Approved', 'Matured'].includes(l.status));
}

function myCompany() {
  const u = currentUser();
  return u && u.role === 'client' ? getCompany(u.companyId) : null;
}

function alertsFor(loans) {
  const out = [];
  for (const l of loans.filter(isRepaying)) {
    const nx = nextInstalment(l);
    if (nx && nx.inDays <= 7) {
      out.push(`💳 ${escapeHtml(l.lender)} ${escapeHtml(l.type)}: ~${money(nx.amount)} due ${inDays(nx.inDays)} (${date(nx.date)})`);
    }
    const md = daysUntil(l.maturityDate);
    if (md >= 0 && md <= 60) {
      out.push(`${md <= 30 ? '🔴' : '⚠️'} ${escapeHtml(l.lender)} ${escapeHtml(l.type)} matures ${inDays(md)} (${date(l.maturityDate)})`);
    }
  }
  return out;
}

export function portal() {
  const company = myCompany();
  if (!company) return el('<div class="empty">Please sign in.</div>');

  const loans = liveLoans(company.id);
  const total = loans.reduce((s, l) => s + l.outstanding, 0);
  const running = loans.filter(l => l.status !== 'Matured');
  const due = loans.filter(isRepaying).map(nextInstalment).filter(Boolean).sort((a, b) => a.inDays - b.inDays);
  const nextMat = running.slice().sort((a, b) => daysUntil(a.maturityDate) - daysUntil(b.maturityDate))[0];
  const schedule = loans.filter(isRepaying).flatMap(l => upcomingInstalments(l, 6))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const alerts = alertsFor(loans);
  const first = currentUser().name.trim().split(/\s+/)[0];

  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Hi ${escapeHtml(first)}</h1>
          <div class="sub">${escapeHtml(company.name)} · UEN ${escapeHtml(company.uen)}</div>
        </div>
      </div>

      ${alerts.length ? `<div class="card portal-alert"><b>🔔 Reminders</b><br>${alerts.join('<br>')}</div>` : ''}

      <div class="grid c4">
        ${statTile({ label: 'Total outstanding', value: money(total), sub: `${running.length} running facilit${running.length === 1 ? 'y' : 'ies'}` })}
        ${statTile({
          label: 'Next payment',
          value: due.length ? money(due[0].amount) : '—',
          sub: due.length ? `${date(due[0].date)} · ${inDays(due[0].inDays)}` : 'Nothing due'
        })}
        ${statTile({
          label: 'Next maturity',
          value: nextMat ? date(nextMat.maturityDate) : '—',
          sub: nextMat ? `${escapeHtml(nextMat.lender)} · ${inDays(daysUntil(nextMat.maturityDate))}` : 'No running facilities'
        })}
        ${statTile({ label: 'Your broker', value: BROKER.name, sub: escapeHtml(BROKER.phone) })}
      </div>

      <div class="section-title">Your facilities</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Lender</th><th>Type</th>
              <th class="num">Outstanding</th><th>Repaid</th><th>Maturity</th><th>Status</th>
            </tr>
          </thead>
          <tbody id="rows">
            ${loans.length ? loans.map(l => `
              <tr class="clickable" data-id="${l.id}">
                <td class="strong">${escapeHtml(l.lender)}</td>
                <td>${escapeHtml(l.type)}</td>
                <td class="num">${money(l.outstanding)}</td>
                <td style="min-width:120px">${pct(l.amountApproved - l.outstanding, l.amountApproved)}%
                  <div class="bar"><i style="width:${pct(l.amountApproved - l.outstanding, l.amountApproved)}%"></i></div></td>
                <td>${date(l.maturityDate)}${l.status === 'Matured' ? '' : ' ' + maturityBadge(daysUntil(l.maturityDate))}</td>
                <td>${badge(l.status)}</td>
              </tr>`).join('')
              : '<tr><td colspan="6"><div class="empty">No facilities on record yet.</div></td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section-title">Upcoming payments <span class="muted" style="font-weight:400">· estimates</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Facility</th><th class="num">Estimated amount</th></tr></thead>
          <tbody>
            ${schedule.length ? schedule.map(r => `
              <tr>
                <td>${date(r.date)} <span class="muted">(${inDays(r.inDays)})</span></td>
                <td>${escapeHtml(r.loan.lender)} · ${escapeHtml(r.loan.type)}</td>
                <td class="num">${money(r.amount)}</td>
              </tr>`).join('')
              : '<tr><td colspan="3"><div class="empty">No upcoming payments.</div></td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section-title">Need to talk?</div>
      <div class="card portal-contact">
        <div>
          <b>${escapeHtml(BROKER.name)}</b><br>
          <span class="muted">${escapeHtml(BROKER.phone)} · ${escapeHtml(BROKER.email)}<br>Mon–Fri, 9am–6pm</span>
        </div>
        <button class="primary" id="refi">Ask about refinancing</button>
      </div>
    </div>`);

  root.querySelector('#rows').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) navigate(`#/portal/loans/${tr.dataset.id}`);
  });
  root.querySelector('#refi').addEventListener('click', () => {
    toast(`Request noted — ${BROKER.name} will contact you within 1 business day (mock).`);
  });

  return root;
}

export function portalLoan({ id }) {
  const company = myCompany();
  if (!company) return el('<div class="empty">Please sign in.</div>');

  const loan = getLoan(id);
  // Ownership check: a client can only open their own company's facilities.
  if (!loan || loan.companyId !== company.id || !liveLoans(company.id).includes(loan)) {
    return el('<div><a class="back" href="#/portal">← My loans</a><div class="empty">Facility not found.</div></div>');
  }

  const repaid = loan.amountApproved - loan.outstanding;
  const repaidPct = pct(repaid, loan.amountApproved);
  const days = daysUntil(loan.maturityDate);
  const upcoming = upcomingInstalments(loan, 6);

  return el(`
    <div>
      <a class="back" href="#/portal">← My loans</a>
      <div class="page-head">
        <div>
          <h1>${escapeHtml(loan.lender)} · ${escapeHtml(loan.type)}</h1>
          <div class="sub">${escapeHtml(company.name)}</div>
        </div>
        <div class="spacer"></div>
        ${badge(loan.status)}
      </div>

      <section class="card">
        <div class="detail-grid">
          <div class="field"><div class="k">Amount approved</div><div class="v">${money(loan.amountApproved)}</div></div>
          <div class="field"><div class="k">Outstanding balance</div><div class="v">${money(loan.outstanding)}</div></div>
          <div class="field"><div class="k">Interest rate</div><div class="v">${loan.interestRate}% p.a.</div></div>
          <div class="field"><div class="k">Disbursement date</div><div class="v">${date(loan.disbursementDate)}</div></div>
          <div class="field"><div class="k">Tenure</div><div class="v">${loan.tenureMonths} months</div></div>
          <div class="field"><div class="k">Repayment frequency</div><div class="v">${escapeHtml(loan.repaymentFrequency)}${isRepaying(loan) ? ` · ~${money(instalmentAmount(loan))} each` : ''}</div></div>
          <div class="field"><div class="k">Maturity date</div><div class="v">${date(loan.maturityDate)} <span class="muted">(${inDays(days)})</span></div></div>
        </div>

        <div class="section-title">Repayment progress</div>
        <div class="muted" style="font-size:13px">${money(repaid)} repaid of ${money(loan.amountApproved)} (${repaidPct}%)</div>
        <div class="bar"><i style="width:${repaidPct}%"></i></div>
      </section>

      <div class="section-title">Upcoming payments <span class="muted" style="font-weight:400">· estimates</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th class="num">Estimated amount</th></tr></thead>
          <tbody>
            ${upcoming.length ? upcoming.map(r => `
              <tr><td>${date(r.date)} <span class="muted">(${inDays(r.inDays)})</span></td><td class="num">${money(r.amount)}</td></tr>`).join('')
              : '<tr><td colspan="2"><div class="empty">No upcoming payments on this facility.</div></td></tr>'}
          </tbody>
        </table>
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">Amounts are estimates from rate, tenure and frequency — your lender's statement is final.</p>
    </div>`);
}
