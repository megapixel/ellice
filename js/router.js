// Hash-based router. Hash routing keeps deep links working on GitHub Pages
// without any server-side rewrite rules.

const routes = [];
let outlet = null;
let onAfterRender = null;

export function defineRoute(pattern, render) {
  routes.push({ parts: pattern.split('/').filter(Boolean), render });
}

export function start(outletEl, afterRender) {
  outlet = outletEl;
  onAfterRender = afterRender;
  window.addEventListener('hashchange', renderCurrent);
  renderCurrent();
}

export function navigate(hash) {
  if (location.hash === hash) renderCurrent();
  else location.hash = hash;
}

/** Re-render the current route in place (used after a mock record is saved). */
export function refresh() {
  renderCurrent();
}

export function currentPath() {
  return (location.hash || '#/').slice(1);
}

/** Build a detached element from an HTML string so pages can attach listeners. */
export function el(htmlString) {
  const wrap = document.createElement('div');
  wrap.innerHTML = htmlString.trim();
  return wrap;
}

function match(path) {
  const segs = path.split('/').filter(Boolean);
  for (const route of routes) {
    if (route.parts.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < route.parts.length; i++) {
      const p = route.parts[i];
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segs[i]);
      else if (p !== segs[i]) { ok = false; break; }
    }
    if (ok) return { route, params };
  }
  return null;
}

function renderCurrent() {
  const path = currentPath();
  const found = match(path) || match('/');
  outlet.innerHTML = '';
  const node = found.route.render(found.params);
  if (typeof node === 'string') outlet.innerHTML = node;
  else if (node) outlet.appendChild(node);
  window.scrollTo(0, 0);
  if (onAfterRender) onAfterRender(path);
}
