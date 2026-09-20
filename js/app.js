import { defineRoute, start, currentPath } from './router.js';
import { dashboard } from './pages/dashboard.js';
import { clients } from './pages/clients.js';
import { clientDetail } from './pages/clientDetail.js';
import { loansPage } from './pages/loans.js';
import { loanDetail } from './pages/loanDetail.js';
import { occasions } from './pages/occasions.js';
import { telegram } from './pages/telegram.js';
import { close as closeModal } from './modal.js';
import { escapeHtml } from './format.js';

defineRoute('/', dashboard);
defineRoute('/clients', clients);
defineRoute('/clients/:id', clientDetail);
defineRoute('/loans', loansPage);
defineRoute('/loans/:id', loanDetail);
defineRoute('/occasions', occasions);
defineRoute('/lookup', telegram);

const nav = document.getElementById('nav');

function syncNav(path) {
  const section = path.split('/').filter(Boolean)[0] || 'dashboard';
  nav.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.dataset.match === section);
  });
}

/* ---- header "Ask about a client..." — canned demo answer only ---- */
const askForm = document.getElementById('ask-form');
const askInput = document.getElementById('ask-input');
const askAnswer = document.getElementById('ask-answer');

const CANNED_ANSWER =
  'ABC Logistics Pte Ltd has 2 active facilities totalling S$239,200 outstanding. '
  + 'The earliest maturity is the OCBC working capital line (S$300,000 approved, S$96,000 outstanding) '
  + 'in 26 days. No top-up has been taken in 14 months — worth raising a refinance before maturity.';

askForm.addEventListener('submit', e => {
  e.preventDefault();
  const q = askInput.value.trim() || 'Which clients need attention this month?';
  askAnswer.hidden = false;
  askAnswer.innerHTML = `
    <div class="aa-top">
      <span class="tag">✨ Example answer · not a real query</span>
      <button class="x" id="ask-close" aria-label="Dismiss">✕</button>
    </div>
    <div class="aa-q">You asked: “${escapeHtml(q)}”</div>
    <div style="margin-top:6px">${escapeHtml(CANNED_ANSWER)}</div>`;
  document.getElementById('ask-close').addEventListener('click', () => {
    askAnswer.hidden = true;
    askAnswer.innerHTML = '';
  });
});

start(document.getElementById('view'), path => {
  syncNav(path);
  closeModal();
});

syncNav(currentPath());
