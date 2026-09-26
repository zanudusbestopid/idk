import { DEFAULT_CONFIG } from '../../engine/engine.js';
import type { GameConfig } from '../../shared/types.js';
import { TOKEN_LIST } from '../../shared/tokens.js';
import { h, clear } from '../dom.js';
import { defaultBots, type SavedGame, type SoloSetup } from '../local.js';
import { loadProfile, saveProfile } from '../store.js';
import { tokenSvg } from './home.js';
import { rulesPanel } from './rules.js';
import { T, THEME } from '../theme.js';
import { SHEET_HELP, getCustomSheetUrl, setCustomSheetUrl, warmCharacters } from '../sprites.js';

export interface SetupHandlers {
  onStart(setup: SoloSetup): void;
  onResume(saved: SavedGame): void;
  /** Called with the current choices whenever they change, so the scene behind the menu can show them. */
  onPreview?(setup: SoloSetup): void;
}

/** Title screen: hero title on the left, the setup card on the right, both floating over the 3D scene. */
export function renderSetup(root: HTMLElement, handlers: SetupHandlers, saved: SavedGame | null, previous?: SoloSetup): void {
  clear(root);
  const profile = loadProfile();
  const setup: SoloSetup = previous
    ? { ...previous, config: { ...previous.config } }
    : { name: profile.name, token: TOKEN_LIST.some((t) => t.id === profile.token) ? profile.token : 'hat', bots: [], config: { ...DEFAULT_CONFIG } };
  let botCount = previous ? previous.bots.length : 3;
  let shuffle = 0;
  if (!setup.difficulty) setup.difficulty = 'normal';
  const preview = () => handlers.onPreview?.({ ...setup, name: nameInput.value.trim() || 'You' });

  const nameInput = h('input', { class: 'input', placeholder: 'Your name', maxLength: 16, value: setup.name, autocomplete: 'off', id: 'setup-name' }) as HTMLInputElement;
  nameInput.addEventListener('input', () => { setup.name = nameInput.value; });

  const tokenGrid = h('div', { class: 'token-grid' });
  const botsEl = h('div', { class: 'bots' });
  const countRow = h('div', { class: 'count-row' });
  const diffRow = h('div', { class: 'count-row diff-row' });
  function renderDifficulty(): void {
    clear(diffRow);
    diffRow.appendChild(h('span', { class: 'muted small', style: { alignSelf: 'center', marginRight: '4px' } }, 'Skill:'));
    for (const [d, label, title] of [['easy', 'Easy', 'Relaxed opponents that overpay and build slowly'], ['normal', 'Normal', 'Sensible opponents'], ['hard', 'Hard', 'Ruthless: plans sets, blocks yours, bids to the limit']] as const) {
      diffRow.appendChild(h('button', { class: `btn btn--sm ${setup.difficulty === d ? 'btn--blue' : ''}`, type: 'button', title, onClick: () => { setup.difficulty = d; renderDifficulty(); } }, label));
    }
  }
  renderDifficulty();

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
    preview();
  }
  renderTokens(); renderCount(); renderBots();

  // Custom sprite sheet (stays in this browser only)
  const sheetInput = h('input', { type: 'file', accept: 'image/png,image/gif,image/webp', id: 'setup-sheet', class: 'sr-only' }) as HTMLInputElement;
  const sheetStatus = h('span', { class: 'muted small' }, getCustomSheetUrl() ? 'Custom sheet loaded.' : 'Using the built-in characters.');
  const clearSheet = h('button', { class: `btn btn--sm ${getCustomSheetUrl() ? '' : 'hidden'}`, type: 'button', onClick: () => { setCustomSheetUrl(null); void warmCharacters().then(() => { renderTokens(); renderBots(); sheetStatus.textContent = 'Using the built-in characters.'; clearSheet.classList.add('hidden'); }); } }, 'Use built-in');
  sheetInput.addEventListener('change', () => {
    const file = sheetInput.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { sheetStatus.textContent = 'That file is too big (2 MB max).'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomSheetUrl(String(reader.result));
      void warmCharacters().then(() => { renderTokens(); renderBots(); sheetStatus.textContent = 'Custom sheet loaded.'; clearSheet.classList.remove('hidden'); });
    };
    reader.readAsDataURL(file);
  });
  const sheetRow = h('details', { class: 'rules-fold' },
    h('summary', null, 'Custom sprite sheet ', h('span', { class: 'muted small' }, '(optional)')),
    h('p', { class: 'muted small', style: { margin: '6px 0' } }, SHEET_HELP),
    h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
      h('label', { class: 'btn btn--sm', for: 'setup-sheet' }, 'Load PNG…'), sheetInput, clearSheet, sheetStatus));

  const rulesHost = h('div');
  function renderRules(): void {
    clear(rulesHost);
    rulesHost.appendChild(rulesPanel({ ...DEFAULT_CONFIG, ...setup.config } as GameConfig, true, (patch) => { Object.assign(setup.config, patch); renderRules(); }));
  }
  renderRules();
  const rules = h('details', { class: 'rules-fold' }, h('summary', null, 'House rules ', h('span', { class: 'muted small' }, `(auctions, ${T.freeParking}, starting cash…)`)), rulesHost);

  const startBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', id: 'setup-start', onClick: () => {
    setup.name = nameInput.value.trim() || 'You';
    saveProfile(setup.name, setup.token);
    handlers.onStart({ ...setup, config: { ...setup.config, turnTimerSeconds: null } });
  } }, 'Start game');

  const resume = saved ? h('div', { class: 'resume paper paper--flat' },
    h('div', null, h('b', null, 'Game in progress'), h('div', { class: 'muted small' }, `Turn ${saved.state.turnNumber}, ${saved.state.players.filter((p) => !p.bankrupt).length} players left.`)),
    h('button', { class: 'btn btn--good', type: 'button', id: 'setup-resume', onClick: () => handlers.onResume(saved) }, 'Resume')) : null;

  const hero = h('div', { class: 'title-hero' },
    h('h1', { class: 'title-art' }, h('span', null, THEME.title[0]), h('span', null, THEME.title[1])),
    h('p', { class: 'tagline hand' }, THEME.tagline),
    resume);
  const fields = [
    h('div', { class: 'field', style: { '--i': '0' } as unknown as Record<string, string> }, h('label', { for: 'setup-name' }, 'Your name'), nameInput),
    h('div', { class: 'field', style: { '--i': '1' } as unknown as Record<string, string> }, h('label', null, 'Your token'), tokenGrid),
    h('div', { class: 'field', style: { '--i': '2' } as unknown as Record<string, string> }, h('label', null, 'Computer opponents'), countRow, botsEl, diffRow),
    h('div', { class: 'field', style: { '--i': '3' } as unknown as Record<string, string> }, rules),
    h('div', { class: 'field', style: { '--i': '3' } as unknown as Record<string, string> }, sheetRow),
    h('div', { class: 'field field--start', style: { '--i': '4' } as unknown as Record<string, string> }, startBtn),
  ];
  const card = h('div', { class: 'setup-card paper' }, ...fields);
  root.append(hero, card);
}
