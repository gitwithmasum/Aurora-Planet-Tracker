import test from 'node:test';
import assert from 'node:assert/strict';
import {skySummary,bodyPosition,moonPhase,upcomingSunEvents,direction,parseIssTle} from '../src/skyTonightMath.mjs';
test('observer sky produces finite body directions',()=>{
 const date=new Date('2026-10-15T18:00:00Z');const x=skySummary(date,23.8103,90.4125);
 assert.equal(x.planets.length,7);assert.ok(Number.isFinite(x.sun.alt));assert.ok(Number.isFinite(x.moon.az));assert.ok(x.phase===null||(x.phase>=0&&x.phase<=100));
});
test('sun crossings occur for Dhaka over a full day',()=>{const x=upcomingSunEvents(new Date('2026-10-15T12:00:00Z'),23.81,90.41,30);assert.ok(x.some(e=>e.event==='Evening'));assert.ok(x.some(e=>e.event==='Morning'));});
test('cardinal directions use true north clockwise',()=>{assert.equal(direction(0),'N');assert.equal(direction(90),'E');assert.equal(direction(180),'S');});
test('invalid orbital data does not generate fabricated ISS passes',()=>assert.throws(()=>parseIssTle('ISS no valid TLE here'),/Valid ISS orbital elements/));
