/**
 * Shared SVG defs for the paper-craft look: grain and hand-cut edge filters,
 * a lifted-paper drop shadow, and cardboard / wood patterns. Inline
 * PAPER_DEFS once near the top of the document body; every id is prefixed
 * `pp-` and is referenced as url(#pp-...) from CSS `filter` or SVG `fill`.
 */
export const PAPER_DEFS: string =
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
  '<defs>' +
  // subtle paper grain laid over the source, colors kept essentially intact
  '<filter id="pp-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="pp-noise"/>' +
  '<feColorMatrix in="pp-noise" type="matrix" values="0.4 0.4 0.4 0 0.2  0.4 0.4 0.4 0 0.17  0.4 0.4 0.4 0 0.12  0 0 0 0 0.06" result="pp-tint"/>' +
  '<feBlend in="SourceGraphic" in2="pp-tint" mode="multiply" result="pp-blend"/>' +
  '<feComposite in="pp-blend" in2="SourceGraphic" operator="in"/>' +
  '</filter>' +
  // slight hand-cut wobble on edges
  '<filter id="pp-wobble" x="-5%" y="-5%" width="110%" height="110%">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="pp-warp"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="pp-warp" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>' +
  '</filter>' +
  // soft offset shadow: paper lifted off the table
  '<filter id="pp-shadow" x="-12%" y="-12%" width="130%" height="135%">' +
  '<feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-color="#2b2118" flood-opacity="0.35"/>' +
  '</filter>' +
  // corrugated cardboard stripes
  '<pattern id="pp-cardboard" patternUnits="userSpaceOnUse" width="12" height="12">' +
  '<rect width="12" height="12" fill="#c9a36b"/>' +
  '<rect x="0" y="0" width="12" height="3.5" fill="#b8905a"/>' +
  '<rect x="0" y="3.5" width="12" height="1.2" fill="#ad8752"/>' +
  '<rect x="0" y="7" width="12" height="1.5" fill="#d6b27c"/>' +
  '</pattern>' +
  // warm wood grain for the table
  '<pattern id="pp-wood" patternUnits="userSpaceOnUse" width="120" height="60">' +
  '<rect width="120" height="60" fill="#8b5a2b"/>' +
  '<path d="M0 9 Q30 4 60 9 T120 9" fill="none" stroke="#a06a35" stroke-width="2" opacity="0.75"/>' +
  '<path d="M0 21 Q30 25 60 21 T120 21" fill="none" stroke="#7a4d22" stroke-width="1.5" opacity="0.8"/>' +
  '<path d="M0 33 Q30 28 60 33 T120 33" fill="none" stroke="#a06a35" stroke-width="1.5" opacity="0.6"/>' +
  '<path d="M0 45 Q30 49 60 45 T120 45" fill="none" stroke="#9c6531" stroke-width="2.5" opacity="0.55"/>' +
  '<path d="M0 55 Q30 52 60 55 T120 55" fill="none" stroke="#7a4d22" stroke-width="1" opacity="0.7"/>' +
  '</pattern>' +
  '</defs>' +
  '</svg>';
