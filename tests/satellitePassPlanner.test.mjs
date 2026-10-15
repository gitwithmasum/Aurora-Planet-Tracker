import test from 'node:test';
import assert from 'node:assert/strict';
import {predictSatelliteCalendar,visibilityEstimate,alertShouldFire,uniquePassKey,alertDirection} from '../src/satellitePassPlanner.mjs';
test('satellite calendar fails closed without orbital records',()=>{
 assert.deepEqual(predictSatelliteCalendar(null,new Date(),23.81,90.41,7),[]);
 assert.equal(visibilityEstimate(null,null,23.81,90.41).score,null);
});
test('custom lead thresholds trigger only inside selected pre-pass window',()=>{
 const now=Date.parse('2026-10-16T13:00:00Z'),pass={start:new Date(now+9*60000)};
 assert.equal(alertShouldFire(pass,now,10),true);
 assert.equal(alertShouldFire(pass,now,5),false);
 assert.equal(alertShouldFire(pass,now,15,true),false);
 assert.equal(alertShouldFire({start:new Date(now-1000)},now,10),false);
 assert.equal(alertShouldFire(pass,now,12),false);
});
test('satellite-prefixed pass IDs prevent collision across spacecraft',()=>{
 const p={start:new Date('2026-10-16T13:00:00Z')};
 assert.notEqual(uniquePassKey(25544,p),uniquePassKey(20580,p));
 assert.match(alertDirection({azStart:90}),/E/);
});
