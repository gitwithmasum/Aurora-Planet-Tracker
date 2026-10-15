import test from 'node:test';
import assert from 'node:assert/strict';
import {remainingTime,upcomingAlertPass,shouldAnnounce,azimuthInstruction} from '../src/useSatellitePassAlert.js';
test('countdown formats hours, minutes and seconds and clamps past passes',()=>{
 assert.equal(remainingTime(600000),'00:10:00');
 assert.equal(remainingTime(61500),'00:01:02');
 assert.equal(remainingTime(-3000),'00:00:00');
});
test('a pass gets a warning only inside the ten-minute pre-pass window',()=>{
 const now=Date.parse('2026-10-16T12:00:00Z');
 assert.equal(shouldAnnounce(new Date(now+600001),now,false),false);
 assert.equal(shouldAnnounce(new Date(now+600000),now,false),true);
 assert.equal(shouldAnnounce(new Date(now+600000),now,true),false);
 assert.equal(shouldAnnounce(new Date(now-1000),now,false),false);
});
test('upcoming-pass selector ignores already-started or ended passes',()=>{
 const now=Date.parse('2026-10-16T12:00:00Z');
 const make=(s,e)=>({start:new Date(now+s),end:new Date(now+e)});
 const next=make(120000,500000);
 assert.equal(upcomingAlertPass([make(-500000,-100),make(-120000,100000),next],now),next);
 assert.equal(upcomingAlertPass([],now),null);
});
test('compass directions are true-north referenced, not device heading',()=>{
 assert.match(azimuthInstruction(90),/East|E \(90°/);
 assert.equal(azimuthInstruction(NaN),'Direction unavailable');
});
