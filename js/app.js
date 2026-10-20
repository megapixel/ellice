import { defineRoute, start, currentPath, setGuard, navigate } from './router.js';
import { dashboard } from './pages/dashboard.js';
import { clients } from './pages/clients.js';
import { clientDetail } from './pages/clientDetail.js';
import { loansPage } from './pages/loans.js';
import { loanDetail } from './pages/loanDetail.js';
import { occasions } from './pages/occasions.js';
import { telegram } from './pages/telegram.js';
import { clientBot } from './pages/clientBot.js';
import { login } from './pages/login.js';
import { portal, portalLoan } from './pages/portal.js';
import { currentUser, guard, signOut } from './auth.js';
import { close as closeModal } from './modal.js';
import { escapeHtml } from './format.js';

defineRoute('/login', login);
defineRoute('/portal', portal);
defineRoute('/portal/loans/:id', portalLoan);
defineRoute('/', dashboard);
defineRoute('/clients', clients);
defineRoute('/clients/:id', clientDetail);
defineRoute('/loans', loansPage);
defineRoute('/loans/:id', loanDetail);
defineRoute('/occasions', occasions);
defineRoute('/lookup', telegram);
defineRoute('/client-bot', clientBot);
defineRoute('/client-bot/:id', clientBot);

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

/* ---- sign-in state: login screen, broker CRM, or client portal ---- */
const whoName = document.querySelector('.who-name');
const whoAvatar = document.querySelector('.who .avatar');
const portalWho = document.getElementById('portal-who');

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function applyMode() {
  const user = currentUser();
  document.body.dataset.mode = user ? user.role : 'login';
  if (!user) return;
  if (user.role === 'broker') {
    whoName.textContent = user.name;
    whoAvatar.textContent = initials(user.name);
  } else {
    portalWho.textContent = user.name;
  }
}

function logout() {
  signOut();
  askAnswer.hidden = true;
  navigate('#/login');
}

document.getElementById('signout').addEventListener('click', logout);
document.getElementById('portal-signout').addEventListener('click', logout);

setGuard(guard);

start(document.getElementById('view'), path => {
  applyMode();
  syncNav(path);
  closeModal();
});

syncNav(currentPath());
