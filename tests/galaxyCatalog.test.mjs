import test from 'node:test';import assert from 'node:assert/strict';
import {GALAXIES,compassDirection,skyProjection,galaxyHorizontal,millionLightYears} from '../src/galaxyCatalog.mjs';
test('catalog has distinct galaxies with valid reference coordinates',()=>{assert.ok(GALAXIES.length>=10);assert.equal(new Set(GALAXIES.map(g=>g.id)).size,GALAXIES.length);for(const g of GALAXIES){assert.ok(g.ra>=0&&g.ra<24);assert.ok(g.dec>=-90&&g.dec<=90);assert.ok(g.ly>0);}});
test('compass directions wrap around north',()=>{assert.equal(compassDirection(359),'N');assert.equal(compassDirection(90),'E');assert.equal(compassDirection(180),'S');});
test('horizon projection puts zenith at center and north above center',()=>{assert.deepEqual(skyProjection(0,90,0),{x:210,y:210});const p=skyProjection(0,0,0);assert.equal(p.x,210);assert.ok(p.y<210);});
test('real observer altitude changes with time for Andromeda',()=>{const g=GALAXIES[0];const a=galaxyHorizontal(g,new Date('2026-10-15T18:00:00Z'),23.81,90.41);const b=galaxyHorizontal(g,new Date('2026-10-15T22:00:00Z'),23.81,90.41);assert.ok(Number.isFinite(a.alt)&&Number.isFinite(b.alt));assert.ok(Math.abs(a.alt-b.alt)>1);});
test('catalog distance labels use light-years, not kilometers',()=>{assert.ok(millionLightYears(2537000).includes('Mly'));assert.ok(millionLightYears(163000).includes('kly'));});
