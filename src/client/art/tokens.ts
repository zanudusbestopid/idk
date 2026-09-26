/**
 * Player token art for Paper Tycoon.
 *
 * Eight original paper-cutout characters, each a 64x64 SVG string. Every
 * silhouette is drawn twice: first with a thick off-white stroke (the
 * "sticker" edge of a hand-cut paper piece), then with flat fills, one darker
 * shade for shading and a dark outline on top. No ids are used so the SVGs can
 * be inlined many times on one page.
 */
export interface TokenArt {
  id: string;
  name: string;
  /** primary hue of the token, also used for that player's UI accents */
  color: string;
  svg: string;
}

const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';
const STICKER =
  '<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">';
const INK =
  '<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">';
const END = '</g></svg>';

const HAT_SVG =
  OPEN +
  STICKER +
  '<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z"/>' +
  '<rect x="8" y="45" width="48" height="9" rx="4"/>' +
  '</g>' +
  INK +
  '<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z" fill="#8e5bc4"/>' +
  '<path d="M41 14 L43.8 13.4 L45.8 44.8 L42.5 44.8 Z" fill="#6b3f9e" stroke="none"/>' +
  '<rect x="17.5" y="36" width="29" height="6.5" fill="#6b3f9e"/>' +
  '<rect x="8" y="45" width="48" height="9" rx="4" fill="#8e5bc4"/>' +
  '<rect x="11" y="49.5" width="42" height="3" fill="#6b3f9e" stroke="none"/>' +
  '<circle cx="26" cy="25" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="38" cy="25" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="22.5" cy="29.5" r="1.7" fill="#e8649c" stroke="none"/>' +
  '<path d="M27 30 Q32 34.5 37 30" fill="none"/>' +
  END;

const BOAT_SVG =
  OPEN +
  STICKER +
  '<path d="M32 8 L32 42"/>' +
  '<path d="M32 8 L42 11 L32 14 Z"/>' +
  '<path d="M29 16 L29 40 L13 40 Z"/>' +
  '<path d="M35 12 L35 40 L55 40 Z"/>' +
  '<path d="M6 42 L58 42 L52 56 L12 56 Z"/>' +
  '</g>' +
  INK +
  '<path d="M32 8 L32 42" fill="none"/>' +
  '<path d="M29 16 L29 40 L13 40 Z" fill="#fffaf0"/>' +
  '<path d="M27.8 31 L27.8 38.6 L18.6 38.6 Z" fill="#e4dfd3" stroke="none"/>' +
  '<path d="M35 12 L35 40 L55 40 Z" fill="#fffaf0"/>' +
  '<path d="M36.5 26 L44.4 26 L48.4 31.8 L36.5 31.8 Z" fill="#2f6fd6" stroke="none"/>' +
  '<path d="M32 8 L42 11 L32 14 Z" fill="#d9413a"/>' +
  '<path d="M6 42 L58 42 L52 56 L12 56 Z" fill="#2f6fd6"/>' +
  '<path d="M11 51.5 L53 51.5 L51.5 54.6 L12.5 54.6 Z" fill="#1f4fa3" stroke="none"/>' +
  '<circle cx="26" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="38" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<path d="M27.5 49.5 Q32 53 36.5 49.5" fill="none"/>' +
  END;

const DOG_SVG =
  OPEN +
  STICKER +
  '<path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z"/>' +
  '<path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z"/>' +
  '<path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z"/>' +
  '<ellipse cx="25" cy="56" rx="5.5" ry="3.5"/>' +
  '<ellipse cx="39" cy="56" rx="5.5" ry="3.5"/>' +
  '<circle cx="32" cy="22" r="13"/>' +
  '</g>' +
  INK +
  '<path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z" fill="#c47a3c"/>' +
  '<path d="M40.5 35 Q44.6 37 44.6 42 L44.6 56.6 L40.5 56.6 Z" fill="#9a5a28" stroke="none"/>' +
  '<ellipse cx="25" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/>' +
  '<ellipse cx="39" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/>' +
  '<path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z" fill="#9a5a28"/>' +
  '<path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z" fill="#9a5a28"/>' +
  '<circle cx="32" cy="22" r="13" fill="#c47a3c"/>' +
  '<ellipse cx="32" cy="27" rx="7" ry="5" fill="#e6b07a" stroke="none"/>' +
  '<circle cx="27" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="37" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<ellipse cx="32" cy="25.5" rx="3" ry="2.2" fill="#2b2118" stroke="none"/>' +
  '<path d="M28.5 29 Q32 32.5 35.5 29" fill="none" stroke-width="2"/>' +
  END;

const CAR_SVG =
  OPEN +
  STICKER +
  '<rect x="3" y="24" width="12" height="4" rx="1.5"/>' +
  '<rect x="8" y="27" width="3.5" height="6"/>' +
  '<path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z"/>' +
  '<circle cx="18" cy="46" r="8"/>' +
  '<circle cx="46" cy="46" r="8"/>' +
  '</g>' +
  INK +
  '<rect x="8" y="27" width="3.5" height="6" fill="#a8302b"/>' +
  '<rect x="3" y="24" width="12" height="4" rx="1.5" fill="#a8302b"/>' +
  '<path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z" fill="#d9413a"/>' +
  '<path d="M6.5 39 L58.6 39 L59.4 44.6 L5.5 44.6 Z" fill="#a8302b" stroke="none"/>' +
  '<path d="M27 23 L40 23 L44 31 L24 31 Z" fill="#bfe3f5"/>' +
  '<circle cx="57.5" cy="37.5" r="2" fill="#f9e27a" stroke="none"/>' +
  '<circle cx="18" cy="46" r="8" fill="#2b2118"/>' +
  '<circle cx="46" cy="46" r="8" fill="#2b2118"/>' +
  '<circle cx="18" cy="46" r="3.5" fill="#fffaf0" stroke="none"/>' +
  '<circle cx="46" cy="46" r="3.5" fill="#fffaf0" stroke="none"/>' +
  '<circle cx="31.5" cy="26" r="1.8" fill="#2b2118" stroke="none"/>' +
  '<circle cx="37" cy="26" r="1.8" fill="#2b2118" stroke="none"/>' +
  '<path d="M31 28.5 Q34.5 31 38 28.5" fill="none" stroke-width="2"/>' +
  END;

const CAT_SVG =
  OPEN +
  STICKER +
  '<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="16"/>' +
  '<path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none"/>' +
  '<path d="M21 16 L23.5 4 L31 11 Z"/>' +
  '<path d="M43 16 L40.5 4 L33 11 Z"/>' +
  '<path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z"/>' +
  '<ellipse cx="26" cy="57" rx="5.5" ry="3.2"/>' +
  '<ellipse cx="38" cy="57" rx="5.5" ry="3.2"/>' +
  '<circle cx="32" cy="22" r="13"/>' +
  '</g>' +
  INK +
  '<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="9"/>' +
  '<path d="M43 53 Q56 53 55 41" fill="none" stroke="#e8649c" stroke-width="4"/>' +
  '<path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z" fill="#e8649c"/>' +
  '<path d="M39 37 Q42.6 39 42.6 44 L42.6 56.6 L39 56.6 Z" fill="#c24a7e" stroke="none"/>' +
  '<ellipse cx="26" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/>' +
  '<ellipse cx="38" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/>' +
  '<path d="M21 16 L23.5 4 L31 11 Z" fill="#e8649c"/>' +
  '<path d="M43 16 L40.5 4 L33 11 Z" fill="#e8649c"/>' +
  '<circle cx="32" cy="22" r="13" fill="#e8649c"/>' +
  '<path d="M23.5 11 L24.5 6.5 L28 9.5 Z" fill="#c24a7e" stroke="none"/>' +
  '<path d="M40.5 11 L39.5 6.5 L36 9.5 Z" fill="#c24a7e" stroke="none"/>' +
  '<path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none" stroke-width="2"/>' +
  '<circle cx="27" cy="21" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="37" cy="21" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<path d="M30 25.5 L34 25.5 L32 28 Z" fill="#2b2118" stroke="none"/>' +
  '<path d="M29 29 Q30.5 31 32 29 Q33.5 31 35 29" fill="none" stroke-width="2"/>' +
  END;

const ROCKET_SVG =
  OPEN +
  STICKER +
  '<path d="M21 36 L9 52 L21 50 Z"/>' +
  '<path d="M43 36 L55 52 L43 50 Z"/>' +
  '<path d="M25 43 L32 57 L39 43 Z"/>' +
  '<path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z"/>' +
  '</g>' +
  INK +
  '<path d="M25 43 L32 57 L39 43 Z" fill="#f2b632"/>' +
  '<path d="M28.5 45 L32 53 L35.5 45 Z" fill="#e8842f" stroke="none"/>' +
  '<path d="M21 36 L9 52 L21 50 Z" fill="#1d7f78"/>' +
  '<path d="M43 36 L55 52 L43 50 Z" fill="#1d7f78"/>' +
  '<path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z" fill="#2aa9a0"/>' +
  '<path d="M38 25 L41.3 25 L42.3 41.5 L38 41.5 Z" fill="#1d7f78" stroke="none"/>' +
  '<path d="M32 4 Q40 12 42 22 L22 22 Q24 12 32 4 Z" fill="#1d7f78"/>' +
  '<circle cx="32" cy="31" r="6.5" fill="#bfe3f5"/>' +
  '<circle cx="29.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/>' +
  '<circle cx="34.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/>' +
  '<path d="M29.5 33 Q32 35 34.5 33" fill="none" stroke-width="2"/>' +
  END;

const DUCK_SVG =
  OPEN +
  STICKER +
  '<path d="M12 40 L5 32 L20 35 Z"/>' +
  '<path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z"/>' +
  '<path d="M32 16 L50 21 L32 27.5 Z"/>' +
  '<circle cx="23" cy="22" r="12"/>' +
  '</g>' +
  INK +
  '<path d="M12 40 L5 32 L20 35 Z" fill="#f2b632"/>' +
  '<path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z" fill="#f2b632"/>' +
  '<path d="M12 52 L54 52 Q51.5 56.6 42 56.6 L22 56.6 Q13 56.6 12 52 Z" fill="#d99a1e" stroke="none"/>' +
  '<path d="M27 41 Q40 35 50 44 Q40 52 27 46 Z" fill="#d99a1e"/>' +
  '<path d="M32 16 L50 21 L32 27.5 Z" fill="#e8842f"/>' +
  '<path d="M37 21.6 L47.5 21.2" fill="none" stroke-width="1.6"/>' +
  '<circle cx="23" cy="22" r="12" fill="#f2b632"/>' +
  '<circle cx="21" cy="19" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="28" cy="19" r="2.2" fill="#2b2118" stroke="none"/>' +
  '<circle cx="17.5" cy="24.5" r="1.8" fill="#f5a3a3" stroke="none"/>' +
  END;

const ROBOT_SVG =
  OPEN +
  STICKER +
  '<path d="M32 12 L32 8"/>' +
  '<circle cx="32" cy="7" r="2.6"/>' +
  '<rect x="14" y="19" width="4" height="8" rx="1"/>' +
  '<rect x="46" y="19" width="4" height="8" rx="1"/>' +
  '<rect x="18" y="13" width="28" height="20" rx="3"/>' +
  '<rect x="28" y="33" width="8" height="3"/>' +
  '<rect x="8" y="37" width="6" height="14" rx="2"/>' +
  '<rect x="50" y="37" width="6" height="14" rx="2"/>' +
  '<rect x="16" y="35" width="32" height="18" rx="2.5"/>' +
  '<rect x="20" y="53" width="9" height="7" rx="1.5"/>' +
  '<rect x="35" y="53" width="9" height="7" rx="1.5"/>' +
  '</g>' +
  INK +
  '<path d="M32 12 L32 8" fill="none"/>' +
  '<circle cx="32" cy="7" r="2.6" fill="#d9413a"/>' +
  '<rect x="14" y="19" width="4" height="8" rx="1" fill="#2c7f41"/>' +
  '<rect x="46" y="19" width="4" height="8" rx="1" fill="#2c7f41"/>' +
  '<rect x="28" y="33" width="8" height="3" fill="#2c7f41"/>' +
  '<rect x="8" y="37" width="6" height="14" rx="2" fill="#3aa655"/>' +
  '<rect x="50" y="37" width="6" height="14" rx="2" fill="#3aa655"/>' +
  '<rect x="20" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/>' +
  '<rect x="35" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/>' +
  '<rect x="16" y="35" width="32" height="18" rx="2.5" fill="#3aa655"/>' +
  '<rect x="43" y="37" width="3.5" height="14.5" fill="#2c7f41" stroke="none"/>' +
  '<rect x="24" y="39" width="16" height="10" rx="1.5" fill="#2c7f41"/>' +
  '<circle cx="28" cy="44" r="1.7" fill="#f2b632" stroke="none"/>' +
  '<circle cx="32" cy="44" r="1.7" fill="#d9413a" stroke="none"/>' +
  '<circle cx="36" cy="44" r="1.7" fill="#bfe3f5" stroke="none"/>' +
  '<rect x="18" y="13" width="28" height="20" rx="3" fill="#3aa655"/>' +
  '<circle cx="26" cy="22" r="3.2" fill="#fffaf0"/>' +
  '<circle cx="38" cy="22" r="3.2" fill="#fffaf0"/>' +
  '<circle cx="26" cy="22" r="1.5" fill="#2b2118" stroke="none"/>' +
  '<circle cx="38" cy="22" r="1.5" fill="#2b2118" stroke="none"/>' +
  '<path d="M27 28 Q32 31 37 28" fill="none" stroke-width="2"/>' +
  END;

export const TOKENS: TokenArt[] = [
  { id: 'hat', name: 'Top Hat', color: '#8e5bc4', svg: HAT_SVG },
  { id: 'boat', name: 'Sailboat', color: '#2f6fd6', svg: BOAT_SVG },
  { id: 'dog', name: 'Dog', color: '#c47a3c', svg: DOG_SVG },
  { id: 'car', name: 'Race Car', color: '#d9413a', svg: CAR_SVG },
  { id: 'cat', name: 'Cat', color: '#e8649c', svg: CAT_SVG },
  { id: 'rocket', name: 'Rocket', color: '#2aa9a0', svg: ROCKET_SVG },
  { id: 'duck', name: 'Rubber Duck', color: '#f2b632', svg: DUCK_SVG },
  { id: 'robot', name: 'Robot', color: '#3aa655', svg: ROBOT_SVG },
];
