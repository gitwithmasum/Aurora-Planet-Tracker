import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd();
test('PWA manifest declares install-sized app icons and standalone launch',()=>{
 const manifest=JSON.parse(readFileSync(join(root,'public/manifest.webmanifest'),'utf8'));
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.start_url&&manifest.scope);
 for(const size of ['192x192','512x512']){
  const icon=manifest.icons.find(item=>item.sizes===size);
  assert.ok(icon, 'Missing '+size+' app icon');
  assert.ok(existsSync(join(root,'public',icon.src)),'Missing icon file '+icon.src);
 }
});
test('HTML declares web manifest and iOS home-screen icon',()=>{
 const html=readFileSync(join(root,'index.html'),'utf8');
 assert.match(html,/<link rel="manifest"/);
 assert.match(html,/<link rel="apple-touch-icon"/);
});
test('install help supports Android Chrome and iOS Safari instructions',()=>{
 const source=readFileSync(join(root,'src/PWAStatus.jsx'),'utf8');
 assert.match(source,/Add to Home Screen/);
 assert.match(source,/Install app/);
 assert.match(source,/Safari/);
 assert.match(source,/beforeinstallprompt/);
});
test('service worker is registered under the app deployment base',()=>{
 const source=readFileSync(join(root,'src/sw-register.js'),'utf8');
 assert.match(source,/import\.meta\.env\.BASE_URL\+'sw\.js'/);
 assert.match(source,/scope:import\.meta\.env\.BASE_URL/);
});
