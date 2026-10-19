// Shared chat plumbing for the Telegram simulators (broker lookup + client bot).
// Expects the markup used by both pages: #log, #compose, #msg and #chips inside `root`.

import { escapeHtml } from './format.js';

export function mountChat(root, replyFn) {
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

  function addIn({ html, links = [] }) {
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
      addIn(replyFn(text));
    }, 450);
  }

  function clear() {
    log.innerHTML = '';
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

  return { send, addIn, clear };
}
