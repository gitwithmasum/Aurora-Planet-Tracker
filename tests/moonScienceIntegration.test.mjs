import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Moonverse science lab remains separate lazy module with WebGL error isolation',()=>{
 const ui=file('src/Moonverse.jsx');
 assert.match(ui,/MoonScienceLab=lazy\(\(\)=>import\('\.\/MoonScienceLab\.jsx'\)\)/);
 assert.match(ui,/<FeatureBoundary name="Moonverse Advanced Science">/);
 assert.match(ui,/<MoonScienceLab moon=\{selected\}\/>/);
});
test('moon catalog search filters by type and source-backed scientific sorting',()=>{
 const ui=file('src/Moonverse.jsx');
 assert.match(ui,/searchMoonScience\(all,/);
 assert.match(ui,/Filter moon category/);
 assert.match(ui,/Sort natural moons/);
 assert.match(ui,/JPL \{physicalParameters\(m\)\?\.naifCode/);
});
test('moon lab has on-demand official NASA image handling and graceful fallback',()=>{
 const ui=file('src/MoonScienceLab.jsx');
 assert.match(ui,/extractNasaThumbnail/);
 assert.match(ui,/OPEN VERIFIED NASA IMAGE/);
 assert.match(ui,/NASA thumbnail could not be fetched/);
 assert.match(ui,/noopener noreferrer/);
 assert.match(ui,/status==='loading'/);
});
test('science label carefully differentiates raw JPL measurements and derived values',()=>{
 const ui=file('src/MoonScienceLab.jsx');
 assert.ok(ui.includes('GM (JPL)'));
 assert.ok(ui.includes('Surface gravity (derived)'));
 assert.ok(ui.includes('Escape speed (derived)'));
 assert.match(ui,/DATA QUALITY:/);
 assert.match(ui,/unavailable/);
});
test('interior model includes evidence level with source and life not confirmed',()=>{
 const model=file('src/moonScience.mjs');
 assert.match(model,/evidence:'hypothesis'/);
 assert.match(model,/evidence:'strong evidence'/);
 assert.match(model,/no confirmed life/);
 assert.match(model,/gravityMS2/);
});
test('scientific comparison exposes no fabricated zero measurements',()=>{
 const ui=file('src/MoonScienceLab.jsx');
 assert.match(ui,/CompareMoons/);
 assert.match(ui,/moonComparison/);
 assert.match(ui,/Choose at least two different moons/);
 assert.match(ui,/Unknown measurements remain blank rather than zero/);
});
test('responsive Moonverse science layout and preserved theme',()=>{
 const css=file('src/MoonScienceLab.css');
 assert.match(css,/@media\(max-width:400px\)/);
 assert.match(css,/theme-halftone/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
});
test('Playwright includes science cards comparison and official NASA links',()=>{
 const script=file('scripts/browser-qa.mjs');
 assert.match(script,/PHYSICAL SCIENCE/);
 assert.match(script,/COMPARE MOONS/);
 assert.match(script,/NASA IMAGES/);
 assert.match(script,/OPEN VERIFIED NASA IMAGE/);
});
