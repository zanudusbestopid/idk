import { TOKEN_LIST } from '../../shared/tokens.js';
import { characterSvg } from '../sprites.js';
import { h, clear } from '../dom.js';
import { loadProfile, saveProfile } from '../store.js';
import { THEME } from '../theme.js';

export interface HomeHandlers {
  onCreate(name: string, token: string): void;
  onJoin(code: string, name: string, token: string): void;
  /** Called with the current choices whenever the token pick changes, so the scene behind the menu can show it. */
  onPreview?(name: string, token: string): void;
}

/** Markup for a token's character (pixel sprite, idle frame). */
export function tokenSvg(id: string): string {
  return characterSvg(id);
}

const idx = (i: number) => ({ '--i': String(i) } as unknown as Record<string, string>);

/** Home screen: hero title on the left, the create/join card on the right, both floating over the title scene. */
export function renderHome(root: HTMLElement, handlers: HomeHandlers, prefillCode = ''): void {
  clear(root);
  const profile = loadProfile();
  let token = TOKEN_LIST.some((t) => t.id === profile.token) ? profile.token : 'hat';

  const nameInput = h('input', { class: 'input', placeholder: 'Your name', maxLength: 16, value: profile.name, autocomplete: 'off', id: 'home-name' }) as HTMLInputElement;
  const codeInput = h('input', { class: 'input input--code', placeholder: 'CODE', maxLength: 4, value: prefillCode, autocomplete: 'off', spellcheck: false, id: 'home-code' }) as HTMLInputElement;

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
    handlers.onPreview?.(nameInput.value.trim(), token);
  }
  select(token);

  function nameOrDefault(): string {
    const n = nameInput.value.trim() || 'Player';
    saveProfile(n, token);
    return n;
  }

  const createBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', id: 'home-create', onClick: () => handlers.onCreate(nameOrDefault(), token) }, 'Create a room');
  const joinBtn = h('button', { class: 'btn btn--blue', type: 'button', id: 'home-join', onClick: () => join() }, 'Join');
  function join(): void {
    const code = codeInput.value.trim().toUpperCase();
    if (code.length !== 4) { codeInput.focus(); codeInput.classList.add('shake'); return; }
    handlers.onJoin(code, nameOrDefault(), token);
  }
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });

  const hero = h('div', { class: 'title-hero' },
    h('h1', { class: 'title-art' }, h('span', null, THEME.title[0]), h('span', null, THEME.title[1])),
    h('p', { class: 'tagline hand' }, THEME.taglineOnline));
  const card = h('div', { class: 'setup-card paper home' },
    h('div', { class: 'field', style: idx(0) }, h('label', { for: 'home-name' }, 'Your name'), nameInput),
    h('div', { class: 'field', style: idx(1) }, h('label', null, 'Pick a token'), grid),
    h('div', { class: 'field field--start', style: idx(2) }, createBtn),
    h('div', { class: 'field', style: idx(3) },
      h('div', { class: 'or' }, '— or join a friend —'),
      h('div', { class: 'row' }, h('div', { class: 'field' }, h('label', { for: 'home-code' }, 'Room code'), codeInput), joinBtn)),
  );
  root.append(hero, card);
  if (prefillCode) nameInput.focus(); else nameInput.focus();
}
