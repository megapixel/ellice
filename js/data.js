// Mock data for the LoanDesk prototype. No backend, no persistence.
// Dates that drive the dashboard windows are expressed as offsets from "today"
// so every screen stays believably populated whenever the prototype is opened.

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export function today() {
  return new Date(TODAY);
}

/** ISO yyyy-mm-dd for a date N days from today. */
function offsetDays(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** ISO yyyy-mm-dd for the same month/day as today + n days, but `yearsAgo` years back. */
function anniversary(dayOffset, yearsAgo) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + dayOffset);
  d.setFullYear(d.getFullYear() - yearsAgo);
  return iso(d);
}

function iso(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const companies = [
  {
    id: 'c1',
    name: 'Sunrise Marine Services Pte Ltd',
    uen: '201408821K',
    incorporationDate: anniversary(9, 12),      // anniversary in 9 days
    industry: 'Marine & offshore logistics',
    contactName: 'Andrew Koh',
    contactRole: 'Finance Director',
    contactPhone: '+65 9123 4567',
    contactEmail: 'andrew.koh@sunrisemarine.com.sg',
    status: 'Active',
    notes: 'Long-standing client. Seasonal working capital needs around Q4 drydocking.',
    directors: [
      { name: 'Andrew Koh', role: 'Managing Director', birthday: anniversary(4, 54), phone: '+65 9123 4567', email: 'andrew.koh@sunrisemarine.com.sg' },
      { name: 'Serena Lim', role: 'Director', birthday: anniversary(61, 47), phone: '+65 9223 1180', email: 'serena.lim@sunrisemarine.com.sg' }
    ]
  },
  {
    id: 'c2',
    name: 'ABC Logistics Pte Ltd',
    uen: '201812934M',
    incorporationDate: anniversary(21, 8),
    industry: 'Freight forwarding',
    contactName: 'Priya Nair',
    contactRole: 'Operations Manager',
    contactPhone: '+65 8221 7745',
    contactEmail: 'priya@abclogistics.sg',
    status: 'Active',
    notes: 'No top-up facility taken in 14 months despite growing receivables — refinancing candidate.',
    directors: [
      { name: 'Raj Nair', role: 'Managing Director', birthday: anniversary(17, 51), phone: '+65 9887 2210', email: 'raj@abclogistics.sg' },
      { name: 'Priya Nair', role: 'Director', birthday: anniversary(74, 44), phone: '+65 8221 7745', email: 'priya@abclogistics.sg' }
    ]
  },
  {
    id: 'c3',
    name: 'Greenfield F&B Group Pte Ltd',
    uen: '201936502W',
    incorporationDate: anniversary(48, 6),
    industry: 'Food & beverage',
    contactName: 'Marcus Tay',
    contactRole: 'Group CFO',
    contactPhone: '+65 9765 1102',
    contactEmail: 'marcus.tay@greenfieldfb.sg',
    status: 'Active',
    notes: 'Expanding to two new outlets in Q1. Asked about equipment financing options.',
    directors: [
      { name: 'Marcus Tay', role: 'Group CFO', birthday: anniversary(26, 42), phone: '+65 9765 1102', email: 'marcus.tay@greenfieldfb.sg' },
      { name: 'Jolene Ng', role: 'Executive Director', birthday: anniversary(88, 39), phone: '+65 9012 4488', email: 'jolene.ng@greenfieldfb.sg' }
    ]
  },
  {
    id: 'c4',
    name: 'Apex Precision Engineering Pte Ltd',
    uen: '200704411E',
    incorporationDate: anniversary(70, 19),
    industry: 'Precision manufacturing',
    contactName: 'Daniel Wong',
    contactRole: 'Managing Director',
    contactPhone: '+65 9334 5521',
    contactEmail: 'daniel.wong@apexprecision.com.sg',
    status: 'Active',
    notes: 'Three facilities maturing within the same quarter — consolidation opportunity.',
    directors: [
      { name: 'Daniel Wong', role: 'Managing Director', birthday: anniversary(12, 58), phone: '+65 9334 5521', email: 'daniel.wong@apexprecision.com.sg' },
      { name: 'Michelle Chua', role: 'Director, Finance', birthday: anniversary(37, 46), phone: '+65 9440 7781', email: 'michelle.chua@apexprecision.com.sg' }
    ]
  },
  {
    id: 'c5',
    name: 'Harbourline Construction Pte Ltd',
    uen: '201122087H',
    incorporationDate: anniversary(150, 15),
    industry: 'Building & construction',
    contactName: 'Faizal Rahman',
    contactRole: 'Director',
    contactPhone: '+65 9678 3312',
    contactEmail: 'faizal@harbourline.sg',
    status: 'Active',
    notes: 'Progress-claim based cashflow. Prefers quarterly repayment structures.',
    directors: [
      { name: 'Faizal Rahman', role: 'Director', birthday: anniversary(55, 49), phone: '+65 9678 3312', email: 'faizal@harbourline.sg' }
    ]
  },
  {
    id: 'c6',
    name: 'Lumina Digital Pte Ltd',
    uen: '202104773R',
    incorporationDate: anniversary(33, 4),
    industry: 'Software & IT services',
    contactName: 'Clara Sim',
    contactRole: 'Founder',
    contactPhone: '+65 8123 9901',
    contactEmail: 'clara@luminadigital.io',
    status: 'Prospect',
    notes: 'First-time borrower. Reviewing unsecured working capital of up to S$150k.',
    directors: [
      { name: 'Clara Sim', role: 'Founder & CEO', birthday: anniversary(80, 36), phone: '+65 8123 9901', email: 'clara@luminadigital.io' },
      { name: 'Ethan Lau', role: 'Co-founder', birthday: anniversary(66, 34), phone: '+65 8990 2214', email: 'ethan@luminadigital.io' }
    ]
  },
  {
    id: 'c7',
    name: 'Orchid Retail Holdings Pte Ltd',
    uen: '201509338C',
    incorporationDate: anniversary(200, 11),
    industry: 'Retail',
    contactName: 'Grace Tan',
    contactRole: 'Finance Manager',
    contactPhone: '+65 9445 6620',
    contactEmail: 'grace.tan@orchidretail.sg',
    status: 'Dormant',
    notes: 'Last facility fully repaid 9 months ago. No contact since — worth re-engaging.',
    directors: [
      { name: 'Grace Tan', role: 'Finance Manager', birthday: anniversary(41, 45), phone: '+65 9445 6620', email: 'grace.tan@orchidretail.sg' },
      { name: 'Benjamin Ho', role: 'Managing Director', birthday: anniversary(95, 57), phone: '+65 9221 3390', email: 'ben.ho@orchidretail.sg' }
    ]
  }
];

export const loans = [
  {
    id: 'l1', companyId: 'c1', lender: 'DBS Bank', type: 'Working Capital',
    amountApproved: 250000, outstanding: 182400, disbursementDate: offsetDays(-540),
    tenureMonths: 24, interestRate: 6.25, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(18), status: 'Active',
    notes: 'Secured against trade receivables. Client has hinted at a top-up before drydock season.'
  },
  {
    id: 'l2', companyId: 'c1', lender: 'Maybank', type: 'Equipment Financing',
    amountApproved: 420000, outstanding: 315800, disbursementDate: offsetDays(-400),
    tenureMonths: 60, interestRate: 5.1, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(420), status: 'Active',
    notes: 'Financing for two marine cranes. Hire-purchase structure.'
  },
  {
    id: 'l3', companyId: 'c2', lender: 'OCBC Bank', type: 'Working Capital',
    amountApproved: 300000, outstanding: 96000, disbursementDate: offsetDays(-620),
    tenureMonths: 24, interestRate: 6.8, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(26), status: 'Active',
    notes: 'No top-up requested in 14 months. Receivables have grown ~30% over the same period.'
  },
  {
    id: 'l4', companyId: 'c2', lender: 'Funding Societies', type: 'Trade Finance',
    amountApproved: 180000, outstanding: 143200, disbursementDate: offsetDays(-120),
    tenureMonths: 12, interestRate: 9.4, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(245), status: 'Active',
    notes: 'Invoice financing line used for a major overseas shipper.'
  },
  {
    id: 'l5', companyId: 'c3', lender: 'UOB', type: 'Term Loan',
    amountApproved: 500000, outstanding: 500000, disbursementDate: offsetDays(-12),
    tenureMonths: 60, interestRate: 5.45, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(1815), status: 'Approved',
    notes: 'Approved for the two new outlet fit-outs. First repayment due next month.'
  },
  {
    id: 'l6', companyId: 'c3', lender: 'Validus', type: 'Working Capital',
    amountApproved: 120000, outstanding: 41500, disbursementDate: offsetDays(-330),
    tenureMonths: 12, interestRate: 10.2, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(52), status: 'Active',
    notes: 'Short-term bridge taken during renovation of the Bugis outlet.'
  },
  {
    id: 'l7', companyId: 'c4', lender: 'DBS Bank', type: 'Term Loan',
    amountApproved: 750000, outstanding: 212000, disbursementDate: offsetDays(-1300),
    tenureMonths: 48, interestRate: 4.9, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(44), status: 'Active',
    notes: 'CNC machinery expansion loan. Clean repayment record throughout.'
  },
  {
    id: 'l8', companyId: 'c4', lender: 'OCBC Bank', type: 'Trade Finance',
    amountApproved: 220000, outstanding: 158700, disbursementDate: offsetDays(-260),
    tenureMonths: 12, interestRate: 7.35, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(71), status: 'Active',
    notes: 'Supports imports of raw alloy from Japan. Renews annually.'
  },
  {
    id: 'l9', companyId: 'c4', lender: 'Maybank', type: 'Equipment Financing',
    amountApproved: 165000, outstanding: 88900, disbursementDate: offsetDays(-700),
    tenureMonths: 36, interestRate: 5.6, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(85), status: 'Active',
    notes: 'Third facility maturing this quarter — consolidation discussion pending.'
  },
  {
    id: 'l10', companyId: 'c5', lender: 'UOB', type: 'Property Loan',
    amountApproved: 1800000, outstanding: 1412000, disbursementDate: offsetDays(-980),
    tenureMonths: 180, interestRate: 4.35, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(4500), status: 'Active',
    notes: 'Industrial unit at Tuas. Fixed rate for the first 3 years, then board rate.'
  },
  {
    id: 'l11', companyId: 'c5', lender: 'Funding Societies', type: 'Working Capital',
    amountApproved: 200000, outstanding: 200000, disbursementDate: offsetDays(-5),
    tenureMonths: 18, interestRate: 8.75, repaymentFrequency: 'Quarterly',
    maturityDate: offsetDays(540), status: 'Approved',
    notes: 'Approved last week to bridge progress claims on the Jurong project.'
  },
  {
    id: 'l12', companyId: 'c6', lender: 'OCBC Bank', type: 'Working Capital',
    amountApproved: 150000, outstanding: 0, disbursementDate: null,
    tenureMonths: 24, interestRate: 7.9, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(760), status: 'Pending',
    notes: 'Application submitted. Awaiting credit decision — 2 years of financials requested.'
  },
  {
    id: 'l13', companyId: 'c7', lender: 'DBS Bank', type: 'Working Capital',
    amountApproved: 260000, outstanding: 0, disbursementDate: offsetDays(-1100),
    tenureMonths: 24, interestRate: 6.5, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(-270), status: 'Matured',
    notes: 'Fully repaid. Client has not taken a new facility since.'
  },
  {
    id: 'l14', companyId: 'c6', lender: 'Validus', type: 'Term Loan',
    amountApproved: 100000, outstanding: 0, disbursementDate: null,
    tenureMonths: 36, interestRate: 11.5, repaymentFrequency: 'Monthly',
    maturityDate: offsetDays(1080), status: 'Rejected',
    notes: 'Declined on trading history — company incorporated under 3 years ago.'
  }
];

/* ---------------- mock writes ----------------
   Records are held in memory only. Nothing is persisted — a page reload
   restores the original sample data.
--------------------------------------------- */

function nextId(list, prefix) {
  const max = list.reduce((m, r) => Math.max(m, parseInt(r.id.slice(prefix.length), 10) || 0), 0);
  return prefix + (max + 1);
}

export function saveCompany(draft) {
  if (draft.id) {
    const i = companies.findIndex(c => c.id === draft.id);
    if (i === -1) return null;
    companies[i] = { ...companies[i], ...draft };
    return companies[i];
  }
  const created = { ...draft, id: nextId(companies, 'c') };
  companies.push(created);
  return created;
}

export function saveLoan(draft) {
  if (draft.id) {
    const i = loans.findIndex(l => l.id === draft.id);
    if (i === -1) return null;
    loans[i] = { ...loans[i], ...draft };
    return loans[i];
  }
  const created = { ...draft, id: nextId(loans, 'l') };
  loans.push(created);
  return created;
}

/* ---------------- derived helpers ---------------- */

export function getCompany(id) {
  return companies.find(c => c.id === id) || null;
}

export function getLoan(id) {
  return loans.find(l => l.id === id) || null;
}

export function loansForCompany(companyId) {
  return loans.filter(l => l.companyId === companyId);
}

export function activeLoanCount(companyId) {
  return loans.filter(l => l.companyId === companyId && (l.status === 'Active' || l.status === 'Approved')).length;
}

export function daysUntil(isoDate) {
  if (!isoDate) return Infinity;
  const d = new Date(isoDate + 'T00:00:00');
  return Math.round((d - TODAY) / 86400000);
}

/** Active/Approved loans maturing between `from` and `to` days from today. */
export function loansMaturingBetween(from, to) {
  return loans
    .filter(l => l.status === 'Active' || l.status === 'Approved')
    .filter(l => {
      const d = daysUntil(l.maturityDate);
      return d >= from && d <= to;
    })
    .sort((a, b) => daysUntil(a.maturityDate) - daysUntil(b.maturityDate));
}

/** Loans approved (disbursed or newly approved) within the last `days` days. */
export function recentlyApproved(days = 30) {
  return loans
    .filter(l => (l.status === 'Approved' || l.status === 'Active')
      && l.disbursementDate && daysUntil(l.disbursementDate) >= -days)
    .sort((a, b) => daysUntil(b.disbursementDate) - daysUntil(a.disbursementDate));
}

/** Days from today until the next occurrence of a month/day (ignores the stored year). */
export function daysUntilAnniversary(isoDate) {
  if (!isoDate) return Infinity;   // records added without a date simply never surface
  const src = new Date(isoDate + 'T00:00:00');
  const next = new Date(TODAY.getFullYear(), src.getMonth(), src.getDate());
  if (next < TODAY) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next - TODAY) / 86400000);
}

export function nextOccurrence(isoDate) {
  if (!isoDate) return null;
  const src = new Date(isoDate + 'T00:00:00');
  const next = new Date(TODAY.getFullYear(), src.getMonth(), src.getDate());
  if (next < TODAY) next.setFullYear(next.getFullYear() + 1);
  return iso(next);
}

/**
 * Merged list of director birthdays + company incorporation anniversaries
 * occurring within the next `days` days, sorted soonest first.
 */
export function upcomingOccasions(days = 90) {
  const out = [];

  companies.forEach(company => {
    const inDays = daysUntilAnniversary(company.incorporationDate);
    if (inDays <= days) {
      const years = new Date(nextOccurrence(company.incorporationDate)).getFullYear()
        - new Date(company.incorporationDate + 'T00:00:00').getFullYear();
      out.push({
        kind: 'anniversary',
        icon: '🏢',
        title: `${company.name}`,
        subtitle: `${years}${ordinal(years)} incorporation anniversary`,
        date: nextOccurrence(company.incorporationDate),
        inDays,
        companyId: company.id,
        personName: null,
        years
      });
    }

    company.directors.forEach(director => {
      const dDays = daysUntilAnniversary(director.birthday);
      if (dDays <= days) {
        out.push({
          kind: 'birthday',
          icon: '🎂',
          title: director.name,
          subtitle: `${director.role}, ${company.name}`,
          date: nextOccurrence(director.birthday),
          inDays: dDays,
          companyId: company.id,
          personName: director.name,
          years: null
        });
      }
    });
  });

  return out.sort((a, b) => a.inDays - b.inDays);
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export const LOAN_STATUSES = ['Active', 'Approved', 'Pending', 'Matured', 'Rejected'];
export const LOAN_TYPES = ['Working Capital', 'Term Loan', 'Trade Finance', 'Equipment Financing', 'Property Loan'];
export const CLIENT_STATUSES = ['Active', 'Prospect', 'Dormant'];
