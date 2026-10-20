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
 assert.equal(packageInfo.version,'4.8.1');
 assert.equal(packageInfo.devDependencies.playwright,'1.64.1');
 assert.equal(packageInfo.scripts['qa:browser'],'node scripts/browser-qa.mjs');
 assert.match(pipeline,/npm run qa:browser/);
 assert.match(pipeline,/VERCEL=1 npm run qa:browser/);
 assert.match(pipeline,/playwright install --with-deps chromium/);
});
test('build manifest and service worker versions match the release',()=>{
 const sw=source('public/sw.js');
 const manifest=source('scripts/build-offline-manifest.mjs');
 assert.match(sw,/const VERSION='aurora-v4\.8\.1'/);
 assert.match(manifest,/version:'4\.8\.1'/);
});
