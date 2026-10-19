// Client-facing Telegram bot simulator — "monitor my own loans by text".
//
// Mock only: nothing is sent to Telegram and no model is involved. The chat is
// bound to ONE company (chosen in the "Chatting as" selector, standing in for the
// client's Telegram chat ID), so replies never include other clients' data or the
// broker's internal notes. Instalments are estimates from js/schedule.js.

import { el, navigate } from '../router.js';
import { mountChat } from '../chat.js';
import { companies, getCompany, loansForCompany, daysUntil } from '../data.js';
import { money, date, escapeHtml, inDays, pct } from '../format.js';
import { isRepaying, nextInstalment, upcomingInstalments } from '../schedule.js';

const BROKER = { name: 'Ellice Au', phone: '+65 9123 4567', email: 'ellice@loandesk.example' };

const SUGGESTIONS = ['/myloans', '/balance', '/next', '/schedule', '/maturity', '/refinance', '/contact'];

const HELP = [
  ['/myloans', 'all your facilities at a glance'],
  ['/balance', 'outstanding balance and repayment progress'],
  ['/next', 'your next payment due on each loan'],
  ['/schedule [n]', 'your next n payments (default 6)'],
  ['/maturity', 'maturity dates and countdowns'],
  ['/refinance', 'ask your broker about refinancing'],
  ['/contact', 'reach your broker'],
  ['/help', 'this list']
];

function parse(input) {
  const l = input.trim().toLowerCase();
  if (/^\/?help\b/.test(l)) return { cmd: 'help' };
  if (/^\/?(balance|outstanding|progress)\b/.test(l)) return { cmd: 'balance' };
  if (/^\/?(next|due|payment)\b/.test(l)) return { cmd: 'next' };
  if (/^\/?schedule\b/.test(l)) return { cmd: 'schedule', n: Number((l.match(/(\d+)/) || [])[1]) || 6 };
  if (/^\/?(maturity|maturing|matures|expiry)\b/.test(l)) return { cmd: 'maturity' };
  if (/^\/?(refinance|refi|topup|top-up)\b/.test(l)) return { cmd: 'refinance' };
  if (/^\/?(contact|broker|call)\b/.test(l)) return { cmd: 'contact' };
  return { cmd: 'myloans' };
}

function bar(percent) {
  const filled = Math.round(percent / 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled) + ` ${percent}%`;
}

function flag(days) {
  return days <= 30 ? '🔴 ' : days <= 60 ? '⚠️ ' : '';
}

function loanName(l) {
  return `${escapeHtml(l.lender)} ${escapeHtml(l.type)}`;
}

/** Loans the client can meaningfully monitor (excludes rejected/pending applications). */
function liveLoans(companyId) {
  return loansForCompany(companyId).filter(l => ['Active', 'Approved', 'Matured'].includes(l.status));
}

export function clientReply(companyId, input) {
  const { cmd, n } = parse(input);
  const company = getCompany(companyId);
  const loans = liveLoans(company.id);
  const links = [{ label: 'Broker view in CRM', href: `#/clients/${company.id}` }];

  if (cmd === 'help') {
    return {
      html: `<b>What I can do</b><br>${HELP.map(([c, d]) => `${c} — ${d}`).join('<br>')}`,
      links: []
    };
  }

  if (cmd === 'contact') {
    return {
      html: `<b>Your broker</b><br>${BROKER.name}<br>${BROKER.phone}<br>${BROKER.email}`
        + `<br><span class="dim">Mon–Fri, 9am–6pm</span>`,
      links: []
    };
  }

  if (!loans.length) {
    return { html: `You have no facilities on record yet. Send /contact to speak to ${BROKER.name}.`, links: [] };
  }

  if (cmd === 'balance') {
    const total = loans.reduce((s, l) => s + l.outstanding, 0);
    return {
      html: `<b>Total outstanding: ${money(total)}</b><br><br>`
        + loans.map(l => `<b>${loanName(l)}</b><br>${money(l.outstanding)} of ${money(l.amountApproved)}<br>`
          + `<span class="dim">${bar(pct(l.amountApproved - l.outstanding, l.amountApproved))} repaid</span>`).join('<br><br>'),
      links
    };
  }

  if (cmd === 'next') {
    const due = loans.filter(isRepaying).map(nextInstalment).filter(Boolean).sort((a, b) => a.inDays - b.inDays);
    if (!due.length) return { html: 'No upcoming payments on your facilities. 👍', links: [] };
    return {
      html: `<b>Next payments</b><br>`
        + due.map(d => `• ${loanName(d.loan)}<br>&nbsp;&nbsp;~${money(d.amount)} on ${date(d.date)} <span class="dim">(${inDays(d.inDays)})</span>`).join('<br>')
        + `<br><br><span class="dim">Amounts are estimates — your lender's statement is final.</span>`,
      links
    };
  }

  if (cmd === 'schedule') {
    const rows = loans.filter(isRepaying).flatMap(l => upcomingInstalments(l, n))
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
    if (!rows.length) return { html: 'No upcoming payments to show.', links: [] };
    return {
      html: `<b>Next ${rows.length} payments</b><br>`
        + rows.map(r => `${date(r.date)} — ~${money(r.amount)}<br>&nbsp;&nbsp;<span class="dim">${loanName(r.loan)}</span>`).join('<br>')
        + `<br><br><span class="dim">Estimated from rate, tenure and frequency.</span>`,
      links
    };
  }

  if (cmd === 'maturity') {
    const rows = loans.filter(l => l.status !== 'Matured').sort((a, b) => daysUntil(a.maturityDate) - daysUntil(b.maturityDate));
    if (!rows.length) return { html: 'None of your facilities are still running.', links: [] };
    return {
      html: `<b>Maturity dates</b><br>`
        + rows.map(l => `${flag(daysUntil(l.maturityDate))}${loanName(l)}<br>&nbsp;&nbsp;<span class="dim">${date(l.maturityDate)} (${inDays(daysUntil(l.maturityDate))}) · ${money(l.outstanding)} outstanding</span>`).join('<br>')
        + (rows.some(l => daysUntil(l.maturityDate) <= 60) ? `<br><br>Facility ending soon? Send /refinance.` : ''),
      links
    };
  }

  if (cmd === 'refinance') {
    const soon = loans.filter(l => l.status === 'Active' && daysUntil(l.maturityDate) <= 90);
    return {
      html: `✅ Request noted. ${BROKER.name} will contact ${escapeHtml(company.contactName)} within 1 business day.`
        + (soon.length ? `<br><br><b>Maturing within 90 days</b><br>${soon.map(l => `• ${loanName(l)} — ${date(l.maturityDate)}`).join('<br>')}` : '')
        + `<br><br><span class="dim">Mock — nothing was actually sent.</span>`,
      links: []
    };
  }

  // myloans
  const total = loans.reduce((s, l) => s + l.outstanding, 0);
  return {
    html: `<b>${escapeHtml(company.name)}</b><br><span class="dim">${loans.length} facilities · ${money(total)} outstanding</span><br><br>`
      + loans.map(l => `• <b>${loanName(l)}</b> — ${escapeHtml(l.status)}<br>&nbsp;&nbsp;${money(l.outstanding)} outstanding · ${l.interestRate}% p.a.<br>`
        + `&nbsp;&nbsp;<span class="dim">${bar(pct(l.amountApproved - l.outstanding, l.amountApproved))} · matures ${date(l.maturityDate)}</span>`).join('<br><br>'),
    links
  };
}

/** Push-style alerts a client would receive without asking. */
function alertsFor(companyId) {
  const out = [];
  for (const l of liveLoans(companyId).filter(isRepaying)) {
    const nx = nextInstalment(l);
    if (nx && nx.inDays <= 7) out.push(`💳 ${loanName(l)}: ~${money(nx.amount)} due ${inDays(nx.inDays)} (${date(nx.date)})`);
    const md = daysUntil(l.maturityDate);
    if (md <= 60) out.push(`${flag(md)}${loanName(l)} matures ${inDays(md)} (${date(l.maturityDate)})`);
  }
  return out;
}

export function clientBot({ id } = {}) {
  const company = getCompany(id) || companies.find(c => liveLoans(c.id).some(isRepaying)) || companies[0];

  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Client Bot</h1>
          <div class="sub">Simulated Telegram bot for your clients — they text, they see their own loans</div>
        </div>
        <div class="spacer"></div>
        <label class="muted" style="font-size:13px">Chatting as
          <select id="who">${companies.map(c => `<option value="${c.id}"${c.id === company.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select>
        </label>
      </div>

      <div class="tg-layout">
        <div class="tg-phone">
          <div class="tg-head">
            <span class="tg-avatar">LD</span>
            <span>
              <span class="tg-title">LoanDesk · ${escapeHtml(company.name)}</span>
              <span class="tg-status">client chat · mock</span>
            </span>
          </div>
          <div class="tg-log" id="log"></div>
          <div class="tg-chips" id="chips">
            ${SUGGESTIONS.map(s => `<button class="chip" data-send="${s}">${s}</button>`).join('')}
          </div>
          <form class="tg-compose" id="compose">
            <input id="msg" type="text" placeholder="Message" autocomplete="off">
            <button class="primary" type="submit">Send</button>
          </form>
        </div>

        <aside class="card">
          <h2>How this would work</h2>
          <div class="card-sub">Prototype notes</div>
          <p class="muted" style="font-size:13.5px;margin:0 0 10px">
            Each client links their Telegram to their company once. They can then check balances,
            upcoming payments and maturity dates any time, and receive automatic reminders —
            without calling the broker.
          </p>
          <div class="section-title" style="margin-top:14px">Commands</div>
          <div class="rows">
            ${HELP.map(([c, d]) => `
              <div class="row-link" style="cursor:default">
                <span class="row-main">
                  <span class="row-title"><code>${escapeHtml(c)}</code></span>
                  <span class="row-meta">${escapeHtml(d)}</span>
                </span>
              </div>`).join('')}
          </div>
          <p class="muted" style="font-size:12.5px;margin-top:12px">
            Clients only see their own facilities. Payment amounts are estimates; a real build
            would read each lender's repayment schedule. Nothing is sent to Telegram.
          </p>
        </aside>
      </div>
    </div>`);

  root.querySelector('#who').addEventListener('change', e => navigate(`#/client-bot/${e.target.value}`));

  const chat = mountChat(root, text => clientReply(company.id, text));
  const first = company.contactName.trim().split(/\s+/)[0];
  chat.addIn({ html: `Hi ${escapeHtml(first)} 👋 I'm the LoanDesk bot for ${escapeHtml(company.name)}. Send /help to see what I can do.`, links: [] });
  const alerts = alertsFor(company.id);
  if (alerts.length) chat.addIn({ html: `<b>🔔 Reminder</b><br>${alerts.join('<br>')}`, links: [] });

  return root;
}
