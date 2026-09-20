// Mock "AI" message composer. Every draft below is a hardcoded template filled
// with real mock record data — no model is called anywhere in this prototype.
//
// The draft is editable: the user picks a channel (Email or WhatsApp) and a tone,
// edits the text, then "sends". Edits are kept per channel+tone for the life of
// the modal, so switching back and forth does not discard them.

import { escapeHtml, money, date, firstName, dateNoYear } from './format.js';
import { getCompany } from './data.js';

const root = document.getElementById('modal-root');
const toastEl = document.getElementById('toast');
let toastTimer = null;

export const TONES = ['Friendly', 'Formal', 'Short'];

export function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
}

/* ---------------- draft templates ----------------
   Each builder returns:
   { subject: {tone: string}, email: {tone: string}, whatsapp: {tone: string} }
   Email drafts carry a signature block; WhatsApp drafts stay short and chatty.
------------------------------------------------- */

function clientDrafts(company) {
  const who = firstName(company.contactName);
  return {
    subject: {
      Friendly: `Catching up on ${company.name}'s facilities`,
      Formal: `Review of credit facilities — ${company.name} (UEN ${company.uen})`,
      Short: `Quick catch-up?`
    },
    email: {
      Friendly: `Hi ${who},\n\nHope things are going well at ${company.name}!\n\nI was reviewing your facilities and thought it would be a good time for a quick catch-up — happy to walk you through what's maturing and where the current rates are sitting.\n\nWould sometime next week suit? Just let me know a day that works.\n\nBest,\nEllice Au\nLoanDesk Capital Advisory`,
      Formal: `Dear ${company.contactName},\n\nI am writing in connection with the credit facilities held by ${company.name} (UEN ${company.uen}). We would welcome the opportunity to review your current arrangements and to discuss options that may better suit your working capital requirements.\n\nPlease let me know a convenient time for a discussion.\n\nKind regards,\nEllice Au\nLoanDesk Capital Advisory`,
      Short: `Hi ${who},\n\nFree for a quick call this week? I'd like to run through ${company.name}'s facilities and a couple of options.\n\nThanks,\nEllice`
    },
    whatsapp: {
      Friendly: `Hi ${who}! Hope all's well at ${company.name} 😊 I was looking through your facilities — good time for a quick catch-up on what's maturing and where rates are now. Free sometime next week?`,
      Formal: `Good morning ${company.contactName}, this is Ellice from LoanDesk. We'd like to review the facilities held by ${company.name} and discuss options better suited to your working capital needs. May I arrange a call at your convenience?`,
      Short: `Hi ${who} — free for a quick call this week on ${company.name}'s facilities? A couple of options worth a look.`
    }
  };
}

function loanDrafts(loan, company) {
  const who = firstName(company.contactName);
  const amount = money(loan.amountApproved);
  const outstanding = money(loan.outstanding);
  const mature = date(loan.maturityDate);
  const kind = loan.type.toLowerCase();
  return {
    subject: {
      Friendly: `${company.name} — ${loan.lender} facility matures ${mature}`,
      Formal: `Upcoming maturity of ${loan.type} facility — ${company.name}`,
      Short: `${loan.lender} facility matures ${mature}`
    },
    email: {
      Friendly: `Hi ${who},\n\nHope you're doing well.\n\nJust a heads-up that ${company.name}'s ${loan.lender} ${kind} facility (${amount}) matures on ${mature}, with ${outstanding} outstanding.\n\nHappy to review a refinance or top-up before then — shall I put together a few options for you to compare?\n\nBest,\nEllice Au\nLoanDesk Capital Advisory`,
      Formal: `Dear ${company.contactName},\n\nWe note that the ${kind} facility granted to ${company.name} by ${loan.lender}, in the approved amount of ${amount}, is due to mature on ${mature}. The outstanding balance currently stands at ${outstanding}, at an interest rate of ${loan.interestRate}% per annum.\n\nWe would be pleased to prepare refinancing options for your consideration ahead of the maturity date.\n\nKind regards,\nEllice Au\nLoanDesk Capital Advisory`,
      Short: `Hi ${who},\n\nYour ${loan.lender} facility (${amount}) matures on ${mature}, with ${outstanding} still outstanding.\n\nWant me to look at refinancing options?\n\nEllice`
    },
    whatsapp: {
      Friendly: `Hi ${who}, hope you're well! Heads-up that ${company.name}'s ${loan.lender} ${kind} facility (${amount}) matures on ${mature} — ${outstanding} outstanding. Happy to look at a refinance or top-up before then. Shall I pull together a few options?`,
      Formal: `Dear ${company.contactName}, this is Ellice from LoanDesk. The ${kind} facility with ${loan.lender} (${amount}) matures on ${mature}, with ${outstanding} outstanding at ${loan.interestRate}% p.a. We would be pleased to prepare refinancing options ahead of maturity.`,
      Short: `Hi ${who} — ${loan.lender} facility (${amount}) matures ${mature}, ${outstanding} outstanding. Want me to check refinancing options?`
    }
  };
}

function occasionDrafts(occasion, company) {
  if (occasion.kind === 'birthday') {
    const who = firstName(occasion.title);
    return {
      subject: {
        Friendly: `Happy birthday, ${who}!`,
        Formal: `Birthday wishes from LoanDesk Capital Advisory`,
        Short: `Happy birthday!`
      },
      email: {
        Friendly: `Happy birthday, ${who}! 🎉\n\nWishing you a great day and an even better year ahead. Always a pleasure working with the team at ${company.name} — here's to more good things in the months to come.\n\nBest,\nEllice Au\nLoanDesk Capital Advisory`,
        Formal: `Dear ${occasion.title},\n\nOn behalf of LoanDesk Capital Advisory, please accept our warmest wishes on your birthday. We value our working relationship with ${company.name} and look forward to continuing to support your financing needs.\n\nKind regards,\nEllice Au\nLoanDesk Capital Advisory`,
        Short: `Happy birthday, ${who}! 🎂 Wishing you a great one.\n\nEllice`
      },
      whatsapp: {
        Friendly: `Happy birthday ${who}! 🎉 Wishing you a great day and an even better year ahead. Always a pleasure working with the team at ${company.name}!`,
        Formal: `Dear ${occasion.title}, on behalf of LoanDesk Capital Advisory, our warmest wishes on your birthday. We value our relationship with ${company.name} and look forward to supporting your financing needs.`,
        Short: `Happy birthday ${who}! 🎂 Have a great one — Ellice`
      }
    };
  }

  const who = firstName(company.contactName);
  const years = occasion.years;
  return {
    subject: {
      Friendly: `Congratulations on ${years} years, ${company.name}!`,
      Formal: `${years}${ord(years)} anniversary of incorporation — ${company.name}`,
      Short: `Congrats on ${years} years!`
    },
    email: {
      Friendly: `Hi ${who},\n\nCongratulations to the whole ${company.name} team on ${years} years! 🎉\n\n${dateNoYear(occasion.date)} marks the anniversary of incorporation, and it's been great watching the business grow. Wishing you an excellent year ahead.\n\nBest,\nEllice Au\nLoanDesk Capital Advisory`,
      Formal: `Dear ${company.contactName},\n\nOn behalf of LoanDesk Capital Advisory, congratulations to ${company.name} on its ${years}${ord(years)} anniversary of incorporation. We thank you for your continued confidence and look forward to supporting your growth in the year ahead.\n\nKind regards,\nEllice Au\nLoanDesk Capital Advisory`,
      Short: `Hi ${who},\n\nCongratulations to ${company.name} on ${years} years! Wishing the team a great year ahead.\n\nEllice`
    },
    whatsapp: {
      Friendly: `Hi ${who} — congratulations to the whole ${company.name} team on ${years} years! 🎉 Great watching the business grow. Wishing you an excellent year ahead!`,
      Formal: `Dear ${company.contactName}, congratulations to ${company.name} on its ${years}${ord(years)} anniversary of incorporation. Thank you for your continued confidence — LoanDesk Capital Advisory.`,
      Short: `Congrats to ${company.name} on ${years} years! 🎉 Wishing the team a great year ahead — Ellice`
    }
  };
}

function ord(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/* ---------------- modal ---------------- */

/**
 * @param {{kind:'client'|'loan'|'occasion', company:object, loan?:object, occasion?:object}} ctx
 */
export function openMessageModal(ctx) {
  const company = ctx.company;
  let drafts, title, recipient;

  if (ctx.kind === 'loan') {
    drafts = loanDrafts(ctx.loan, company);
    title = 'Generate Message';
    recipient = {
      name: company.contactName,
      email: company.contactEmail,
      phone: company.contactPhone,
      context: `re: ${ctx.loan.lender} ${ctx.loan.type}`
    };
  } else if (ctx.kind === 'occasion') {
    drafts = occasionDrafts(ctx.occasion, company);
    title = 'Generate Wish';
    const director = ctx.occasion.kind === 'birthday'
      ? company.directors.find(d => d.name === ctx.occasion.title)
      : null;
    recipient = {
      name: director ? director.name : company.contactName,
      email: director ? director.email : company.contactEmail,
      phone: director ? director.phone : company.contactPhone,
      context: company.name
    };
  } else {
    drafts = clientDrafts(company);
    title = 'Generate Message';
    recipient = {
      name: company.contactName,
      email: company.contactEmail,
      phone: company.contactPhone,
      context: company.name
    };
  }

  let channel = 'email';
  let tone = 'Friendly';

  // User edits, keyed "channel|tone" so switching does not lose work.
  const edits = {};
  const key = () => `${channel}|${tone}`;
  const originalBody = () => drafts[channel][tone];
  const originalSubject = () => drafts.subject[tone];

  root.innerHTML = `
    <div class="backdrop" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal">
        <header>
          <h3>${escapeHtml(title)}</h3>
          <span class="tag">✨ AI-drafted · placeholder</span>
          <button class="x" data-close aria-label="Close">✕</button>
        </header>

        <div class="body">
          <div class="switch" role="tablist" aria-label="Channel">
            <button class="chan on" data-chan="email">✉️ Email</button>
            <button class="chan" data-chan="whatsapp">💬 WhatsApp</button>
          </div>

          <div class="to" id="to-line"></div>

          <div class="field-row">
            <span class="k">Tone</span>
            <div class="tones">
              ${TONES.map(t => `<button class="small tone ${t === tone ? 'on' : ''}" data-tone="${t}">${t}</button>`).join('')}
            </div>
            <button class="small" id="reset" title="Discard your edits and restore the generated draft">Reset draft</button>
          </div>

          <div id="subject-wrap">
            <label class="k" for="subject">Subject</label>
            <input type="text" id="subject" class="subject">
          </div>

          <label class="k" for="draft-text">Message <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:400">— edit before sending</span></label>
          <textarea id="draft-text" class="draft" spellcheck="true"></textarea>
          <div class="draft-foot"><span id="charcount"></span></div>
        </div>

        <footer>
          <button class="primary" data-action="send">Send</button>
          <button data-action="copy">Copy</button>
          <button data-action="open">Open in WhatsApp</button>
          <span class="note">Nothing is sent — prototype</span>
        </footer>
      </div>
    </div>`;

  const backdrop = root.querySelector('.backdrop');
  const bodyEl = root.querySelector('#draft-text');
  const subjectEl = root.querySelector('#subject');
  const subjectWrap = root.querySelector('#subject-wrap');
  const toLine = root.querySelector('#to-line');
  const openBtn = root.querySelector('[data-action="open"]');
  const charcount = root.querySelector('#charcount');

  function load() {
    const saved = edits[key()] || {};
    bodyEl.value = saved.body ?? originalBody();
    subjectEl.value = saved.subject ?? originalSubject();

    const isEmail = channel === 'email';
    subjectWrap.hidden = !isEmail;
    openBtn.textContent = isEmail ? 'Open in email client' : 'Open in WhatsApp';
    toLine.innerHTML = isEmail
      ? `To: <strong>${escapeHtml(recipient.name)}</strong> &lt;${escapeHtml(recipient.email)}&gt;<span class="muted"> · ${escapeHtml(recipient.context)}</span>`
      : `To: <strong>${escapeHtml(recipient.name)}</strong> ${escapeHtml(recipient.phone)}<span class="muted"> · ${escapeHtml(recipient.context)}</span>`;

    updateCount();
  }

  function stash() {
    edits[key()] = { body: bodyEl.value, subject: subjectEl.value };
  }

  function updateCount() {
    const n = bodyEl.value.length;
    const edited = edits[key()] && (edits[key()].body !== originalBody() || edits[key()].subject !== originalSubject());
    charcount.textContent = `${n} characters${edited ? ' · edited' : ''}`;
  }

  bodyEl.addEventListener('input', () => { stash(); updateCount(); });
  subjectEl.addEventListener('input', () => { stash(); updateCount(); });

  root.querySelectorAll('.chan').forEach(btn => {
    btn.addEventListener('click', () => {
      stash();
      channel = btn.dataset.chan;
      root.querySelectorAll('.chan').forEach(b => b.classList.toggle('on', b === btn));
      load();
    });
  });

  root.querySelectorAll('.tone').forEach(btn => {
    btn.addEventListener('click', () => {
      stash();
      tone = btn.dataset.tone;
      root.querySelectorAll('.tone').forEach(b => b.classList.toggle('on', b === btn));
      load();
    });
  });

  root.querySelector('#reset').addEventListener('click', () => {
    delete edits[key()];
    load();
    toast('Draft restored');
  });

  root.querySelector('[data-action="send"]').addEventListener('click', () => {
    toast(channel === 'email'
      ? 'Email sending is not wired up in this prototype'
      : 'WhatsApp sending is not wired up in this prototype');
  });
  root.querySelector('[data-action="copy"]').addEventListener('click', () => {
    toast('Copy is not wired up in this prototype');
  });
  openBtn.addEventListener('click', () => {
    toast(channel === 'email'
      ? 'Email hand-off is not wired up in this prototype'
      : 'WhatsApp hand-off is not wired up in this prototype');
  });

  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', onKey);

  load();
  bodyEl.focus();
}

function onKey(e) {
  // Esc closes, unless the user is mid-edit in a field (first Esc blurs instead).
  if (e.key !== 'Escape') return;
  const active = document.activeElement;
  if (active && (active.id === 'draft-text' || active.id === 'subject')) {
    active.blur();
    return;
  }
  close();
}

export function close() {
  root.innerHTML = '';
  document.removeEventListener('keydown', onKey);
}

/** Convenience used by pages that only hold ids. */
export function openForCompanyId(companyId) {
  const company = getCompany(companyId);
  if (company) openMessageModal({ kind: 'client', company });
}
