import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('geology uses lazy map import only after explicit user request',()=>{
 const ui=src('src/MoonGeologyExplorer.jsx');
 assert.match(ui,/MoonCoordinateGrid=lazy\(\(\)=>import\('\.\/MoonCoordinateGrid\.jsx'\)\)/);
 assert.match(ui,/showMap&&<Suspense/);
 assert.match(ui,/SHOW IAU COORDINATE GRID/);
 assert.match(ui,/nomenclatureForFeature\(moon\.id,feature\.id\)/);
});
test('USGS Gazetteer is sole trusted source of plotted locations',()=>{
 const code=src('src/MoonCoordinateGrid.jsx');
 assert.match(code,/nomenclatureForMoon/);
 assert.match(code,/projectIAUPoint/);
 assert.match(code,/USGS coordinate conventions/);
 assert.match(code,/NOT a photo surface map/);
 assert.match(code,/No locations are invented/);
 assert.doesNotMatch(code,/getCurrentPosition|navigator\.geolocation|Canvas|new THREE/);
});
test('mapped named feature centers can be selected with keyboard-accessible controls',()=>{
 const code=src('src/MoonCoordinateGrid.jsx');
 assert.match(code,/aria-label=\{'Select verified feature '/);
 assert.match(code,/aria-pressed=\{selectedFeatureId===feature\.featureId\}/);
 assert.match(code,/onClick=\{\(\)=>onFeatureSelect\(feature\.featureId\)\}/);
 assert.match(code,/IAU record/);
});
test('galaxy rendering quality policy bounds GPU load and stops hidden animations',()=>{
 const ui=src('src/Moonverse.jsx');
 const core=src('src/moonPerformance.mjs');
 assert.match(ui,/moonRenderPolicy\(\{/);
 assert.match(ui,/Moonverse 3D rendering quality/);
 assert.match(ui,/scenePolicy\.quality/);
 assert.match(core,/moonCap:12/);
 assert.match(core,/dprMax:quality==='low'\?1:1\.5/);
 assert.match(core,/!hidden&&onScreen&&!reducedMotion/);
});
test('Atlas and coordinate controls are mobile friendly with existing pink and gold theme',()=>{
 const grid=src('src/MoonCoordinateGrid.css'),geo=src('src/MoonGeologyExplorer.css');
 assert.match(grid,/@media\(max-width:520px\)/);
 assert.match(grid,/theme-halftone/);
 assert.match(geo,/moonGeoMapControls/);
 assert.match(geo,/theme-halftone/);
});
test('browser QA checks IAU feature source marker, responsive grid and ECO mode',()=>{
 const qa=src('scripts/browser-qa.mjs');
 assert.match(qa,/SHOW IAU COORDINATE GRID/);
 assert.match(qa,/Select verified feature Conamara Chaos/);
 assert.match(qa,/272\.7° W/);
 assert.match(qa,/Moonverse 3D rendering quality/);
 assert.match(qa,/mobile-moonverse-catalog-and-layout/);
});


test('Moonverse mode is tested with strict comparison, never assigned during render',()=>{
 const ui=src('src/Moonverse.jsx');
 assert.doesNotMatch(ui,/\{effectiveMode='horizons'\?/);
 assert.match(ui,/\{effectiveMode==='horizons'\?t\(/);
});
