// The game's title as a heading: the theme's two words, or the theme pack's logo image over the second word.
import { h } from '../dom.js';
import { spriteCanvas } from '../art/pack.js';
import { THEME } from '../theme.js';

export function titleArt(): HTMLElement {
  const logo = spriteCanvas('logo', 1);
  if (logo) {
    return h('h1', { class: 'title-art title-art--logo' },
      h('img', { src: logo.toDataURL(), alt: THEME.title[0], class: 'title-logo' }),
      h('span', null, THEME.title[1]));
  }
  return h('h1', { class: 'title-art' }, h('span', null, THEME.title[0]), h('span', null, THEME.title[1]));
}
