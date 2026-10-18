import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
const BASE=process.env.VERCEL||process.env.VERCEL_ENV||process.env.VERCEL_URL?'/':'/Aurora-Planet-Tracker/';
const root=process.cwd();
test('production Vite HTML references bundled existing JS/CSS with correct deploy base',{skip:!existsSync(join(root,'dist/index.html'))},()=>{
 const html=readFileSync(join(root,'dist/index.html'),'utf8');
 assert.ok(!html.includes('Aurora startup recovery'),'Legacy startup recovery should not replace app');
 assert.ok(html.includes('aurora-autorepair-once'),'Scoped, once-only recovery should be present');
 const entries=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http'));
 assert.ok(entries.some(x=>x.endsWith('.js')),'expected JS entry');
 for(const entry of entries){assert.ok(entry.startsWith(BASE),'Asset must use correct deployment base: '+entry);const name=entry.slice(BASE.length);assert.ok(existsSync(join(root,'dist',name)),'Built file must exist for '+entry)}
});

test('dashboard true-color Earth artwork is bundled for offline/static deployment',{skip:!existsSync(join(root,'dist/index.html'))},()=>{
 const image=join(root,'dist/planet-textures/earth-blue-marble.jpg');
 assert.ok(existsSync(image),'True-color Earth must ship with the site and not depend on a third-party host');
 const signature=readFileSync(image).subarray(0,3);
 assert.deepEqual([...signature],[0xff,0xd8,0xff],'Bundled Earth artwork must be a JPEG');
});
