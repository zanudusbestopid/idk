// Static client assets. In the single-file production bundle this module is
// replaced at build time (see scripts/build.mjs) with the embedded strings.
// During development it reads the built client from dist/public.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function readPublic(name: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const dir of [join(here, '..', '..', 'dist', 'public'), join(here, '..', 'public'), join(process.cwd(), 'dist', 'public')]) {
    try { return readFileSync(join(dir, name), 'utf8'); } catch { /* try next */ }
  }
  return '';
}

export function getAssets(): { html: string; js: string; css: string } {
  return { html: readPublic('index.html'), js: readPublic('client.js'), css: readPublic('client.css') };
}
