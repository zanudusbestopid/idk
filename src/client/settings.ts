// Player settings shared by the pause menu, the boards and the game screen. Persisted per browser.
import { setMuted } from './audio.js';

export interface Settings {
  animSpeed: number;                       // 0.5 (slow) .. 2 (fast); durations are divided by it
  sound: boolean;
  camera: 'follow' | 'overview' | 'top';   // default camera mode when a game starts
}

const KEY = 'pt.settings';
const DEFAULTS: Settings = { animSpeed: 1, sound: true, camera: 'follow' };
let current: Settings = load();
const listeners = new Set<(s: Settings) => void>();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    const s = { ...DEFAULTS, ...v };
    s.animSpeed = Math.min(2, Math.max(0.5, Number(s.animSpeed) || 1));
    setMuted(!s.sound);
    return s;
  } catch { return { ...DEFAULTS }; }
}

export function getSettings(): Settings { return current; }

export function updateSettings(patch: Partial<Settings>): Settings {
  current = { ...current, ...patch };
  current.animSpeed = Math.min(2, Math.max(0.5, current.animSpeed));
  setMuted(!current.sound);
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* storage unavailable */ }
  for (const l of listeners) l(current);
  return current;
}

export function onSettingsChange(l: (s: Settings) => void): () => void { listeners.add(l); return () => listeners.delete(l); }

/** Scale an animation duration by the player's speed setting. */
export function dur(ms: number): number { return ms / current.animSpeed; }
