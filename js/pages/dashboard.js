import { el } from '../router.js';
import {
  loans, companies, loansMaturingBetween, recentlyApproved,
  upcomingOccasions, getCompany, daysUntil
} from '../data.js';
import { money, moneyShort, date, inDays, escapeHtml, badge, maturityBadge } from '../format.js';
import { columns, bars, stackedStatus, statTile, bindTooltips } from '../charts.js';

/* ---------------- visual summary ---------------- */

function tiles() {
  const live = loans.filter(l => l.status === 'Active' || l.status === 'Approved');
  const outstanding = live.reduce((s, l) => s + l.outstanding, 0);
  const due90 = loansMaturingBetween(0, 90);
  const due90Amt = due90.reduce((s, l) => s + l.outstanding, 0);
  const due30 = loansMaturingBetween(0, 30);
  const occ30 = upcomingOccasions(30);

  return `
    <div class="grid c4">
      ${statTile({
        label: 'Portfolio outstanding',
        value: moneyShort(outstanding),
        sub: `${live.length} live facilities · ${companies.length} clients`
      })}
      ${statTile({
        label: 'Maturing in 90 days',
        value: moneyShort(due90Amt),
        sub: `${due90.length} facilities · ${due30.length} inside 30 days`,
        href: '#/loans'
      })}
      ${statTile({
        label: 'Approved this month',
        value: moneyShort(recentlyApproved(30).reduce((s, l) => s + l.amountApproved, 0)),
        sub: `${recentlyApproved(30).length} new facilities`,
        href: '#/loans'
      })}
      ${statTile({
        label: 'Occasions in 30 days',
        value: String(occ30.length),
        sub: occ30.length ? `next: ${escapeHtml(occ30[0].title)}, ${inDays(occ30[0].inDays)}` : 'nothing upcoming',
        href: '#/occasions'
      })}
    </div>`;
}

function runwayChart() {
  const buckets = [
    { label: '0–30d', from: 0, to: 30 },
    { label: '31–60d', from: 31, to: 60 },
    { label: '61–90d', from: 61, to: 90 }
  ].map(b => {
    const list = loansMaturingBetween(b.from, b.to);
    const value = list.reduce((s, l) => s + l.outstanding, 0);
    return {
      label: b.label,
      value,
      tipText: `${b.label}: ${money(value)} outstanding across ${list.length} ${list.length === 1 ? 'facility' : 'facilities'}`
    };
  });

  return `
    <section class="card">
      <div class="card-head"><h2>Maturity runway</h2></div>
      <div class="card-sub">Outstanding balance falling due in the next 90 days</div>
      ${columns(buckets, moneyShort)}
    </section>`;
}

function lenderChart() {
  const byLender = new Map();
  loans
    .filter(l => l.status === 'Active' || l.status === 'Approved')
    .forEach(l => {
      const cur = byLender.get(l.lender) || { value: 0, count: 0 };
      byLender.set(l.lender, { value: cur.value + l.outstanding, count: cur.count + 1 });
    });

  const rows = [...byLender.entries()]
    .map(([lender, v]) => ({
      label: lender,
      value: v.value,
      tipText: `${lender}: ${money(v.value)} outstanding across ${v.count} ${v.count === 1 ? 'facility' : 'facilities'}`
    }))
    .sort((a, b) => b.value - a.value);

  return `
    <section class="card">
      <div class="card-head"><h2>Exposure by lender</h2></div>
      <div class="card-sub">Outstanding balance on live facilities</div>
      ${bars(rows, moneyShort)}
    </section>`;
}

function statusChart() {
  const tones = {
    Active: 'good', Approved: 'info', Pending: 'warning',
    Matured: 'neutral', Rejected: 'critical'
  };
  const segments = Object.keys(tones).map(status => {
    const list = loans.filter(l => l.status === status);
    return {
      label: status,
      tone: tones[status],
      count: list.length,
      value: list.reduce((s, l) => s + l.amountApproved, 0)
    };
  });

  return `
    <section class="card">
      <div class="card-head"><h2>Book by status</h2></div>
      <div class="card-sub">Approved amount across all ${loans.length} facilities</div>
      ${stackedStatus(segments, moneyShort)}
    </section>`;
}

/* ---------------- lists ---------------- */

function maturityCard(label, from, to) {
  const rows = loansMaturingBetween(from, to);
  return `
    <section class="card">
      <div class="card-head">
        <h2>Maturing in ${label}</h2>
        <span class="count">${rows.length}</span>
      </div>
      <div class="card-sub">Active and approved facilities</div>
      <div class="rows">
        ${rows.length ? rows.map(l => {
          const c = getCompany(l.companyId);
          const d = daysUntil(l.maturityDate);
          return `
            <a class="row-link" href="#/loans/${l.id}">
              <span class="row-main">
                <span class="row-title">${escapeHtml(c.name)}</span>
                <span class="row-meta">${escapeHtml(l.lender)} · ${escapeHtml(l.type)}</span>
              </span>
              <span class="row-right">
                <span class="row-amount">${moneyShort(l.outstanding)}</span><br>
                ${maturityBadge(d)}
              </span>
            </a>`;
        }).join('') : '<div class="empty">Nothing maturing in this window.</div>'}
      </div>
    </section>`;
}

function occasionsCard() {
  const items = upcomingOccasions(30);
  return `
    <section class="card">
      <div class="card-head">
        <h2>Occasions in the next 30 days</h2>
        <span class="count">${items.length}</span>
      </div>
      <div class="card-sub">Director birthdays and incorporation anniversaries</div>
      <div class="rows">
        ${items.length ? items.map(o => `
          <a class="row-link" href="#/clients/${o.companyId}">
            <span class="ico">${o.icon}</span>
            <span class="row-main">
              <span class="row-title">${escapeHtml(o.title)}</span>
              <span class="row-meta">${escapeHtml(o.subtitle)}</span>
            </span>
            <span class="row-right">
              <span class="row-meta">${date(o.date)}</span><br>
              <span class="badge ${o.inDays <= 7 ? 'warn' : 'neutral'}">${inDays(o.inDays)}</span>
            </span>
          </a>`).join('') : '<div class="empty">No occasions in the next 30 days.</div>'}
      </div>
      <div style="margin-top:10px"><a class="row-meta" href="#/occasions">View all 90 days →</a></div>
    </section>`;
}

function approvedCard() {
  const rows = recentlyApproved(30);
  return `
    <section class="card">
      <div class="card-head">
        <h2>Recently approved</h2>
        <span class="count">${rows.length}</span>
      </div>
      <div class="card-sub">Last 30 days</div>
      <div class="rows">
        ${rows.length ? rows.map(l => {
          const c = getCompany(l.companyId);
          return `
            <a class="row-link" href="#/loans/${l.id}">
              <span class="row-main">
                <span class="row-title">${escapeHtml(c.name)}</span>
                <span class="row-meta">${escapeHtml(l.lender)} · ${date(l.disbursementDate)}</span>
              </span>
              <span class="row-right">
                <span class="row-amount">${money(l.amountApproved)}</span><br>
                ${badge(l.status)}
              </span>
            </a>`;
        }).join('') : '<div class="empty">No approvals in the last 30 days.</div>'}
      </div>
    </section>`;
}

function insightsCard() {
  const insights = [
    {
      dot: 'warn',
      title: 'ABC Logistics Pte Ltd may need refinancing',
      body: 'No top-up in 14 months while receivables grew ~30%. Working capital line matures soon.',
      href: '#/clients/c2'
    },
    {
      dot: 'info',
      title: 'Apex Precision has 3 facilities maturing this quarter',
      body: 'DBS, OCBC and Maybank all fall due within 45 days — a consolidation could reduce blended cost.',
      href: '#/clients/c4'
    },
    {
      dot: 'ok',
      title: 'Orchid Retail has been dormant for 9 months',
      body: 'Last facility fully repaid with a clean record. Anniversary falls within the year — good re-entry point.',
      href: '#/clients/c7'
    }
  ];
  return `
    <section class="card insights">
      <div class="card-head">
        <h2>Insights</h2>
        <span class="tag">✨ placeholder</span>
      </div>
      <div class="card-sub">Static example flags — no model runs in this prototype</div>
      ${insights.map(i => `
        <a class="insight" href="${i.href}">
          <span class="dot ${i.dot}"></span>
          <span>
            <span class="it">${escapeHtml(i.title)}</span><br>
            <span class="ib">${escapeHtml(i.body)}</span>
          </span>
        </a>`).join('')}
    </section>`;
}

export function dashboard() {
  const total = loansMaturingBetween(0, 90).reduce((sum, l) => sum + l.outstanding, 0);

  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <div class="sub">${money(total)} outstanding across facilities maturing in the next 90 days</div>
        </div>
      </div>

      ${tiles()}

      <div class="grid c2" style="margin-top:16px">
        ${runwayChart()}
        ${lenderChart()}
      </div>

      <div style="margin-top:16px">${statusChart()}</div>

      <div class="grid c3" style="margin-top:16px">
        ${maturityCard('30 days', 0, 30)}
        ${maturityCard('60 days', 31, 60)}
        ${maturityCard('90 days', 61, 90)}
      </div>

      <div class="grid c2" style="margin-top:16px">
        ${occasionsCard()}
        ${approvedCard()}
      </div>

      <div style="margin-top:16px">${insightsCard()}</div>
    </div>`);

  bindTooltips(root);
  return root;
}
