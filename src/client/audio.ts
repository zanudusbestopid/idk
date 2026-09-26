// Small synthesized sound effects (no audio files needed).

let ctx: AudioContext | null = null;
let muted = (() => { try { return localStorage.getItem('pt.muted') === '1'; } catch { return false; } })();

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

export function unlockAudio(): void { ac(); }
export function isMuted(): boolean { return muted; }
export function setMuted(m: boolean): void { muted = m; try { localStorage.setItem('pt.muted', m ? '1' : '0'); } catch { /* storage unavailable */ } }

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, when = 0, slide = 0): void {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + when);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), c.currentTime + when + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when); o.stop(c.currentTime + when + dur + 0.02);
}

function noise(dur: number, gain = 0.08, when = 0): void {
  const c = ac(); if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const g = c.createGain(); g.gain.value = gain;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
  src.connect(f).connect(g).connect(c.destination);
  src.start(c.currentTime + when);
}

export const sfx = {
  step(): void { tone(520 + Math.random() * 80, 0.06, 'triangle', 0.08); noise(0.03, 0.03); },
  dice(): void { for (let i = 0; i < 6; i++) noise(0.05, 0.06, i * 0.09); tone(300, 0.08, 'square', 0.05, 0.55); },
  cash(): void { tone(880, 0.08, 'square', 0.06); tone(1320, 0.12, 'square', 0.06, 0.08); },
  pay(): void { tone(440, 0.1, 'sawtooth', 0.05); tone(330, 0.16, 'sawtooth', 0.05, 0.1); },
  card(): void { noise(0.12, 0.09); tone(700, 0.05, 'triangle', 0.05, 0.05); },
  build(): void { tone(200, 0.06, 'square', 0.08); tone(200, 0.06, 'square', 0.08, 0.12); tone(260, 0.1, 'square', 0.08, 0.24); },
  jail(): void { tone(200, 0.35, 'sawtooth', 0.08, 0, -120); tone(150, 0.4, 'sawtooth', 0.08, 0.2, -80); },
  turn(): void { tone(660, 0.08, 'sine', 0.08); tone(990, 0.12, 'sine', 0.08, 0.1); },
  click(): void { tone(900, 0.03, 'square', 0.04); },
  win(): void { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.15)); },
  lose(): void { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.06, i * 0.2)); },
  bid(): void { tone(1200, 0.05, 'square', 0.05); },
  notify(): void { tone(784, 0.1, 'sine', 0.08); tone(1047, 0.15, 'sine', 0.08, 0.12); },
};
