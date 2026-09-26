// Builds the browser client and then the single-file server bundle with the
// client embedded, so the deliverable is one JavaScript file: dist/paper-tycoon.js
import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const watch = process.argv.includes('--watch');
await mkdir('dist/public', { recursive: true });

// Build-time constants read by src/client/sprites.ts. The public build ships no
// default sheet; `PT_SHEET=<png> PT_NAMES=a:#hex,b,...` (eight) additionally produces a
// private build under dist/private with that sheet and those token names baked in.
const PUBLIC_DEFINE = { __DEFAULT_SHEET__: 'null', __TOKEN_NAMES__: 'null', __THEME__: 'null', __THEME_PACK__: 'null' };

// 1. Client bundle (JS + CSS) → dist/public
const client = await build({
  entryPoints: ['src/client/main.ts'],
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  target: ['es2020'],
  format: 'iife',
  outfile: 'dist/public/client.js',
  loader: { '.svg': 'text' },
  define: PUBLIC_DEFINE,
  logLevel: 'info',
});
if (client.errors.length) process.exit(1);
const html = await readFile('src/client/index.html', 'utf8');
await writeFile('dist/public/index.html', html);
let css = '';
try { css = await readFile('dist/public/client.css', 'utf8'); } catch { css = ''; }
const js = await readFile('dist/public/client.js', 'utf8');

// 2. Server bundle with the assets module replaced by embedded strings.
const embedAssets = {
  name: 'embed-assets',
  setup(b) {
    b.onResolve({ filter: /\.\/assets\.js$/ }, (args) => ({ path: 'embedded-assets', namespace: 'embed' }));
    b.onLoad({ filter: /.*/, namespace: 'embed' }, () => ({
      contents: `export function getAssets(){return {html:${JSON.stringify(html)},js:${JSON.stringify(js)},css:${JSON.stringify(css)}};}`,
      loader: 'js',
    }));
  },
};
const banner = `#!/usr/bin/env node\n// Paper Tycoon – single-file game server. Run: node paper-tycoon.js\n`;
await build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  format: 'esm',
  outfile: 'dist/paper-tycoon.js',
  banner: { js: banner + `import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);` },
  plugins: [embedAssets],
  minify: false,
  logLevel: 'info',
});
console.log('Built dist/paper-tycoon.js');

// 3. Single-player build: one standalone HTML file, plus the same page in the
//    form the claude.ai Artifact tool expects (no document skeleton).
// Fonts are embedded (from the @fontsource packages) so the standalone page needs no network.
async function fontFace(family, file, weight) {
  const data = await readFile(`node_modules/@fontsource/${file}`);
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2');}`;
}
const fontCss = (await Promise.all([
  fontFace('Fredoka', 'fredoka/files/fredoka-latin-400-normal.woff2', 400),
  fontFace('Fredoka', 'fredoka/files/fredoka-latin-500-normal.woff2', 500),
  fontFace('Fredoka', 'fredoka/files/fredoka-latin-600-normal.woff2', 600),
  fontFace('Fredoka', 'fredoka/files/fredoka-latin-700-normal.woff2', 700),
  fontFace('Patrick Hand', 'patrick-hand/files/patrick-hand-latin-400-normal.woff2', 400),
  fontFace('Press Start 2P', 'press-start-2p/files/press-start-2p-latin-400-normal.woff2', 400),
])).join('');
const fonts = `<style>${fontCss}</style>`;
const favicon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='6' y='6' width='52' height='52' rx='8' fill='%23fbf3e0' stroke='%232b2118' stroke-width='5'/%3E%3Crect x='6' y='6' width='52' height='14' rx='6' fill='%23d9413a' stroke='%232b2118' stroke-width='5'/%3E%3Ccircle cx='24' cy='40' r='4' fill='%232b2118'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%232b2118'/%3E%3C/svg%3E">`;

async function buildSolo(dir, define, opts = {}) {
  const title = opts.title ?? 'Paper Tycoon';
  const fontLinks = fonts;
  await mkdir(dir, { recursive: true });
  const solo = await build({
    entryPoints: ['src/client/single.ts'],
    bundle: true,
    minify: !watch,
    sourcemap: false,
    target: ['es2020'],
    format: 'iife',
    outfile: `${dir}/client.js`,
    loader: { '.svg': 'text' },
    define,
    logLevel: 'info',
  });
  if (solo.errors.length) process.exit(1);
  const soloJs = (await readFile(`${dir}/client.js`, 'utf8')).replace(/<\/script/gi, '<\\/script');
  let soloCss = '';
  try { soloCss = await readFile(`${dir}/client.css`, 'utf8'); } catch { soloCss = ''; }
  const body = `<div id="app" class="app"></div>\n<script>${soloJs}</script>`;
  const standalone = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>${title}</title>\n<meta name="description" content="A paper-craft property trading board game against computer players.">\n${fontLinks}\n${favicon}\n<style>${soloCss}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  await writeFile(`${dir}/paper-tycoon-solo.html`, standalone);
  const artifact = `<title>${title}</title>\n${fontLinks}\n<style>html,body{height:100%}${soloCss}</style>\n${body}\n`;
  await writeFile(`${dir}/artifact.html`, artifact);
}

await buildSolo('dist/solo', PUBLIC_DEFINE);
await copyFile('dist/solo/paper-tycoon-solo.html', 'dist/paper-tycoon-solo.html');
await copyFile('dist/solo/artifact.html', 'dist/artifact.html');
console.log('Built dist/paper-tycoon-solo.html and dist/artifact.html');

if (process.env.PT_SHEET) {
  const png = await readFile(process.env.PT_SHEET);
  const sheet = `data:image/png;base64,${png.toString('base64')}`;
  // PT_NAMES: eight comma-separated entries, each "Name" or "Name:#color".
  const names = (process.env.PT_NAMES ?? '').split(',').map((n) => n.trim()).filter(Boolean)
    .map((n) => { const m = /^(.*?)(?::(#[0-9a-fA-F]{3,8}))?$/.exec(n); return { name: m?.[1] ?? n, color: m?.[2] }; });
  // PT_THEME selects the text theme (src/shared/theme.ts); PT_PACK points at an atlas manifest
  // ({ image, sprites }) whose image is embedded as a data URL; PT_TITLE sets the page title.
  let pack = null;
  if (process.env.PT_PACK) {
    const manifest = JSON.parse(await readFile(process.env.PT_PACK, 'utf8'));
    const img = await readFile(join(dirname(process.env.PT_PACK), manifest.image));
    pack = { image: `data:image/png;base64,${img.toString('base64')}`, sprites: manifest.sprites };
  }
  await buildSolo('dist/private', {
    __DEFAULT_SHEET__: JSON.stringify(sheet),
    __TOKEN_NAMES__: JSON.stringify(names.length === 8 ? names : null),
    __THEME__: JSON.stringify(process.env.PT_THEME ?? null),
    __THEME_PACK__: JSON.stringify(pack),
  }, { title: process.env.PT_TITLE });
  console.log('Built private dist/private/paper-tycoon-solo.html and dist/private/artifact.html');
}
