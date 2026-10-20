import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Moonverse loads same-origin static data, never embeds JPL API in browser fetch',()=>{
 const source=read('src/Moonverse.jsx');
 assert.match(source,/fetch\(import\.meta\.env\.BASE_URL\+HORIZONS_PATH/);
 assert.doesNotMatch(source,/fetch\(HORIZONS_SOURCE/);
 assert.match(source,/validateHorizonsSnapshot\(data\)/);
 assert.match(source,/setSnapshot\(null\)/);
});
test('JPL mode can be activated only for verified selected planet and UTC coverage',()=>{
 const source=read('src/Moonverse.jsx');
 assert.match(source,/disabled=\{!scientificEnabled\}/);
 assert.match(source,/verifiedForPlanet\.length>0/);
 assert.match(source,/effectiveMode=orbitalMode==='horizons'&&scientificEnabled\?'horizons':'model'/);
 assert.match(source,/datetime-local/);
 assert.match(source,/getTime\(\)/);
});
test('renderer hides moons without scientific vectors in scientific mode',()=>{
 const scene=read('src/MoonverseScene.jsx');
 assert.match(scene,/mode!=='horizons'\|\|!!interpolateHorizons/);
 assert.match(scene,/horizonTrail/);
 assert.match(scene,/horizonDisplayPosition/);
 assert.match(scene,/<line geometry=\{line\}>/);
 assert.match(scene,/<lineLoop geometry=\{line\}>/);
});
test('server-only serial refresh and scheduled static hosting satisfy JPL usage constraints',()=>{
 const script=read('scripts/refresh-horizons.mjs');
 const workflow=read('.github/workflows/deploy-pages.yml');
 assert.match(script,/for\(const body of HORIZONS_BODIES\)/);
 assert.doesNotMatch(script,/Promise\.all\(/);
 assert.match(script,/VEC_CORR:quoted\('NONE'\)/);
 assert.match(script,/TIME_TYPE:quoted\('UT'\)/);
 assert.match(workflow,/node scripts\/refresh-horizons\.mjs/);
 assert.match(workflow,/cron:/);
});
test('missing real ephemeris starts in explicit unavailable fallback',()=>{
 const file=JSON.parse(read('public/orbital-data/horizons-v5.2.json'));
 assert.equal(file.format,'aurora-horizons-v1');
 assert.equal(file.createdAt,null);
 assert.deepEqual(file.targets,{});
});
test('browser QA exercises both JPL synthetic fixture and educational mode',()=>{
 const script=read('scripts/browser-qa.mjs');
 assert.match(script,/horizons-jpl-synthetic-fixture-and-safe-fallback/);
 assert.match(script,/page\.route\('\*\*\/orbital-data\/horizons-v5\.2\.json'/);
 assert.match(script,/JPL HORIZONS SNAPSHOT/);
 assert.match(script,/EDUCATIONAL ORBITS/);
});
