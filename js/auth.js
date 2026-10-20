// Mock sign-in for the prototype. There is no server: accounts are derived from the
// mock data (every client contact and director email is a valid client login) and
// every account uses the shared demo password. The session lives in sessionStorage
// so a refresh keeps you signed in, and clears when the tab closes.

import { companies } from './data.js';

const KEY = 'loandesk.session';

export const DEMO_PASSWORD = 'demo';
export const BROKER_ACCOUNT = { email: 'ellice@loandesk.example', name: 'Ellice Au' };

let session = load();

function load() {
  try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
}

function persist() {
  try {
    if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
    else sessionStorage.removeItem(KEY);
  } catch { /* storage blocked: session stays in memory only */ }
}

export function currentUser() {
  return session;
}

/** Contact + directors of every company; each is a portal login for that company. */
export function clientAccounts() {
  return companies.map(c => ({
    companyId: c.id,
    company: c.name,
    email: c.contactEmail,
    name: c.contactName
  }));
}

function findClient(email) {
  for (const c of companies) {
    if (c.contactEmail && c.contactEmail.toLowerCase() === email) {
      return { role: 'client', companyId: c.id, name: c.contactName, email: c.contactEmail };
    }
    const d = c.directors.find(x => x.email && x.email.toLowerCase() === email);
    if (d) return { role: 'client', companyId: c.id, name: d.name, email: d.email };
  }
  return null;
}

/** Returns { ok: true, user } or { ok: false, error }. Same error for bad email or password. */
export function signIn(role, email, password) {
  const e = String(email || '').trim().toLowerCase();
  const user = role === 'broker'
    ? (e === BROKER_ACCOUNT.email ? { role: 'broker', name: BROKER_ACCOUNT.name, email: BROKER_ACCOUNT.email } : null)
    : findClient(e);
  if (!user || password !== DEMO_PASSWORD) {
    return { ok: false, error: 'Incorrect email or password.' };
  }
  session = user;
  persist();
  return { ok: true, user };
}

export function signOut() {
  session = null;
  persist();
}

/** Route guard: returns a path to redirect to, or null to allow. */
export function guard(path) {
  const first = path.split('/').filter(Boolean)[0] || '';
  const user = session;
  if (!user) return first === 'login' ? null : '/login';
  if (first === 'login') return user.role === 'client' ? '/portal' : '/';
  if (user.role === 'client' && first !== 'portal') return '/portal';
  if (user.role === 'broker' && first === 'portal') return '/';
  return null;
}
