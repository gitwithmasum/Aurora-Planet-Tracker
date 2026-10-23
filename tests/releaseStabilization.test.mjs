import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('PWA update listener initializes its callbacks before subscribing',()=>{
 const code=source('src/PWAStatus.jsx');
 const effect=code.indexOf('useEffect(()=>{');
 const register=code.indexOf("document.addEventListener('visibilitychange',onVisible)",effect);
 const declare=code.indexOf('const onVisible=',effect);
 assert.ok(effect>=0&&declare>effect&&declare<register,'PWA visibility callback must exist before registration');
 assert.match(code,/if\(!live\|\|!registration\|\|!navigator\.onLine/);
 assert.match(code,/window\.confirm\(confirmText\)/,'User must approve PWA reload');
});
test('mobile drawer traps focus and restores body scroll after closing',()=>{
 const app=source('src/App.jsx');
 assert.match(app,/document\.body\.style\.overflow='hidden'/);
 assert.match(app,/document\.body\.style\.overflow=before/);
 assert.match(app,/event\.key==='Escape'/);
 assert.match(app,/event\.shiftKey&&document\.activeElement===first/);
 assert.match(app,/!event\.shiftKey&&document\.activeElement===last/);
});
test('responsive controls support touch targets and iOS input focus',()=>{
 const style=source('src/style.css');
 const nav=source('src/Sidebar.css');
 assert.match(style,/\.app > header\{\s*height:auto;min-height:70px/);
 assert.match(style,/font-size:max\(16px,1em\)/);
 assert.match(nav,/min-height:44px/);
 assert.match(nav,/safe-area-inset-bottom/);
});
test('Playwright QA checks on-disk browser profile persistence and real offline reload',()=>{
 const browser=source('scripts/browser-qa.mjs');
 assert.match(browser,/desktop-layout-and-navigation/);
 assert.match(browser,/mobile-drawer-keyboard-and-no-overflow/);
 assert.match(browser,/recovery-backup-restore-and-reload/);
 assert.match(browser,/mobile-pwa-service-worker-offline-reload/);
 assert.match(browser,/setOffline\(true\)/);
 assert.match(browser,/download\.path\(\)/);
});
test('release pipeline tests both deployment paths in headless Chromium',()=>{
 const packageInfo=JSON.parse(source('package.json'));
 const pipeline=source('.github/workflows/aurora-release-qa.yml');
 assert.equal(packageInfo.version,'6.1.1');
 assert.equal(packageInfo.devDependencies.playwright,'1.64.1');
 assert.equal(packageInfo.scripts['qa:browser'],'node scripts/browser-qa.mjs');
 assert.match(pipeline,/npm run qa:browser/);
 assert.match(pipeline,/VERCEL=1 npm run qa:browser/);
 assert.match(pipeline,/playwright install --with-deps chromium/);
});
test('build manifest and service worker versions match the release',()=>{
 const sw=source('public/sw.js');
 const manifest=source('scripts/build-offline-manifest.mjs');
 assert.ok(sw.includes("const VERSION='aurora-v6.1.1'"));
 assert.ok(manifest.includes("version:'6.1.1'"));
});


test('mobile Dashboard explicitly constrains CSS grid and search launcher',()=>{
 const css=source('src/AuroraDashboard.css');
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.auroraDashSearchLauncher\{display:flex/);
 assert.match(css,/\.auroraDashSearchLauncher span\{min-width:0/);
 const script=source('scripts/browser-qa.mjs');
 assert.match(script,/offenders/);
 assert.match(script,/data\.scroll<=data\.w\+2/);
});
test('live Pages smoke test uses the current universal search, not removed input',()=>{
 const script=source('scripts/browser-smoke.mjs');
 assert.match(script,/\.auroraDashSearchLauncher/);
 assert.match(script,/Search planets, satellites, galaxies or modules/);
 assert.doesNotMatch(script,/getByLabel\('Search dashboard modules'\)/);
 assert.match(script,/Satellite Tracker/);
});
test('releases pin compatible dependencies and do not bypass peer checks',()=>{
 const pkg=JSON.parse(source('package.json'));
 assert.equal(pkg.version,'6.1.1');
 assert.equal(pkg.devDependencies.vite,'6.3.5');
 assert.equal(pkg.devDependencies['@vitejs/plugin-react'],'4.7.0');
 for(const path of ['.github/workflows/deploy-pages.yml','.github/workflows/aurora-release-qa.yml']){
  const yaml=source(path);
  assert.match(yaml,/npm cache verify/);
  assert.doesNotMatch(yaml,/--legacy-peer-deps|--force/);
 }
});


test('Earth Observation avoids DOM portal teardown in its 3D labels',()=>{
 const scene=source('src/EarthObservation.jsx');
 const browser=source('scripts/browser-qa.mjs');
 assert.match(scene,/import \{OrbitControls,Stars,Text\} from '@react-three\/drei'/);
 assert.doesNotMatch(scene,/<Html\b|<\/Html>/);
 assert.match(browser,/earth-observation-return-dashboard-without-portal-errors/);
});
