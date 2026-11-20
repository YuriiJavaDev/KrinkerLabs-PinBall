// Bundles src/ with esbuild. three.js is vendored (MIT) so no network is needed except for esbuild itself.
import { createRequire } from 'node:module';
import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let esbuild;
try { esbuild = require('esbuild'); } catch { esbuild = require('/opt/npm-tools/node_modules/esbuild'); }

const alias = { three: path.join(here, 'vendor/three/build/three.module.js') };
const test = process.argv.includes('--test');
rmSync(path.join(here, 'dist'), { recursive: true, force: true });
mkdirSync(path.join(here, 'dist'), { recursive: true });

if (test) {
  await esbuild.build({ entryPoints: [path.join(here, 'test/tests.ts')], bundle: true, platform: 'node',
    format: 'esm', outfile: path.join(here, 'dist/tests.js'), alias, logLevel: 'warning' });
} else {
  await esbuild.build({ entryPoints: [path.join(here, 'src/main.ts')], bundle: true, minify: true,
    format: 'esm', target: 'es2020', outfile: path.join(here, 'dist/app.js'), alias, logLevel: 'warning' });
  copyFileSync(path.join(here, 'index.html'), path.join(here, 'dist/index.html'));
}
console.log(test ? 'tests built' : 'built');
