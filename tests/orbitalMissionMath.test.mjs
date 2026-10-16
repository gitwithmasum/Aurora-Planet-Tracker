import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonRows,normalizeObservation,appendObservation,createObservation,catalogHealth,MAX_OBSERVATIONS} from '../src/orbitalMissionMath.mjs';
test('comparison rejects nonexistent records and caps three satellites',()=>{
 assert.deepEqual(comparisonRows([],new Date()),[]);
 const rows=Array.from({length:5},(_,i)=>({id:String(i),noradId:i+1,name:'Craft',satrec:null}));
 assert.equal(comparisonRows(rows,new Date()).length,3);
});
test('observation normalization filters invalid and unsafe entries',()=>{
 assert.equal(normalizeObservation({noradId:25544,latitude:NaN}),null);
 const obs=normalizeObservation({noradId:20580,name:'Hubble',latitude:15,longitude:25,altitudeKm:530,observedAt:'2026-10-16T00:00:00Z',note:'x'.repeat(500)});
 assert.equal(obs.note.length,240);
 assert.ok(obs.id);
});
test('history is deduplicated and bounded for performance',()=>{
 const t=Date.parse('2026-10-16T00:00:00Z');
 const craft={noradId:25544,name:'ISS'},telemetry={latitude:1,longitude:2,altitudeKm:420};
 const first=createObservation(craft,telemetry,t);
 assert.equal(appendObservation([first],first).length,1);
 let h=[];
 for(let i=0;i<MAX_OBSERVATIONS+20;i++)h=appendObservation(h,createObservation(craft,telemetry,t+i));
 assert.equal(h.length,MAX_OBSERVATIONS);
});
test('catalog health uses valid orbital epochs without fabricated values',()=>{
 assert.equal(catalogHealth([]).oldestHours,null);
 assert.equal(catalogHealth([{epoch:'2026-10-16T00:00:00Z'}],Date.parse('2026-10-16T06:00:00Z')).oldestHours,6);
});
