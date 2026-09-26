/**
 * Paper die faces for Paper Tycoon. `dieFace(n)` returns a 64x64 SVG string
 * of an off-white paper die showing n pips (1-6), in the same sticker-edge
 * outline style as the tokens and icons. No ids are used.
 */

const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[32, 32]],
  2: [[20, 20], [44, 44]],
  3: [[20, 20], [32, 32], [44, 44]],
  4: [[20, 20], [44, 20], [20, 44], [44, 44]],
  5: [[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]],
  6: [[20, 20], [44, 20], [20, 32], [44, 32], [20, 44], [44, 44]],
};

export function dieFace(n: number): string {
  const k = Math.min(6, Math.max(1, Math.round(n) || 1));
  const pips = PIP_LAYOUT[k]
    .map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="#2b2118" stroke="none"/>')
    .join('');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z"/>' +
    '</g>' +
    '<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="#fffaf0" stroke="none"/>' +
    '<path d="M52.8 15 L52.8 47.5 Q52.8 52.8 47.5 52.8 L15 52.8" fill="none" stroke="#e4dfd3" stroke-width="4.5"/>' +
    '<path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="none"/>' +
    pips +
    '</g></svg>'
  );
}
