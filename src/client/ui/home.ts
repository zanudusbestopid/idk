import { TOKENS } from '../art/tokens.js';
import { TOKEN_LIST } from '../../shared/tokens.js';
import { h, clear } from '../dom.js';
import { loadProfile, saveProfile } from '../store.js';

export interface HomeHandlers {
  onCreate(name: string, token: string): void;
  onJoin(code: string, name: string, token: string): void;
}

export function tokenSvg(id: string): string {
  return TOKENS.find((t) => t.id === id)?.svg ?? TOKENS[0].svg;
}

export function renderHome(root: HTMLElement, handlers: HomeHandlers, prefillCode = ''): void {
  clear(root);
  const profile = loadProfile();
  let token = TOKEN_LIST.some((t) => t.id === profile.token) ? profile.token : 'hat';

  const nameInput = h('input', { class: 'input', placeholder: 'Your name', maxLength: 16, value: profile.name, autocomplete: 'off' }) as HTMLInputElement;
  const codeInput = h('input', { class: 'input input--code', placeholder: 'CODE', maxLength: 4, value: prefillCode, autocomplete: 'off', spellcheck: false }) as HTMLInputElement;

  const grid = h('div', { class: 'token-grid' });
  const picks = new Map<string, HTMLElement>();
  for (const t of TOKEN_LIST) {
    const el = h('button', { class: 'token-pick', type: 'button', title: t.name, onClick: () => select(t.id) },
      h('span', { html: tokenSvg(t.id) }), h('span', { class: 'name' }, t.name));
    picks.set(t.id, el);
    grid.appendChild(el);
  }
  function select(id: string): void {
    token = id;
    for (const [k, el] of picks) el.classList.toggle('is-selected', k === id);
  }
  select(token);

  function nameOrDefault(): string {
    const n = nameInput.value.trim() || 'Player';
    saveProfile(n, token);
    return n;
  }

  const createBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', onClick: () => handlers.onCreate(nameOrDefault(), token) }, 'Create a room');
  const joinBtn = h('button', { class: 'btn btn--blue', type: 'button', onClick: () => join() }, 'Join');
  function join(): void {
    const code = codeInput.value.trim().toUpperCase();
    if (code.length !== 4) { codeInput.focus(); codeInput.classList.add('shake'); return; }
    handlers.onJoin(code, nameOrDefault(), token);
  }
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });

  const card = h('div', { class: 'home paper paper--tilt-l' },
    h('h1', { class: 'title-art' }, h('span', null, 'PAPER'), h('span', null, 'TYCOON')),
    h('p', { class: 'subtitle hand' }, 'Buy streets, build houses, bankrupt your friends. All out of paper.'),
    h('div', { class: 'field' }, h('label', null, 'Your name'), nameInput),
    h('div', { class: 'field' }, h('label', null, 'Pick a token'), grid),
    h('div', { style: { textAlign: 'center', marginTop: '6px' } }, createBtn),
    h('div', { class: 'or' }, '— or join a friend —'),
    h('div', { class: 'row' }, h('div', { class: 'field', style: { marginBottom: '0' } }, h('label', null, 'Room code'), codeInput), joinBtn),
  );
  root.appendChild(h('div', { class: 'screen-center' }, card));
  if (prefillCode) nameInput.focus(); else nameInput.focus();
}
