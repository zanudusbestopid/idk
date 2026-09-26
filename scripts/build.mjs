// Builds the browser client and then the single-file server bundle with the
// client embedded, so the deliverable is one JavaScript file: dist/paper-tycoon.js
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
await mkdir('dist/public', { recursive: true });

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
