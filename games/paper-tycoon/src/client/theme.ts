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

/**
 * Themes a reason string the engine attached to a payment or a jailing: card texts
 * are swapped for the theme's wording, and the classic words for Go and Jail are replaced.
 */
export function themeReason(reason: string): string {
  if (THEME === CLASSIC) return reason;
  for (const deck of ['chance', 'chest'] as const) {
    const idx = CLASSIC.cardText[deck].indexOf(reason);
    if (idx >= 0) return THEME.cardText[deck][idx] ?? reason;
  }
  return reason
    .replace(/Go To Jail/g, T.goToJail)
    .replace(/\bJail\b/g, T.jail)
    .replace(/\bGo\b/g, T.go);
}
