// Builds the browser client and then the single-file server bundle with the
// client embedded, so the deliverable is one JavaScript file: dist/paper-tycoon.js
import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
await mkdir('dist/public', { recursive: true });

// Build-time constants read by src/client/sprites.ts. The public build ships no
// default sheet; `PT_SHEET=<png> PT_NAMES=a:#hex,b,...` (eight) additionally produces a
// private build under dist/private with that sheet and those token names baked in.
const PUBLIC_DEFINE = { __DEFAULT_SHEET__: 'null', __TOKEN_NAMES__: 'null' };

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
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Patrick+Hand&display=swap" rel="stylesheet">';
const favicon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='6' y='6' width='52' height='52' rx='8' fill='%23fbf3e0' stroke='%232b2118' stroke-width='5'/%3E%3Crect x='6' y='6' width='52' height='14' rx='6' fill='%23d9413a' stroke='%232b2118' stroke-width='5'/%3E%3Ccircle cx='24' cy='40' r='4' fill='%232b2118'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%232b2118'/%3E%3C/svg%3E">`;

async function buildSolo(dir, define) {
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
  const standalone = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>Paper Tycoon</title>\n<meta name="description" content="A paper-craft property trading board game against computer players.">\n${fonts}\n${favicon}\n<style>${soloCss}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
  await writeFile(`${dir}/paper-tycoon-solo.html`, standalone);
  const artifact = `<title>Paper Tycoon</title>\n${fonts}\n<style>html,body{height:100%}${soloCss}</style>\n${body}\n`;
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
  await buildSolo('dist/private', {
    __DEFAULT_SHEET__: JSON.stringify(sheet),
    __TOKEN_NAMES__: JSON.stringify(names.length === 8 ? names : null),
  });
  console.log('Built private dist/private/paper-tycoon-solo.html and dist/private/artifact.html');
}
