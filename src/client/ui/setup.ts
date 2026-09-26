import { DEFAULT_CONFIG } from '../../engine/engine.js';
import type { GameConfig } from '../../shared/types.js';
import { TOKEN_LIST } from '../../shared/tokens.js';
import { h, clear } from '../dom.js';
import { defaultBots, type SavedGame, type SoloSetup } from '../local.js';
import { loadProfile, saveProfile } from '../store.js';
import { tokenSvg } from './home.js';
import { rulesPanel } from './rules.js';

export interface SetupHandlers {
  onStart(setup: SoloSetup): void;
  onResume(saved: SavedGame): void;
}

export function renderSetup(root: HTMLElement, handlers: SetupHandlers, saved: SavedGame | null, previous?: SoloSetup): void {
  clear(root);
  const profile = loadProfile();
  const setup: SoloSetup = previous
    ? { ...previous, config: { ...previous.config } }
    : { name: profile.name, token: TOKEN_LIST.some((t) => t.id === profile.token) ? profile.token : 'hat', bots: [], config: { ...DEFAULT_CONFIG } };
  let botCount = previous ? previous.bots.length : 3;
  let shuffle = 0;

  const nameInput = h('input', { class: 'input', placeholder: 'Your name', maxLength: 16, value: setup.name, autocomplete: 'off', id: 'setup-name' }) as HTMLInputElement;
  nameInput.addEventListener('input', () => { setup.name = nameInput.value; });

  const tokenGrid = h('div', { class: 'token-grid' });
  const botsEl = h('div', { class: 'bots' });
  const countRow = h('div', { class: 'count-row' });

  function renderTokens(): void {
    clear(tokenGrid);
    for (const t of TOKEN_LIST) {
      tokenGrid.appendChild(h('button', { class: `token-pick ${setup.token === t.id ? 'is-selected' : ''}`, type: 'button', title: t.name, onClick: () => { setup.token = t.id; renderTokens(); renderBots(); } },
        h('span', { html: tokenSvg(t.id) }), h('span', { class: 'name' }, t.name)));
    }
  }
  function renderCount(): void {
    clear(countRow);
    for (let n = 1; n <= 5; n++) {
      countRow.appendChild(h('button', { class: `btn btn--sm ${n === botCount ? 'btn--blue' : ''}`, type: 'button', onClick: () => { botCount = n; renderCount(); renderBots(); } }, String(n)));
    }
    countRow.appendChild(h('button', { class: 'btn btn--sm', type: 'button', title: 'Different opponents', onClick: () => { shuffle++; renderBots(); } }, '🎲 Shuffle'));
  }
  function renderBots(): void {
    setup.bots = defaultBots(botCount, setup.token, shuffle);
    clear(botsEl);
    for (const b of setup.bots) {
      botsEl.appendChild(h('div', { class: 'bot paper paper--flat' }, h('span', { html: tokenSvg(b.token) }), h('span', { class: 'bname' }, b.name)));
    }
  }
  renderTokens(); renderCount(); renderBots();

  const rules = h('div', { class: 'rules paper paper--flat paper--tilt-r' }, h('h2', null, 'House rules'));
  const rulesHost = h('div');
  rules.appendChild(rulesHost);
  function renderRules(): void {
    clear(rulesHost);
    rulesHost.appendChild(rulesPanel({ ...DEFAULT_CONFIG, ...setup.config } as GameConfig, true, (patch) => { Object.assign(setup.config, patch); renderRules(); }));
  }
  renderRules();

  const startBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', id: 'setup-start', onClick: () => {
    setup.name = nameInput.value.trim() || 'You';
    saveProfile(setup.name, setup.token);
    handlers.onStart({ ...setup, config: { ...setup.config, turnTimerSeconds: null } });
  } }, 'Start game');

  const resume = saved ? h('div', { class: 'resume paper paper--flat' },
    h('div', null, h('b', null, 'You have a game in progress'), h('div', { class: 'muted small' }, `Turn ${saved.state.turnNumber}, ${saved.state.players.filter((p) => !p.bankrupt).length} players left.`)),
    h('button', { class: 'btn btn--good', type: 'button', id: 'setup-resume', onClick: () => handlers.onResume(saved) }, 'Resume')) : null;

  const left = h('div', null,
    h('h1', { class: 'title-art' }, h('span', null, 'PAPER'), h('span', null, 'TYCOON')),
    h('p', { class: 'subtitle hand' }, 'Buy streets, build houses, bankrupt the computer. All out of paper.'),
    resume,
    h('div', { class: 'field' }, h('label', { for: 'setup-name' }, 'Your name'), nameInput),
    h('div', { class: 'field' }, h('label', null, 'Your token'), tokenGrid),
    h('div', { class: 'field' }, h('label', null, 'Computer opponents'), countRow, botsEl),
    h('div', { style: { textAlign: 'center', marginTop: '10px' } }, startBtn),
  );
  root.appendChild(h('div', { class: 'screen-center' }, h('div', { class: 'setup paper' }, left, rules)));
}
