import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Dashboard uses full-bleed bundled Andromeda artwork without a separate card',()=>{
 const dashboard=readFileSync(new URL('../src/AuroraDashboard.jsx',import.meta.url),'utf8');
 const asset=readFileSync(new URL('../src/andromedaHero.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/AuroraDashboard.css',import.meta.url),'utf8');
 const data=asset.match(/data:image\/avif;base64,([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(data,'Embedded Andromeda AVIF asset should exist');
 const decoded=Buffer.from(data,'base64');
 assert.ok(decoded.length>3000,'Andromeda graphic should contain real image bytes');
 assert.equal(decoded.toString('ascii',4,12),'ftypavif','Artwork must be AVIF');
 assert.match(dashboard,/auroraDashHero--andromeda/);
 assert.match(dashboard,/--hero-art/);
 assert.match(css,/\.auroraDashHero--andromeda\s*\{/);
 assert.match(css,/var\(--hero-art\)/);
 assert.doesNotMatch(dashboard,/<AndromedaPreview\s*\/>/);
 assert.doesNotMatch(dashboard,/auroraDashAndromedaImage/);
 assert.doesNotMatch(dashboard,/<EarthPreview\s*\/>/);
 assert.doesNotMatch(dashboard,/<Canvas\b/,'Dashboard hero should no longer create a costly WebGL canvas');
});
