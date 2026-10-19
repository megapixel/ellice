// Estimated repayment schedule for the client bot. Mock calculation only:
// a standard amortising instalment from the loan's rate, tenure and frequency.
// Real figures would come from the lender's repayment schedule.

import { today } from './data.js';

const PERIODS_PER_YEAR = { Monthly: 12, Quarterly: 4 };

function stepMonths(loan) {
  return loan.repaymentFrequency === 'Quarterly' ? 3 : 1;
}

export function isRepaying(loan) {
  return loan.status === 'Active' && !!loan.disbursementDate && loan.outstanding > 0;
}

export function instalmentAmount(loan) {
  const perYear = PERIODS_PER_YEAR[loan.repaymentFrequency] || 12;
  const n = Math.max(1, Math.round((loan.tenureMonths / 12) * perYear));
  const r = loan.interestRate / 100 / perYear;
  const pmt = r === 0 ? loan.amountApproved / n : (loan.amountApproved * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(pmt);
}

/** Due dates from disbursement, one period apart, that are still in the future. */
export function upcomingInstalments(loan, count = 6) {
  if (!isRepaying(loan)) return [];
  const start = new Date(loan.disbursementDate + 'T00:00:00');
  const end = new Date(loan.maturityDate + 'T00:00:00');
  const now = today();
  now.setHours(0, 0, 0, 0);
  const amount = instalmentAmount(loan);
  const out = [];
  for (let k = 1; out.length < count; k++) {
    const d = new Date(start.getFullYear(), start.getMonth() + k * stepMonths(loan), start.getDate());
    if (d > end) break;
    if (d >= now) out.push({ loan, amount, date: toIso(d), inDays: Math.round((d - now) / 86400000) });
  }
  return out;
}

export function nextInstalment(loan) {
  return upcomingInstalments(loan, 1)[0] || null;
}

function toIso(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
