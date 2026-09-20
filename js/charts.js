// Small chart builders for the dashboard. Plain HTML/CSS marks — no chart library.
//
// Colour rules follow the house data-viz method:
//  • magnitude (one series) = one hue, blue, never a ramp keyed to bar length
//  • state = the reserved status palette, always with a labelled legend
//  • text never wears the data colour; gridlines are solid hairlines
// Colours live in css/app.css under .viz-root, with selected dark-mode steps.

import { escapeHtml } from './format.js';

/** Nice round ceiling for an axis, e.g. 182,400 → 200,000. */
function axisMax(values) {
  const max = Math.max(1, ...values);
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / (mag / 2)) * (mag / 2);
}

function tip(text) {
  return `data-tip="${escapeHtml(text)}"`;
}

/**
 * Column chart — one series, one hue. Ordered buckets along x.
 * @param {{label:string, value:number, tipText:string, href?:string}[]} bars
 * @param {(n:number)=>string} fmt   value formatter for caps and axis
 */
export function columns(bars, fmt) {
  const max = axisMax(bars.map(b => b.value));
  const ticks = [max, max / 2, 0];

  return `
    <div class="viz-root">
      <div class="vplot">
        <div class="vaxis">${ticks.map(t => `<span>${fmt(t)}</span>`).join('')}</div>
        <div class="vgrid">${ticks.map(() => '<i></i>').join('')}</div>
        <div class="vbars">
          ${bars.map(b => {
            const h = max ? (b.value / max) * 100 : 0;
            const inner = `
              <span class="vtrack">
                <span class="vcap" style="bottom:${h.toFixed(1)}%">${b.value ? fmt(b.value) : '—'}</span>
                <i style="height:${h.toFixed(1)}%"></i>
              </span>
              <span class="vlab">${escapeHtml(b.label)}</span>`;
            return b.href
              ? `<a class="vbar" href="${b.href}" ${tip(b.tipText)}>${inner}</a>`
              : `<div class="vbar" ${tip(b.tipText)}>${inner}</div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

/**
 * Horizontal bars — one series, one hue, value at the tip.
 * @param {{label:string, value:number, tipText:string}[]} rows
 */
export function bars(rows, fmt) {
  const max = axisMax(rows.map(r => r.value));
  return `
    <div class="viz-root hbars">
      ${rows.map(r => `
        <div class="hbar" ${tip(r.tipText)}>
          <span class="hlab">${escapeHtml(r.label)}</span>
          <span class="htrack"><i style="width:${((r.value / max) * 100).toFixed(1)}%"></i></span>
          <span class="hval">${fmt(r.value)}</span>
        </div>`).join('')}
    </div>`;
}

/**
 * One stacked bar for a part-to-whole split by state, plus a labelled legend.
 * Segments carry the reserved status colours, so the legend's label + value is
 * what conveys meaning — never the colour alone.
 * @param {{label:string, value:number, count:number, tone:string}[]} segments
 */
export function stackedStatus(segments, fmt) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const shown = segments.filter(s => s.value > 0);

  return `
    <div class="viz-root">
      <div class="stack">
        ${shown.map(s => `
          <i class="seg tone-${s.tone}" style="flex:${s.value}"
             ${tip(`${s.label}: ${fmt(s.value)} across ${s.count} ${s.count === 1 ? 'facility' : 'facilities'}`)}></i>`).join('')}
      </div>
      <div class="stack-legend">
        ${segments.map(s => `
          <span class="lg">
            <i class="sw tone-${s.tone}"></i>
            <span class="lg-t">${escapeHtml(s.label)}</span>
            <span class="lg-v">${fmt(s.value)} <span class="muted">· ${s.count}</span></span>
          </span>`).join('')}
      </div>
    </div>`;
}

/** Hero figure tile — the number is the chart. */
export function statTile({ label, value, sub, href }) {
  const inner = `
    <span class="st-k">${escapeHtml(label)}</span>
    <span class="st-v">${escapeHtml(value)}</span>
    <span class="st-s">${sub}</span>`;
  return href
    ? `<a class="card stat" href="${href}">${inner}</a>`
    : `<div class="card stat">${inner}</div>`;
}

/* ---------------- shared hover tooltip ---------------- */

let tipEl = null;

/** Attach one delegated tooltip to a rendered page root. */
export function bindTooltips(root) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'viz-tip';
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
  }

  root.addEventListener('mousemove', e => {
    const mark = e.target.closest('[data-tip]');
    if (!mark) { tipEl.hidden = true; return; }
    tipEl.textContent = mark.dataset.tip;
    tipEl.hidden = false;
    const pad = 14;
    const w = tipEl.offsetWidth;
    tipEl.style.left = Math.min(e.clientX + pad, window.innerWidth - w - 8) + 'px';
    tipEl.style.top = (e.clientY + pad) + 'px';
  });

  root.addEventListener('mouseleave', () => { tipEl.hidden = true; });
  window.addEventListener('hashchange', () => { if (tipEl) tipEl.hidden = true; }, { once: true });
}
