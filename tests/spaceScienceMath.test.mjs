import test from 'node:test';
import assert from 'node:assert/strict';
import {assessTle,summarizeOrbitCatalog,safeObserver,displayTleStatus} from '../src/spaceScienceMath.mjs';

const epoch='2026-10-20T00:00:00.000Z';
const satrec={no:2*Math.PI/90,inclo:Math.PI/2,ecco:0.001};
const craft={epoch,satrec};
const hour=60*60*1000;
const at=Date.parse(epoch);
test('derive orbit shape and mean motion with physically meaningful units',()=>{
 const m=assessTle(craft,at);
 assert.equal(m.status,'recent');
 assert.ok(Math.abs(m.periodMinutes-90)<1e-9);
 assert.ok(Math.abs(m.meanMotionRevDay-16)<1e-9);
 assert.ok(Math.abs(m.inclinationDeg-90)<1e-9);
 assert.equal(m.eccentricity,0.001);
});
test('TLE aging indicator is transparent and not an accuracy percentage',()=>{
 assert.equal(assessTle(craft,at+24*hour).status,'recent');
 assert.equal(assessTle(craft,at+24.01*hour).status,'monitor');
 assert.equal(assessTle(craft,at+72*hour).status,'monitor');
 assert.equal(assessTle(craft,at+72.01*hour).status,'aging');
 assert.equal(assessTle(craft,at-2*hour).status,'future');
 assert.equal(assessTle(craft,at+12*hour).ageHours,12);
});
test('no valid TLE means all orbit numbers absent',()=>{
 const m=assessTle({epoch,satrec:null},at);
 assert.equal(m.status,'unavailable');
 assert.equal(m.ageHours,null);
 assert.equal(m.periodMinutes,null);
 assert.equal(assessTle({epoch,satrec:{no:-1}},at).periodMinutes,null);
 assert.equal(assessTle({},at).status,'unavailable');
});
test('invalid eccentricity/inclination are not fabricated',()=>{
 const m=assessTle({epoch,satrec:{no:1,inclo:NaN,ecco:3}},at);
 assert.equal(m.eccentricity,null);
 assert.equal(m.inclinationDeg,null);
});
test('catalog summary counts epochs and omits absent entries',()=>{
 const items=[craft,{...craft,epoch:new Date(at-48*hour).toISOString()},{...craft,epoch:new Date(at-96*hour).toISOString()}];
 const m=summarizeOrbitCatalog(items,at);
 assert.deepEqual({count:m.count,recent:m.recent,monitor:m.monitor,aging:m.aging},{count:3,recent:1,monitor:1,aging:1});
 assert.equal(m.oldestHours,96);
 assert.equal(m.newestHours,0);
 assert.equal(summarizeOrbitCatalog([],at).oldestHours,null);
});
test('observer coordinates accept boundaries and reject invalid values',()=>{
 assert.deepEqual(safeObserver({lat:90,lon:-180}),{lat:90,lon:-180});
 assert.deepEqual(safeObserver({lat:'23.8',lon:'90.4'}),{lat:23.8,lon:90.4});
 assert.equal(safeObserver({lat:91,lon:0}),null);
 assert.equal(safeObserver({lat:0,lon:181}),null);
 assert.equal(safeObserver({lat:NaN,lon:0}),null);
 assert.equal(safeObserver({lat:null,lon:0}),null);
});
test('status labels are explicit rather than unsupported accuracy grades',()=>{
 assert.equal(displayTleStatus('recent'),'Recent elements');
 assert.equal(displayTleStatus('aging'),'Aging elements');
 assert.equal(displayTleStatus('unknown'),'Elements unavailable');
});
