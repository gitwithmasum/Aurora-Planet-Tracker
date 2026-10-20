import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('scientific tab lazy loads Surface & Interior without adding a permanent WebGL scene',()=>{
 const lab=read('src/MoonScienceLab.jsx');
 const surface=read('src/MoonGeologyExplorer.jsx');
 assert.match(lab,/MoonGeologyExplorer=lazy\(\(\)=>import\('\.\/MoonGeologyExplorer\.jsx'\)\)/);
 assert.match(lab,/\['geology',label\('SURFACE & INTERIOR'/);
 assert.match(lab,/<MoonGeologyExplorer moon=\{moon\}/);
 assert.doesNotMatch(surface,/Canvas|three|requestAnimationFrame/);
});
test('NASA feature atlas shows evidence and links with optional verified photo, never fake globe pins',()=>{
 const ui=read('src/MoonGeologyExplorer.jsx');
 assert.match(ui,/featuresForMoon|geologyForMoon/);
 assert.match(ui,/NASA SCIENTIFIC SOURCE/);
 assert.match(ui,/extractNasaThumbnail/);
 assert.match(ui,/NASA preview unavailable/);
 assert.match(ui,/No fabricated location pins/);
 assert.match(ui,/feature\.coords\.approximate/);
});
test('interior cutaway is marked not to scale and regions are selectable with evidence levels',()=>{
 const ui=read('src/MoonGeologyExplorer.jsx');
 assert.match(ui,/NOT TO SCALE/);
 assert.match(ui,/Select schematic interior layer/);
 assert.match(ui,/aria-pressed=\{selectedId===layer\.id\}/);
 assert.match(ui,/EVIDENCE/);
 assert.match(ui,/No layer thickness or radial boundary/);
});
test('invalid moon and absent science data show an explicit unavailable state',()=>{
 const ui=read('src/MoonGeologyExplorer.jsx');
 assert.match(ui,/if\(!profile\)return/);
 assert.match(ui,/No verified regional features/);
 assert.match(ui,/No fictitious cutaway is displayed/);
});
test('site preserves responsive and pink-gold halftone interface for geological research',()=>{
 const css=read('src/MoonGeologyExplorer.css');
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css, /theme-halftone/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /min-width:0/);
});
test('chromium QA drives feature, ocean cutaway and mobile layout',()=>{
 const script=read('scripts/browser-qa.mjs');
 assert.match(script,/Conamara Chaos/);
 assert.match(script,/SURFACE & INTERIOR/);
 assert.match(script,/INTERIOR CUTAWAY/);
 assert.match(script,/moonGeoInteriorDetail/);
 assert.match(script,/mobile-moonverse-catalog-and-layout/);
});
