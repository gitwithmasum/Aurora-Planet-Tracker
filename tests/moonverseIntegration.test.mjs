import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Moonverse is discoverable by navigation, dashboard and universal search',()=>{
 const app=src('src/App.jsx');
 assert.match(app,/const Moonverse=lazy\(\(\)=>import\('\.\/Moonverse\.jsx'\)\)/);
 assert.match(app,/<FeatureBoundary name="Moonverse">/);
 assert.match(app,/\['Moonverse',Orbit\]/);
 assert.match(src('src/Sidebar.jsx'),/'Planet Intelligence','Moonverse'/);
 assert.match(src('src/AuroraDashboard.jsx'),/name:'Moonverse'/);
 assert.match(src('src/spaceSearch.mjs'),/name:'Moonverse'/);
});
test('Solar System and Planet Intelligence link to selected world moon system',()=>{
 const app=src('src/App.jsx');
 assert.match(app,/EXPLORE NATURAL MOONS/);
 assert.match(app,/EXPLORE \{selected\.name\.toUpperCase\(\)\} MOON SYSTEM/);
 assert.match(app,/initialPlanet=\{selected\.name\}/);
});
test('Moonverse scientific source links, no false live-position claims',()=>{
 const ui=src('src/Moonverse.jsx');
 const catalog=src('src/moonCatalog.mjs');
 assert.match(ui,/SIMULATION/);
 assert.match(ui,/not Horizons predictions/);
 assert.match(ui,/source\w*/i);
 assert.match(catalog,/ssd\.jpl\.nasa\.gov\/sats\/phys_par/);
 assert.match(catalog,/science\.nasa\.gov\/solar-system\/moons/);
 assert.match(catalog,/not a complete/);
});
test('Moonverse 3D is itself lazy and respects reduced-motion and visibility',()=>{
 const ui=src('src/Moonverse.jsx');
 const scene=src('src/MoonverseScene.jsx');
 assert.match(ui,/const MoonverseScene=lazy/);
 assert.match(ui,/new IntersectionObserver/);
 assert.match(ui,/document\.visibilityState/);
 assert.match(ui,/prefers-reduced-motion: reduce/);
 assert.match(scene,/frameloop=\{active&&speed>0\?'always':'demand'\}/);
 assert.match(scene,/moons\.slice\(0,12\)/);
});
test('Moonverse has responsive layout and no forced cloud/GPS connection',()=>{
 const css=src('src/Moonverse.css');
 const ui=src('src/Moonverse.jsx');
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.doesNotMatch(ui,/getCurrentPosition|fetch\(|getUserMedia/);
 assert.match(ui,/aria-label="Search natural moons"/);
});
test('Moonverse appears in English and Bangla locale and browser QA',()=>{
 const i18n=src('src/i18n.jsx');
 assert.match(i18n,/moonverse:'Moonverse Observatory'/);
 assert.match(i18n,/moonverse:'প্রাকৃতিক উপগ্রহের জগৎ'/);
 const qa=src('scripts/browser-qa.mjs');
 assert.match(qa,/moonverse-core-and-planet-selection/);
 assert.match(qa,/mobile-moonverse-catalog-and-layout/);
});
 
test('natural moons are indexed in Universal Search with deep-link navigation',()=>{
 const globalSearch=src('src/UniversalSearch.jsx');
 const index=src('src/spaceSearch.mjs');
 const app=src('src/App.jsx');
 assert.match(globalSearch,/moons:MOONS/);
 assert.match(globalSearch,/moon:'NATURAL MOON'/);
 assert.match(index,/makeItem\('moon',m\.id,m\.name/);
 assert.match(app,/item\.type==='moon'/);
 assert.match(app,/setMoonverseTarget\(moon\.id\)/);
 assert.match(app,/initialMoonId=\{moonverseTarget\}/);
});
