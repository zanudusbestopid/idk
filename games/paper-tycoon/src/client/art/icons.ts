/**
 * Board and UI icons for Paper Tycoon, in the same paper-cutout style as the
 * tokens: off-white sticker edge under flat fills with a dark outline. All
 * SVGs are 64x64 and contain no ids.
 */

const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';
const STICKER =
  '<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">';
const INK =
  '<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">';
const END = '</g></svg>';
/** thicker outline for icons meant to be drawn at 12-18 px */
const INK_BOLD =
  '<g stroke="#2b2118" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">';

const GO_ARROW = 'M6 42 A24 24 0 0 1 54 42 L60 41 L47.5 57 L35 41 L41 42 A11 11 0 0 0 19 42 Z';
const GO =
  OPEN +
  STICKER +
  '<path d="' + GO_ARROW + '"/>' +
  '</g>' +
  INK +
  '<path d="' + GO_ARROW + '" fill="#d9413a"/>' +
  '<path d="M17.5 42 A14.5 14.5 0 0 1 46.5 42 L44.2 42 A12.2 12.2 0 0 0 19.8 42 Z" fill="#a8302b" stroke="none"/>' +
  '<path d="M39.5 43 L47.5 53 L55.5 43 Z" fill="#a8302b" stroke="none"/>' +
  END;

const Q_MARK = 'M24 25 Q24 15 32 15 Q40 15 40 22 Q40 27 34.5 30 Q32 31.5 32 35 L32 38';
const CHANCE =
  OPEN +
  '<g transform="rotate(-6 32 32)">' +
  STICKER +
  '<rect x="16" y="8" width="34" height="48" rx="3"/>' +
  '</g>' +
  INK +
  '<rect x="16" y="8" width="34" height="48" rx="3" fill="#fffaf0"/>' +
  '<rect x="44" y="10" width="4.5" height="44" fill="#e4dfd3" stroke="none"/>' +
  '<rect x="19" y="11" width="28" height="42" rx="2" fill="none" stroke="#e8842f" stroke-width="1.5" stroke-dasharray="3 2.5"/>' +
  '<path d="' + Q_MARK + '" fill="none" stroke-width="9"/>' +
  '<path d="' + Q_MARK + '" fill="none" stroke="#e8842f" stroke-width="4"/>' +
  '<circle cx="32" cy="46" r="4.2" fill="#e8842f"/>' +
  '</g></g></svg>';

const CHEST =
  OPEN +
  STICKER +
  '<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z"/>' +
  '<rect x="8" y="33" width="48" height="23" rx="2"/>' +
  '</g>' +
  INK +
  '<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z" fill="#6cc4ea"/>' +
  '<path d="M44 13.5 Q54.5 14 54.5 24 L54.5 31.5 L48 31.5 L48 24 Q48 16 44 13.5 Z" fill="#3f9dc8" stroke="none"/>' +
  '<rect x="18" y="12.5" width="5" height="20.5" fill="#3f9dc8"/>' +
  '<rect x="41" y="12.5" width="5" height="20.5" fill="#3f9dc8"/>' +
  '<rect x="8" y="33" width="48" height="23" rx="2" fill="#6cc4ea"/>' +
  '<rect x="10" y="50" width="44" height="4" fill="#3f9dc8" stroke="none"/>' +
  '<rect x="18" y="33" width="5" height="23" fill="#3f9dc8"/>' +
  '<rect x="41" y="33" width="5" height="23" fill="#3f9dc8"/>' +
  '<rect x="26.5" y="29" width="11" height="11" rx="2" fill="#f2b632"/>' +
  '<circle cx="32" cy="34" r="1.7" fill="#2b2118" stroke="none"/>' +
  '<rect x="31" y="34" width="2" height="3.5" fill="#2b2118" stroke="none"/>' +
  END;

const RAILROAD =
  OPEN +
  STICKER +
  '<circle cx="54" cy="8" r="4.5"/>' +
  '<rect x="42" y="9" width="8" height="16"/>' +
  '<rect x="40" y="8" width="12" height="4" rx="1"/>' +
  '<rect x="24" y="23" width="32" height="21" rx="9"/>' +
  '<rect x="6" y="14" width="20" height="30" rx="2"/>' +
  '<rect x="4" y="12" width="24" height="4" rx="1"/>' +
  '<rect x="4" y="44" width="52" height="5"/>' +
  '<path d="M54 44 L62 54 L54 54 Z"/>' +
  '<circle cx="15" cy="53" r="6.5"/>' +
  '<circle cx="33" cy="53" r="6.5"/>' +
  '<circle cx="47" cy="53" r="4.5"/>' +
  '</g>' +
  INK +
  '<circle cx="54" cy="8" r="4.5" fill="#e4dfd3"/>' +
  '<rect x="42" y="9" width="8" height="16" fill="#4a4a4a"/>' +
  '<rect x="40" y="8" width="12" height="4" rx="1" fill="#4a4a4a"/>' +
  '<rect x="24" y="23" width="32" height="21" rx="9" fill="#4a4a4a"/>' +
  '<path d="M27 37 L52 37 Q49 42 44 42.5 L28 42.5 Z" fill="#333333" stroke="none"/>' +
  '<circle cx="55" cy="29.5" r="3" fill="#f9e27a"/>' +
  '<rect x="6" y="14" width="20" height="30" rx="2" fill="#4a4a4a"/>' +
  '<rect x="8" y="37" width="16" height="5" fill="#333333" stroke="none"/>' +
  '<rect x="10" y="19" width="11" height="10" rx="1" fill="#bfe3f5"/>' +
  '<rect x="4" y="12" width="24" height="4" rx="1" fill="#4a4a4a"/>' +
  '<rect x="4" y="44" width="52" height="5" fill="#2b2118"/>' +
  '<path d="M54 44 L62 54 L54 54 Z" fill="#6b7177"/>' +
  '<circle cx="15" cy="53" r="6.5" fill="#d9413a"/>' +
  '<circle cx="33" cy="53" r="6.5" fill="#d9413a"/>' +
  '<circle cx="47" cy="53" r="4.5" fill="#d9413a"/>' +
  '<path d="M15 53 L33 53" fill="none"/>' +
  '<circle cx="15" cy="53" r="2" fill="#fffaf0" stroke="none"/>' +
  '<circle cx="33" cy="53" r="2" fill="#fffaf0" stroke="none"/>' +
  '<circle cx="47" cy="53" r="1.5" fill="#fffaf0" stroke="none"/>' +
  END;

const RAYS = 'M32 4 L32 8 M15 9 L18 12 M49 9 L46 12 M9 28 L13 28 M55 28 L51 28';
const ELECTRIC =
  OPEN +
  STICKER +
  '<path d="' + RAYS + '" fill="none"/>' +
  '<circle cx="32" cy="28" r="16"/>' +
  '<path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z"/>' +
  '<rect x="28" y="54" width="8" height="4" rx="1.5"/>' +
  '</g>' +
  INK +
  '<path d="' + RAYS + '" fill="none"/>' +
  '<circle cx="32" cy="28" r="16" fill="#f9e27a" stroke="none"/>' +
  '<path d="M40 14.2 A16 16 0 0 1 40 41.8 A26 26 0 0 0 40 14.2 Z" fill="#e9c94d" stroke="none"/>' +
  '<circle cx="32" cy="28" r="16" fill="none"/>' +
  '<path d="M26 36 L26 32 L29 27 L32 34 L35 27 L38 32 L38 36" fill="none" stroke-width="2"/>' +
  '<path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z" fill="#9aa0a6"/>' +
  '<path d="M24 46 L40 46 M24 50 L40 50" fill="none" stroke-width="2"/>' +
  '<rect x="28" y="54" width="8" height="4" rx="1.5" fill="#6b7177"/>' +
  END;

const FAUCET =
  'M16 36 L16 26 Q16 15 27 15 L42 15 Q52 15 52 25 L52 38 L58 38 L58 50 L46 50 L46 38 L44 38 L44 25 Q44 23 42 23 L27 23 Q24 23 24 26 L24 36 Z';
const WATER =
  OPEN +
  STICKER +
  '<rect x="44" y="8" width="4" height="8"/>' +
  '<rect x="38" y="4" width="16" height="5" rx="2.5"/>' +
  '<path d="' + FAUCET + '"/>' +
  '<rect x="13" y="35" width="14" height="5" rx="1"/>' +
  '<path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z"/>' +
  '</g>' +
  INK +
  '<rect x="44" y="8" width="4" height="8" fill="#9aa0a6"/>' +
  '<rect x="38" y="4" width="16" height="5" rx="2.5" fill="#6b7177"/>' +
  '<path d="' + FAUCET + '" fill="#9aa0a6"/>' +
  '<rect x="48" y="44" width="8" height="4" fill="#6b7177" stroke="none"/>' +
  '<path d="M20 30 L20 24 Q20 19.5 26 19.5" fill="none" stroke="#d7dbe0" stroke-width="2"/>' +
  '<rect x="13" y="35" width="14" height="5" rx="1" fill="#6b7177"/>' +
  '<path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z" fill="#4aa3e0"/>' +
  '<circle cx="17.5" cy="53" r="1.5" fill="#bfe3f5" stroke="none"/>' +
  END;

const S_CURVE =
  'M37.5 30.5 Q35 26.5 31 27 Q26 27.5 26.5 32 Q27 36 32 37 Q37.5 38 37.5 42.5 Q37 47 32 47 Q28 47 26 44';
const INCOMETAX =
  OPEN +
  STICKER +
  '<path d="M25 18 L39 18 L37 9 L27 9 Z"/>' +
  '<path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z"/>' +
  '</g>' +
  INK +
  '<path d="M25 18 L39 18 L37 9 L27 9 Z" fill="#9aa0a6"/>' +
  '<path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z" fill="#9aa0a6"/>' +
  '<path d="M44 29 Q51.3 38 51.3 45 Q51 54 41 56.6 Q47.5 52 47.5 45 Q47.5 37 44 29 Z" fill="#6b7177" stroke="none"/>' +
  '<rect x="24" y="16" width="16" height="4.5" rx="2" fill="#6b7177"/>' +
  '<path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke-width="7"/>' +
  '<path d="' + S_CURVE + '" fill="none" stroke-width="8"/>' +
  '<path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke="#3aa655" stroke-width="2.5"/>' +
  '<path d="' + S_CURVE + '" fill="none" stroke="#3aa655" stroke-width="3.5"/>' +
  END;

const STAR_A = 'M50 8 L51.6 12.4 L56 14 L51.6 15.6 L50 20 L48.4 15.6 L44 14 L48.4 12.4 Z';
const STAR_B = 'M12 11 L13.2 14 L16 15 L13.2 16 L12 19 L10.8 16 L8 15 L10.8 14 Z';
const LUXURYTAX =
  OPEN +
  STICKER +
  '<circle cx="32" cy="42" r="13" fill="none" stroke-width="17"/>' +
  '<path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z"/>' +
  '<path d="' + STAR_A + '"/>' +
  '<path d="' + STAR_B + '"/>' +
  '</g>' +
  INK +
  '<circle cx="32" cy="42" r="13" fill="none" stroke-width="11"/>' +
  '<circle cx="32" cy="42" r="13" fill="none" stroke="#f2b632" stroke-width="6"/>' +
  '<path d="M21 46 A11.5 11.5 0 0 0 43 46" fill="none" stroke="#d99a1e" stroke-width="3"/>' +
  '<path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z" fill="#bfe3f5"/>' +
  '<path d="M32 20 L42 20 L32 32 Z" fill="#8fd0ee" stroke="none"/>' +
  '<path d="M22 20 L42 20 M27 12 L32 20 L37 12" fill="none" stroke-width="2"/>' +
  '<path d="' + STAR_A + '" fill="#fffaf0" stroke-width="2"/>' +
  '<path d="' + STAR_B + '" fill="#fffaf0" stroke-width="2"/>' +
  END;

const JAIL =
  OPEN +
  STICKER +
  '<rect x="8" y="8" width="48" height="48" rx="3"/>' +
  '<rect x="9" y="6" width="4" height="52" rx="1.5"/>' +
  '<rect x="51" y="6" width="4" height="52" rx="1.5"/>' +
  '</g>' +
  INK +
  '<rect x="8" y="8" width="48" height="48" rx="3" fill="#d7d2c4"/>' +
  '<rect x="10.5" y="10.5" width="43" height="43" rx="2" fill="#c9c3b3" stroke="none"/>' +
  '<circle cx="32" cy="33" r="12" fill="#fffaf0"/>' +
  '<circle cx="28.5" cy="31" r="2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="35.5" cy="31" r="2" fill="#2b2118" stroke="none"/>' +
  '<path d="M26 26 L29.5 27.5 M38 26 L34.5 27.5" fill="none" stroke-width="2"/>' +
  '<path d="M27.5 40 Q32 36 36.5 40" fill="none" stroke-width="2.2"/>' +
  '<rect x="8" y="16" width="48" height="3.5" fill="#8a8f94"/>' +
  '<rect x="8" y="46" width="48" height="3.5" fill="#8a8f94"/>' +
  '<rect x="9" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>' +
  '<rect x="20.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>' +
  '<rect x="39.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>' +
  '<rect x="51" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>' +
  END;

const SIGN_A = 'M13 12 L45 12 L54 20.5 L45 29 L13 29 Z';
const SIGN_B = 'M51 33 L19 33 L10 41 L19 49 L51 49 Z';
const VISITING =
  OPEN +
  STICKER +
  '<rect x="29.5" y="14" width="5" height="44" rx="1.5"/>' +
  '<path d="' + SIGN_A + '"/>' +
  '<path d="' + SIGN_B + '"/>' +
  '<ellipse cx="32" cy="57" rx="11" ry="3.5"/>' +
  '</g>' +
  INK +
  '<ellipse cx="32" cy="57" rx="11" ry="3.5" fill="#8a8f94"/>' +
  '<rect x="29.5" y="14" width="5" height="44" rx="1.5" fill="#6b7177"/>' +
  '<path d="' + SIGN_A + '" fill="#9aa0a6"/>' +
  '<path d="M13 25 L47.5 25 L45 27.5 L13 27.5 Z" fill="#6b7177" stroke="none"/>' +
  '<path d="M19 18 L40 18 M19 23 L33 23" fill="none" stroke-width="2.2"/>' +
  '<path d="' + SIGN_B + '" fill="#9aa0a6"/>' +
  '<path d="M51 45 L16.5 45 L19 47.5 L51 47.5 Z" fill="#6b7177" stroke="none"/>' +
  '<path d="M25 39 L46 39 M31 44 L46 44" fill="none" stroke-width="2.2"/>' +
  END;

const FREEPARKING =
  OPEN +
  STICKER +
  '<rect x="9" y="44" width="10" height="12" rx="3"/>' +
  '<rect x="45" y="44" width="10" height="12" rx="3"/>' +
  '<path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z"/>' +
  '<rect x="10" y="26" width="6" height="4" rx="1"/>' +
  '<rect x="48" y="26" width="6" height="4" rx="1"/>' +
  '<rect x="5" y="32" width="54" height="20" rx="4"/>' +
  '</g>' +
  INK +
  '<rect x="9" y="44" width="10" height="12" rx="3" fill="#2b2118"/>' +
  '<rect x="45" y="44" width="10" height="12" rx="3" fill="#2b2118"/>' +
  '<path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z" fill="#d9413a"/>' +
  '<path d="M19.5 30 L22.5 18 L41.5 18 L44.5 30 Z" fill="#bfe3f5"/>' +
  '<rect x="10" y="26" width="6" height="4" rx="1" fill="#a8302b"/>' +
  '<rect x="48" y="26" width="6" height="4" rx="1" fill="#a8302b"/>' +
  '<rect x="5" y="32" width="54" height="20" rx="4" fill="#d9413a"/>' +
  '<rect x="8" y="46" width="48" height="4" fill="#a8302b" stroke="none"/>' +
  '<circle cx="14" cy="40" r="4" fill="#f9e27a"/>' +
  '<circle cx="50" cy="40" r="4" fill="#f9e27a"/>' +
  '<rect x="24" y="38" width="16" height="5" rx="1.5" fill="#2b2118" stroke="none"/>' +
  '<rect x="7" y="48" width="50" height="5" rx="2" fill="#9aa0a6"/>' +
  END;

const GOTOJAIL =
  OPEN +
  STICKER +
  '<path d="M27 37 L12 28" fill="none" stroke-width="16"/>' +
  '<path d="M45 37 L50 48" fill="none" stroke-width="16"/>' +
  '<circle cx="11" cy="27" r="4"/>' +
  '<path d="M9 25 L5 22" fill="none" stroke-width="10"/>' +
  '<circle cx="50.5" cy="49.5" r="3.5"/>' +
  '<path d="M26 34 L46 34 L50 54 L22 54 Z"/>' +
  '<rect x="27" y="53.5" width="8" height="6" rx="1"/>' +
  '<rect x="37" y="53.5" width="8" height="6" rx="1"/>' +
  '<circle cx="36" cy="23" r="9"/>' +
  '<path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z"/>' +
  '<rect x="23" y="16" width="26" height="4" rx="1.5"/>' +
  '</g>' +
  INK +
  '<path d="M27 37 L12 28" fill="none" stroke-width="9"/>' +
  '<path d="M27 37 L12 28" fill="none" stroke="#2f6fd6" stroke-width="4.5"/>' +
  '<path d="M45 37 L50 48" fill="none" stroke-width="9"/>' +
  '<path d="M45 37 L50 48" fill="none" stroke="#2f6fd6" stroke-width="4.5"/>' +
  '<rect x="27" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/>' +
  '<rect x="37" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/>' +
  '<path d="M26 34 L46 34 L50 54 L22 54 Z" fill="#2f6fd6"/>' +
  '<path d="M42 35.5 L45 35.5 L48.6 52.5 L45 52.5 Z" fill="#1f4fa3" stroke="none"/>' +
  '<rect x="23.2" y="51" width="25.6" height="3.5" fill="#2b2118" stroke="none"/>' +
  '<circle cx="36" cy="42" r="1.5" fill="#f2b632" stroke="none"/>' +
  '<circle cx="36" cy="47.5" r="1.5" fill="#f2b632" stroke="none"/>' +
  '<circle cx="11" cy="27" r="4" fill="#f1c7a4"/>' +
  '<path d="M9 25 L5 22" fill="none" stroke-width="6"/>' +
  '<path d="M9 25 L5 22" fill="none" stroke="#f1c7a4" stroke-width="3"/>' +
  '<circle cx="50.5" cy="49.5" r="3.5" fill="#f1c7a4"/>' +
  '<circle cx="36" cy="23" r="9" fill="#f1c7a4"/>' +
  '<circle cx="33" cy="24" r="1.7" fill="#2b2118" stroke="none"/>' +
  '<circle cx="39" cy="24" r="1.7" fill="#2b2118" stroke="none"/>' +
  '<path d="M33 28.5 L39 28.5" fill="none" stroke-width="2"/>' +
  '<path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z" fill="#2f6fd6"/>' +
  '<rect x="23" y="16" width="26" height="4" rx="1.5" fill="#1f4fa3"/>' +
  '<circle cx="36" cy="11.5" r="2.2" fill="#f2b632" stroke="none"/>' +
  END;

const HOUSE =
  OPEN +
  STICKER +
  '<rect x="42" y="14" width="7" height="12"/>' +
  '<rect x="13" y="30" width="38" height="28" rx="1.5"/>' +
  '<path d="M6 32 L32 9 L58 32 Z"/>' +
  '</g>' +
  INK_BOLD +
  '<rect x="42" y="14" width="7" height="12" fill="#2c7f41"/>' +
  '<rect x="13" y="30" width="38" height="28" rx="1.5" fill="#3aa655"/>' +
  '<rect x="28" y="42" width="8" height="16" rx="1" fill="#2c7f41"/>' +
  '<rect x="17" y="36" width="7" height="6" fill="#fffaf0" stroke-width="2"/>' +
  '<path d="M6 32 L32 9 L58 32 Z" fill="#2c7f41"/>' +
  END;

const HOTEL =
  OPEN +
  STICKER +
  '<rect x="8" y="21" width="48" height="37" rx="1.5"/>' +
  '<rect x="4" y="15" width="56" height="8" rx="2"/>' +
  '</g>' +
  INK_BOLD +
  '<rect x="8" y="21" width="48" height="37" rx="1.5" fill="#d9413a"/>' +
  '<rect x="13" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="28" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="43" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="13" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="28" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="43" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/>' +
  '<rect x="28" y="47" width="8" height="11" rx="1" fill="#a8302b"/>' +
  '<rect x="4" y="15" width="56" height="8" rx="2" fill="#a8302b"/>' +
  END;

const SHACKLE = 'M23 30 L23 21 A9 9 0 0 1 41 21 L41 30';
const MORTGAGE =
  OPEN +
  STICKER +
  '<path d="' + SHACKLE + '" fill="none" stroke-width="13"/>' +
  '<rect x="14" y="28" width="36" height="28" rx="4"/>' +
  '</g>' +
  INK +
  '<path d="' + SHACKLE + '" fill="none" stroke-width="9"/>' +
  '<path d="' + SHACKLE + '" fill="none" stroke="#9aa0a6" stroke-width="4.5"/>' +
  '<rect x="14" y="28" width="36" height="28" rx="4" fill="#9aa0a6"/>' +
  '<rect x="16.5" y="49" width="31" height="4.5" rx="1" fill="#6b7177" stroke="none"/>' +
  '<circle cx="32" cy="40" r="4" fill="#2b2118" stroke="none"/>' +
  '<rect x="30" y="41" width="4" height="8" rx="1" fill="#2b2118" stroke="none"/>' +
  END;

const DOLLAR =
  OPEN +
  STICKER +
  '<rect x="4" y="17" width="56" height="30" rx="2"/>' +
  '</g>' +
  INK +
  '<rect x="4" y="17" width="56" height="30" rx="2" fill="#5cb85c"/>' +
  '<rect x="6.5" y="43" width="51" height="2.5" fill="#2c7f41" stroke="none"/>' +
  '<rect x="8.5" y="21.5" width="47" height="21" rx="1" fill="none" stroke="#2c7f41" stroke-width="1.5"/>' +
  '<circle cx="12.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/>' +
  '<circle cx="51.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/>' +
  '<circle cx="12.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/>' +
  '<circle cx="51.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/>' +
  '<circle cx="32" cy="32" r="8.5" fill="#a5dba4"/>' +
  '<path d="M35 28 Q34 26.5 32 26.5 Q29 26.5 29 29.5 Q29 32 32 32 Q35 32 35 34.5 Q35 37.5 32 37.5 Q30 37.5 29 36 M32 24.5 L32 26.5 M32 37.5 L32 39.5" fill="none" stroke-width="2"/>' +
  END;

const HAND_L = 'M12 26 L33 26 Q40 26 40 33 L40 38 Q40 45 33 45 L12 45 Z';
const HAND_R = 'M52 26 L35 26 Q27 26 27 34 L27 37 Q27 45 35 45 L52 45 Z';
const FINGERS = 'M36 28 L45.5 28 Q50 28 50 32 L50 40.5 Q50 44.5 45.5 44.5 L36 44.5 Z';
const THUMB = 'M20 21 Q20 17.5 24 17.5 L37 20 Q41 21 40 25 Q39 28 35 27.5 L22 27.5 Q20 27 20 25 Z';
const HANDSHAKE =
  OPEN +
  STICKER +
  '<rect x="2" y="25" width="12" height="20" rx="2"/>' +
  '<rect x="50" y="25" width="12" height="20" rx="2"/>' +
  '<path d="' + HAND_R + '"/>' +
  '<path d="' + HAND_L + '"/>' +
  '<path d="' + THUMB + '"/>' +
  '</g>' +
  INK +
  '<rect x="2" y="25" width="12" height="20" rx="2" fill="#5a6a8a"/>' +
  '<rect x="50" y="25" width="12" height="20" rx="2" fill="#8a6a5a"/>' +
  '<path d="' + HAND_R + '" fill="#d8a274"/>' +
  '<path d="M44 28 L50.5 28 L50.5 43 L44 43 Z" fill="#c48b5c" stroke="none"/>' +
  '<path d="' + HAND_L + '" fill="#f1c7a4"/>' +
  '<path d="' + FINGERS + '" fill="#f1c7a4"/>' +
  '<path d="M37 33.5 L48.5 33.5 M37 39 L48.5 39" fill="none" stroke-width="2"/>' +
  '<path d="' + THUMB + '" fill="#d8a274"/>' +
  END;

const HAMMER =
  OPEN +
  '<g transform="rotate(-40 32 34)">' +
  STICKER +
  '<rect x="29" y="22" width="6.5" height="34" rx="2"/>' +
  '<rect x="17" y="8" width="30" height="14" rx="2.5"/>' +
  '</g>' +
  INK +
  '<rect x="29" y="22" width="6.5" height="34" rx="2" fill="#c9a36b"/>' +
  '<path d="M33.5 26 L33.5 53" fill="none" stroke="#a8844f" stroke-width="1.5"/>' +
  '<rect x="17" y="8" width="30" height="14" rx="2.5" fill="#8a8f94"/>' +
  '<rect x="19" y="17" width="26" height="3.2" fill="#6b7177" stroke="none"/>' +
  '<rect x="41.5" y="10" width="4" height="7" fill="#6b7177" stroke="none"/>' +
  '</g></g></svg>';

const GLASS = 'M19 12 L45 12 L45 18 L34 32 L45 46 L45 52 L19 52 L19 46 L30 32 L19 18 Z';
const TIMER =
  OPEN +
  STICKER +
  '<path d="' + GLASS + '"/>' +
  '<rect x="15" y="6" width="34" height="6" rx="2"/>' +
  '<rect x="15" y="52" width="34" height="6" rx="2"/>' +
  '</g>' +
  INK +
  '<path d="' + GLASS + '" fill="#e8f4fa" stroke="none"/>' +
  '<path d="M22 22 L42 22 L34 32 L30 32 Z" fill="#f2b632" stroke="none"/>' +
  '<path d="M22.5 42 L41.5 42 L45 46 L45 50.5 L19 50.5 L19 46 Z" fill="#f2b632" stroke="none"/>' +
  '<path d="M32 32 L32 44" fill="none" stroke="#f2b632" stroke-width="2"/>' +
  '<path d="' + GLASS + '" fill="none"/>' +
  '<rect x="15" y="6" width="34" height="6" rx="2" fill="#c9a36b"/>' +
  '<rect x="15" y="52" width="34" height="6" rx="2" fill="#c9a36b"/>' +
  END;

const CROWN =
  OPEN +
  STICKER +
  '<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z"/>' +
  '<rect x="9" y="46" width="46" height="9" rx="2"/>' +
  '</g>' +
  INK +
  '<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z" fill="#f2b632"/>' +
  '<path d="M45.5 36 L54.5 27.5 L53.5 46 L45.5 46 Z" fill="#d99a1e" stroke="none"/>' +
  '<rect x="9" y="46" width="46" height="9" rx="2" fill="#d99a1e"/>' +
  '<circle cx="7" cy="20" r="3.2" fill="#d9413a"/>' +
  '<circle cx="57" cy="20" r="3.2" fill="#d9413a"/>' +
  '<circle cx="32" cy="12" r="3.5" fill="#2f6fd6"/>' +
  '<circle cx="32" cy="50.5" r="2.8" fill="#2aa9a0"/>' +
  END;

export const ICONS: Record<string, string> = {
  go: GO,
  chance: CHANCE,
  chest: CHEST,
  railroad: RAILROAD,
  electric: ELECTRIC,
  water: WATER,
  incometax: INCOMETAX,
  luxurytax: LUXURYTAX,
  jail: JAIL,
  visiting: VISITING,
  freeparking: FREEPARKING,
  gotojail: GOTOJAIL,
  house: HOUSE,
  hotel: HOTEL,
  mortgage: MORTGAGE,
  dollar: DOLLAR,
  handshake: HANDSHAKE,
  trade: HANDSHAKE,
  hammer: HAMMER,
  timer: TIMER,
  crown: CROWN,
};
