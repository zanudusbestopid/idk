// The active theme for this build. `__THEME__` is set by the build's esbuild
// `define`; in dev it is absent, so `typeof` (which never throws on an
// undeclared identifier) falls back to the classic theme.
declare const __THEME__: string | undefined;
import { CLASSIC, THEMES, type Theme } from '../shared/theme.js';
import type { ColorGroup } from '../shared/types.js';

export const THEME: Theme = THEMES[typeof __THEME__ === 'string' ? __THEME__ : 'classic'] ?? CLASSIC;
export const T = THEME.terms;

export function deckName(deck: 'chance' | 'chest'): string {
  return deck === 'chance' ? T.chance : T.chest;
}

/** The theme's wording for a card, falling back to the text the engine put in the event. */
export function cardText(deck: 'chance' | 'chest', id: number, fallback: string): string {
  return THEME.cardText[deck][id] ?? fallback;
}

export function groupName(group: ColorGroup): string {
  return THEME.groupNames[group];
}

/** Upper-cases the first letter, for a term that starts a sentence. */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
