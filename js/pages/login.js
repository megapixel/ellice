import { el, navigate } from '../router.js';
import { signIn, clientAccounts, BROKER_ACCOUNT, DEMO_PASSWORD } from '../auth.js';
import { escapeHtml } from '../format.js';

export function login() {
  let role = 'client';

  const root = el(`
    <div class="login-wrap">
      <div class="login-card card">
        <div class="brand"><span class="brand-mark">LD</span><span class="brand-name">LoanDesk</span></div>
        <h1>Sign in</h1>
        <div class="muted" style="font-size:14px;margin-bottom:14px">View your loans, payments and maturity dates.</div>

        <div class="switch" id="role" role="tablist">
          <button type="button" class="on" data-role="client">Client</button>
          <button type="button" data-role="broker">Broker</button>
        </div>

        <form id="login-form" class="ff" autocomplete="off" style="margin-top:14px">
          <label>Email<input id="email" type="email" required autocomplete="username"></label>
          <label>Password<input id="password" type="password" required autocomplete="current-password"></label>
          <div id="login-error" class="login-error" role="alert" hidden></div>
          <button class="primary" type="submit" style="width:100%">Sign in</button>
        </form>

        <div class="section-title" style="margin-top:22px">Demo accounts <span class="muted" style="font-weight:400">· password <code>${DEMO_PASSWORD}</code></span></div>
        <div class="rows" id="demo"></div>
        <p class="muted" style="font-size:12px;margin:12px 0 0">Prototype only — no real authentication. Clients see only their own company.</p>
      </div>
    </div>`);

  const email = root.querySelector('#email');
  const password = root.querySelector('#password');
  const error = root.querySelector('#login-error');
  const demo = root.querySelector('#demo');

  function renderDemo() {
    const accounts = role === 'broker'
      ? [{ email: BROKER_ACCOUNT.email, title: BROKER_ACCOUNT.name, meta: 'Broker · full CRM' }]
      : clientAccounts().map(a => ({ email: a.email, title: a.company, meta: `${a.name} · ${a.email}` }));
    demo.innerHTML = accounts.map(a => `
      <button type="button" class="row-link demo-row" data-email="${escapeHtml(a.email)}">
        <span class="row-main">
          <span class="row-title">${escapeHtml(a.title)}</span>
          <span class="row-meta">${escapeHtml(a.meta)}</span>
        </span>
        <span class="muted">Use →</span>
      </button>`).join('');
  }

  function attempt(addr, pw) {
    const res = signIn(role, addr, pw);
    if (!res.ok) {
      error.textContent = res.error;
      error.hidden = false;
      return;
    }
    navigate(res.user.role === 'client' ? '#/portal' : '#/');
  }

  root.querySelector('#role').addEventListener('click', e => {
    const b = e.target.closest('button[data-role]');
    if (!b) return;
    role = b.dataset.role;
    root.querySelectorAll('#role button').forEach(x => x.classList.toggle('on', x === b));
    error.hidden = true;
    email.value = '';
    password.value = '';
    renderDemo();
  });

  demo.addEventListener('click', e => {
    const b = e.target.closest('[data-email]');
    if (b) attempt(b.dataset.email, DEMO_PASSWORD);
  });

  root.querySelector('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    attempt(email.value, password.value);
  });

  renderDemo();
  return root;
}
