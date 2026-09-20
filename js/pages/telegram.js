// Telegram bot simulator — "pull the data out instantly via a text".
//
// This is a mock chat surface, not a real bot: nothing is sent to Telegram and
// no model is involved. Replies are looked up directly from the mock arrays, so
// the answers stay truthful to whatever is on screen elsewhere in the prototype.

import { el } from '../router.js';
import {
  companies, loans, getCompany, loansForCompany,
  loansMaturingBetween, upcomingOccasions, daysUntil
} from '../data.js';
import { money, date, escapeHtml, inDays } from '../format.js';

const SUGGESTIONS = [
  'loan info of ABC Logistics',
  '/client Sunrise Marine',
  '/maturing 30',
  '/birthdays',
  '/help'
];

const HELP = [
  ['/loan &lt;company&gt;', 'all facilities for a client'],
  ['/client &lt;company&gt;', 'company profile, contact and directors'],
  ['/maturing [days]', 'facilities maturing in the next N days (default 30)'],
  ['/birthdays', 'director birthdays and anniversaries in the next 30 days'],
  ['/help', 'this list']
];

/* ---------------- command handling ---------------- */

/** Loose company lookup — ignores slashes, "pte ltd" and case. */
function findCompany(query) {
  const q = normalise(query);
  if (!q) return null;
  return companies.find(c => normalise(c.name) === q)
    || companies.find(c => normalise(c.name).startsWith(q))
    || companies.find(c => normalise(c.name).includes(q))
    || companies.find(c => c.uen.toLowerCase() === query.trim().toLowerCase())
    || null;
}

function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\b(pte|ltd|limited|llp|group|holdings)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse a message into a command + argument. Accepts both slash commands
 * ("/loan ABC") and plain phrasing ("loan info of ABC").
 */
function parse(input) {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (/^\/?help\b/.test(lower)) return { cmd: 'help', arg: '' };
  if (/^\/?(birthday|birthdays|occasion|occasions|wishes)\b/.test(lower)) return { cmd: 'birthdays', arg: '' };
  if (/^\/?(maturing|maturity|due)\b/.test(lower)) {
    const days = (lower.match(/(\d+)/) || [])[1];
    return { cmd: 'maturing', arg: days ? Number(days) : 30 };
  }
  const loanMatch = lower.match(/^\/?(?:loan|loans|facility|facilities)\b(?:\s+info)?(?:\s+(?:of|for))?\s*(.*)$/);
  if (loanMatch) return { cmd: 'loan', arg: raw.slice(raw.length - loanMatch[1].length) };

  const clientMatch = lower.match(/^\/?(?:client|company|profile|info)\b(?:\s+(?:of|for|on))?\s*(.*)$/);
  if (clientMatch) return { cmd: 'client', arg: raw.slice(raw.length - clientMatch[1].length) };

  // Bare text: treat it as a company name and show the loan summary.
  return { cmd: 'loan', arg: raw };
}

export function reply(input) {
  const { cmd, arg } = parse(input);

  if (cmd === 'help') {
    return {
      html: `<b>Commands</b><br>${HELP.map(([c, d]) => `${c} — ${d}`).join('<br>')}`
        + `<br><br><span class="dim">Plain phrasing works too, e.g. “loan info of ABC Logistics”.</span>`,
      links: []
    };
  }

  if (cmd === 'maturing') {
    const days = arg;
    const list = loansMaturingBetween(0, days);
    if (!list.length) return { html: `Nothing maturing in the next ${days} days. 👍`, links: [] };
    const total = list.reduce((s, l) => s + l.outstanding, 0);
    return {
      html: `<b>Maturing in the next ${days} days — ${list.length} ${list.length === 1 ? 'facility' : 'facilities'}</b><br>`
        + list.map(l => {
          const c = getCompany(l.companyId);
          return `• ${escapeHtml(c.name)}<br>&nbsp;&nbsp;${escapeHtml(l.lender)} ${escapeHtml(l.type)} — ${money(l.outstanding)} outstanding<br>&nbsp;&nbsp;<span class="dim">matures ${date(l.maturityDate)} (${inDays(daysUntil(l.maturityDate))})</span>`;
        }).join('<br>')
        + `<br><br>Total outstanding: <b>${money(total)}</b>`,
      links: list.slice(0, 4).map(l => ({ label: getCompany(l.companyId).name, href: `#/loans/${l.id}` }))
    };
  }

  if (cmd === 'birthdays') {
    const list = upcomingOccasions(30);
    if (!list.length) return { html: 'No birthdays or anniversaries in the next 30 days.', links: [] };
    return {
      html: `<b>Next 30 days — ${list.length} occasions</b><br>`
        + list.map(o => `${o.icon} ${escapeHtml(o.title)}<br>&nbsp;&nbsp;<span class="dim">${escapeHtml(o.subtitle)} · ${date(o.date)} (${inDays(o.inDays)})</span>`).join('<br>'),
      links: [{ label: 'Open Special Occasions', href: '#/occasions' }]
    };
  }

  const company = findCompany(arg);
  if (!company) {
    return {
      html: arg.trim()
        ? `I couldn't find a client matching “${escapeHtml(arg.trim())}”.<br><br><span class="dim">Try one of: ${companies.slice(0, 3).map(c => escapeHtml(c.name)).join(', ')}… or send /help</span>`
        : `Which client? Try <b>loan info of ABC Logistics</b> or send /help.`,
      links: []
    };
  }

  if (cmd === 'client') {
    return {
      html: `<b>${escapeHtml(company.name)}</b><br>`
        + `UEN ${escapeHtml(company.uen)} · ${escapeHtml(company.status)}<br>`
        + `${escapeHtml(company.industry)}<br>`
        + `Incorporated ${date(company.incorporationDate)}<br><br>`
        + `<b>Contact</b><br>${escapeHtml(company.contactName)} (${escapeHtml(company.contactRole)})<br>${escapeHtml(company.contactPhone)}<br>${escapeHtml(company.contactEmail)}<br><br>`
        + `<b>Directors</b><br>`
        + company.directors.map(d => `• ${escapeHtml(d.name)} — 🎂 ${date(d.birthday)}`).join('<br>')
        + `<br><br><span class="dim">${escapeHtml(company.notes)}</span>`,
      links: [{ label: 'Open client in CRM', href: `#/clients/${company.id}` }]
    };
  }

  // cmd === 'loan'
  const list = loansForCompany(company.id);
  if (!list.length) {
    return {
      html: `<b>${escapeHtml(company.name)}</b><br>No facilities on record.`,
      links: [{ label: 'Open client in CRM', href: `#/clients/${company.id}` }]
    };
  }
  const active = list.filter(l => l.status === 'Active' || l.status === 'Approved');
  const outstanding = list.reduce((s, l) => s + l.outstanding, 0);

  return {
    html: `<b>${escapeHtml(company.name)}</b><br>`
      + `<span class="dim">${list.length} facilities · ${active.length} active · ${money(outstanding)} outstanding</span><br><br>`
      + list.map(l =>
        `• <b>${escapeHtml(l.lender)}</b> — ${escapeHtml(l.type)}<br>`
        + `&nbsp;&nbsp;${money(l.amountApproved)} approved · ${money(l.outstanding)} outstanding<br>`
        + `&nbsp;&nbsp;${l.interestRate}% p.a. · ${escapeHtml(l.repaymentFrequency)} · ${escapeHtml(l.status)}<br>`
        + `&nbsp;&nbsp;<span class="dim">matures ${date(l.maturityDate)}${Number.isFinite(daysUntil(l.maturityDate)) ? ` (${inDays(daysUntil(l.maturityDate))})` : ''}</span>`
      ).join('<br><br>'),
    links: [
      { label: 'Open client in CRM', href: `#/clients/${company.id}` },
      ...list.slice(0, 3).map(l => ({ label: `${l.lender} ${l.type}`, href: `#/loans/${l.id}` }))
    ]
  };
}

/* ---------------- page ---------------- */

export function telegram() {
  const root = el(`
    <div>
      <div class="page-head">
        <div>
          <h1>Instant Lookup</h1>
          <div class="sub">Simulated Telegram bot — text a command, get the client's data back</div>
        </div>
      </div>

      <div class="tg-layout">
        <div class="tg-phone">
          <div class="tg-head">
            <span class="tg-avatar">LD</span>
            <span>
              <span class="tg-title">LoanDesk Bot</span>
              <span class="tg-status">online · mock</span>
            </span>
          </div>
          <div class="tg-log" id="log"></div>
          <div class="tg-chips" id="chips">
            ${SUGGESTIONS.map(s => `<button class="chip" data-send="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
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
            The broker texts the bot from their phone and gets the client's position back
            in seconds — no laptop, no logging in. Replies below are read straight from the
            same mock records the rest of the prototype uses.
          </p>
          <div class="section-title" style="margin-top:14px">Commands</div>
          <div class="rows">
            ${HELP.map(([c, d]) => `
              <div class="row-link" style="cursor:default">
                <span class="row-main">
                  <span class="row-title"><code>${c}</code></span>
                  <span class="row-meta">${escapeHtml(d)}</span>
                </span>
              </div>`).join('')}
          </div>
          <p class="muted" style="font-size:12.5px;margin-top:12px">
            Nothing is sent to Telegram. A real build would run a bot webhook against the
            same data, with the broker's chat ID bound to their CRM account.
          </p>
        </aside>
      </div>
    </div>`);

  const log = root.querySelector('#log');
  const form = root.querySelector('#compose');
  const input = root.querySelector('#msg');

  function scroll() {
    log.scrollTop = log.scrollHeight;
  }

  function addOut(text) {
    const div = document.createElement('div');
    div.className = 'bub out';
    div.innerHTML = `${escapeHtml(text)}<span class="tick">✓✓</span>`;
    log.appendChild(div);
    scroll();
  }

  function addIn({ html, links }) {
    const div = document.createElement('div');
    div.className = 'bub in';
    div.innerHTML = html + (links.length
      ? `<span class="bub-links">${links.map(l => `<a href="${l.href}">${escapeHtml(l.label)} →</a>`).join('')}</span>`
      : '');
    log.appendChild(div);
    scroll();
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'bub in typing';
    div.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(div);
    scroll();
    return div;
  }

  function send(text) {
    if (!text.trim()) return;
    addOut(text);
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addIn(reply(text));
    }, 450);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    send(input.value);
    input.value = '';
    input.focus();
  });

  root.querySelector('#chips').addEventListener('click', e => {
    const btn = e.target.closest('[data-send]');
    if (btn) send(btn.dataset.send);
  });

  // Opening exchange so the screen is never empty.
  addIn({ html: 'Hi Ellice 👋 Send me a client name, or /help for the command list.', links: [] });
  send('loan info of ABC Logistics');

  return root;
}
