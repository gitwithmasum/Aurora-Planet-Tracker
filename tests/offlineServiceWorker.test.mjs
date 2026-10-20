import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('service worker uses a versioned same-origin cache without user records',()=>{
 const sw=file('public/sw.js');
 assert.match(sw,/const VERSION='aurora-v4\.8\.1'/);
 assert.match(sw,/isLocal=url=>url\.origin===self\.location\.origin/);
 assert.doesNotMatch(sw,/localStorage|indexedDB|sessionStorage/);
 assert.match(sw,/const SHELL=VERSION\+'-shell'/);
});
test('offline install precaches lazy JS and CSS through the build index',()=>{
 const sw=file('public/sw.js');
 const script=file('scripts/build-offline-manifest.mjs');
 assert.match(sw,/offline-assets\.json/);
 assert.match(sw,/precache\(\)/);
 assert.match(sw,/manifest\.assets\.some\(path=>!safeAsset\(path\)\)/);
 assert.match(script,/OFFLINE_MAX_BYTES=24\*1024\*1024/);
 assert.match(script,/buildOfflineList/);
});
test('offline metadata reports partial cache honestly and does not invent fresh feeds',()=>{
 const sw=file('public/sw.js');
 assert.match(sw,/OFFLINE_STATUS_RESULT/);
 assert.match(sw,/shellReady&&assets\.length>0&&present===assets\.length/);
 assert.match(sw,/No promise of cached imagery, live weather or fresh TLEs/);
});
test('worker update is user-approved and waiting workers do not force reload',()=>{
 const pwa=file('src/PWAStatus.jsx');
 assert.match(pwa,/window\.confirm\(confirmText\)/);
 assert.match(pwa,/userApproved\.current=true/);
 assert.match(pwa,/if\(userApproved\.current\)window\.location\.reload\(\)/);
 assert.match(pwa,/waiting\.postMessage\(\{type:'SKIP_WAITING'\}\)/);
});
