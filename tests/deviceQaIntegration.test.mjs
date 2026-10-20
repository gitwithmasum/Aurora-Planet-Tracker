import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('device QA is lazy-loaded and isolated in its own feature boundary',()=>{
 const app=source('src/App.jsx');
 assert.match(app,/const DeviceQACenter=lazy\(\(\)=>import\('\.\/DeviceQACenter\.jsx'\)\)/);
 assert.match(app,/<FeatureBoundary name="Device QA">/);
 assert.match(app,/<DeviceQACenter onNavigate=\{setTab\}\/>/);
});
test('device QA is discoverable in sidebar, dashboard, search and both languages',()=>{
 assert.match(source('src/Sidebar.jsx'),/'Offline Recovery','Device QA'/);
 assert.match(source('src/AuroraDashboard.jsx'),/name:'Device QA'/);
 assert.match(source('src/spaceSearch.mjs'),/name:'Device QA'/);
 const messages=source('src/i18n.jsx');
 assert.match(messages,/deviceQA:'Device QA'/);
 assert.match(messages,/deviceQA:'ডিভাইস যাচাই'/);
});
test('device diagnostics do not ask for GPS, camera, notifications or upload private data',()=>{
 const ui=source('src/DeviceQACenter.jsx');
 assert.doesNotMatch(ui,/getCurrentPosition\(|getUserMedia\(|requestPermission\(|fetch\(/);
 assert.match(ui,/storage\.estimate/);
 assert.match(ui,/navigator\.serviceWorker/);
 assert.match(ui,/browserFrameCadence/);
 assert.match(ui,/createObjectURL/);
});
test('Playwright routes through device QA and validates privacy-safe export',()=>{
 const script=source('scripts/browser-qa.mjs');
 assert.match(script,/device-qa-checks-and-sanitized-report/);
 assert.match(script,/RUN DEVICE CHECKS/);
 assert.match(script,/EXPORT PRIVACY-SAFE QA JSON/);
 assert.match(script,/report\.summary\.manualComplete,false/);
});
test('release device checklist is expressly manual and non-certifying',()=>{
 const guide=source('docs/DEVICE_QA_v4.9.md');
 assert.match(guide,/physical device/);
 assert.match(guide,/Android/);
 assert.match(guide,/Windows/);
 assert.match(guide,/iOS/);
 assert.match(guide,/NOT.*GPU FPS|Not.*GPU FPS/);
 assert.match(guide,/self-reported/);
});
