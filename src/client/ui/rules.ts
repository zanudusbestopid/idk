import type { GameConfig } from '../../shared/types.js';
import { ICONS } from '../art/icons.js';
import { h } from '../dom.js';
import { T } from '../theme.js';

/** The house-rules panel shared by the online lobby and the single-player setup. */
export function rulesPanel(c: GameConfig, editable: boolean, onChange: (patch: Partial<GameConfig>) => void): HTMLElement {
  const root = h('div');
  const num = (key: keyof GameConfig, label: string, hint: string, min: number, max: number, step = 1) => {
    const input = h('input', { class: 'input', type: 'number', min, max, step, value: String(c[key] ?? 0), disabled: !editable, id: `rule-${key}` }) as HTMLInputElement;
    input.addEventListener('change', () => onChange({ [key]: Number(input.value) } as Partial<GameConfig>));
    root.appendChild(h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, label), h('div', { class: 'rhint' }, hint)), input));
  };
  const bool = (key: keyof GameConfig, label: string, hint: string) => {
    const sw = h('button', { class: `switch ${c[key] ? 'is-on' : ''}`, type: 'button', role: 'switch', 'aria-checked': String(!!c[key]), 'aria-label': label, disabled: !editable, id: `rule-${key}`,
      onClick: () => onChange({ [key]: !c[key] } as Partial<GameConfig>) });
    root.appendChild(h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, label), h('div', { class: 'rhint' }, hint)), sw));
  };
  num('startingCash', 'Starting cash', 'Everyone begins with this much.', 100, 10000, 50);
  num('goSalary', `Salary for passing ${T.go}`, 'Collected each lap.', 0, 2000, 10);
  bool('auctions', 'Auctions', 'A property nobody buys goes to auction (official rule).');
  bool('freeParkingJackpot', `${T.freeParking} jackpot`, 'Taxes and fees pile up; land there to collect.');
  bool('doubleGoSalary', `Double salary on ${T.go}`, `Landing exactly on ${T.go} pays twice.`);
  num('jailFine', `${T.jail} fine`, `Cost to leave ${T.jail} early.`, 0, 1000, 10);
  num('maxJailTurns', `Max turns in ${T.jail}`, 'Then you must pay and move.', 1, 6);
  return root;
}

export function turnTimerRule(c: GameConfig, editable: boolean, onChange: (patch: Partial<GameConfig>) => void): HTMLElement {
  const timerSel = h('select', { class: 'input', disabled: !editable, id: 'rule-turnTimerSeconds' }) as HTMLSelectElement;
  for (const [v, label] of [[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s'], [120, '2 min'], [180, '3 min'], [300, '5 min']] as [number, string][]) {
    timerSel.appendChild(h('option', { value: String(v), selected: (c.turnTimerSeconds ?? 0) === v }, label));
  }
  timerSel.addEventListener('change', () => onChange({ turnTimerSeconds: Number(timerSel.value) || null }));
  return h('div', { class: 'rule' }, h('div', null, h('div', { class: 'rlabel' }, 'Turn timer'), h('div', { class: 'rhint' }, 'Slow players get auto-played.')), timerSel);
}

export function hostOnlyNote(): HTMLElement {
  return h('div', { class: 'muted small', style: { marginTop: '8px' } }, h('span', { class: 'ico', html: ICONS.timer, style: { width: '1em', display: 'inline-block', verticalAlign: 'middle' } }), ' Only the host can change the rules.');
}
