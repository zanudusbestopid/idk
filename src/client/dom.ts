// Tiny DOM helpers. No framework: screens build elements once and patch them.
import { THEME } from './theme.js';

type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Record<string, unknown> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v as Record<string, string>)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else (el.style as unknown as Record<string, string>)[sk] = sv;
        }
      }
      else if (k === 'html') el.innerHTML = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v as Record<string, string>);
      else if (k in el && !(k.startsWith('aria') || k.startsWith('data-'))) (el as unknown as Record<string, unknown>)[k] = v;
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function svg(markup: string, cls?: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = cls ?? 'ico';
  wrap.innerHTML = markup;
  return wrap;
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  if (THEME.currency === 'coin') return `${sign}${abs.toLocaleString('en-US')} ${abs === 1 ? 'coin' : 'coins'}`;
  return `${sign}$${abs.toLocaleString('en-US')}`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

let toastHost: HTMLElement | null = null;
export function toast(text: string, kind: 'info' | 'error' = 'info', ms = 2600): void {
  if (!toastHost) { toastHost = h('div', { class: 'toast-host' }); document.body.appendChild(toastHost); }
  const el = h('div', { class: `toast paper paper--flat ${kind === 'error' ? 'toast--error' : ''}` }, text);
  toastHost.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
