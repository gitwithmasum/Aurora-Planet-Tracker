import test from 'node:test';
import assert from 'node:assert/strict';
import {HORIZONS_FORMAT,HORIZONS_STEP_MS,HORIZONS_BODIES,parseHorizonsVectorText,validateHorizonsSnapshot,interpolateHorizons,horizonsDistanceKm,horizonDisplayPosition,horizonTrail} from '../src/horizonsCore.mjs';
const epoch=Date.UTC(2026,9,21,0,0,0);
const jd=ms=>(ms/86400000+2440587.5).toFixed(9);
const row=(ms,x,y,z)=>jd(ms)+', A.D. 2026-Oct-21 00:00:00.0000, '+[x,y,z,.12,.23,.34].join(', ')+',';
const text=['Header data','$$SOE',row(epoch,100000,200000,300000),row(epoch+HORIZONS_STEP_MS,101000,202000,303000),'$$EOE','Footer'].join('\n');
const snapshot=({createdAt=new Date(epoch).toISOString(),rows=[
 [epoch,[100000,200000,300000],[.12,.23,.34]],
 [epoch+HORIZONS_STEP_MS,[101000,202000,303000],[.12,.23,.34]]
]}={})=>({format:HORIZONS_FORMAT,schema:1,createdAt,frame:'ICRF',timeScale:'UTC',units:'km',stepMinutes:60,
 targets:{europa:{naif:502,center:599,frame:'ICRF',rows}}});

test('canonical NAIF and planet-center mapping includes only curated moon targets',()=>{
 assert.ok(HORIZONS_BODIES.length>=9);
 assert.equal(new Set(HORIZONS_BODIES.map(x=>x.id)).size,HORIZONS_BODIES.length);
 assert.equal(HORIZONS_BODIES.find(x=>x.id==='europa').center,599);
 assert.equal(HORIZONS_BODIES.find(x=>x.id==='moon').center,399);
});
test('parse Horizons CSV vectors with UTC times, six finite coordinates',()=>{
 const data=parseHorizonsVectorText(text);
 assert.equal(data.length,2);
 assert.ok(Math.abs(data[0][0]-epoch)<2);
 assert.deepEqual(data[0][1],[100000,200000,300000]);
 assert.deepEqual(data[1][2],[.12,.23,.34]);
});
test('reject Horizons errors and malformed, nonincreasing or nonnumeric rows',()=>{
 assert.throws(()=>parseHorizonsVectorText('No matches found'),/markers/);
 assert.throws(()=>parseHorizonsVectorText('$$SOE\n'+row(epoch,0,0,0)+'\n'+row(epoch,0,0,0)+'\n$$EOE'),/out of order/);
 assert.throws(()=>parseHorizonsVectorText('$$SOE\n'+row(epoch,'NaN',0,0)+'\n'+row(epoch+HORIZONS_STEP_MS,0,0,0)+'\n$$EOE'),/invalid/);
});
test('snapshot schema rejects unknown coordinate frame, units, missing date and fabricated keys',()=>{
 assert.equal(validateHorizonsSnapshot({...snapshot(),frame:'ECLIPTIC'},{now:epoch}).valid,false);
 assert.equal(validateHorizonsSnapshot({...snapshot(),timeScale:'TDB'},{now:epoch}).valid,false);
 assert.equal(validateHorizonsSnapshot({...snapshot(),createdAt:null},{now:epoch}).valid,false);
 assert.equal(validateHorizonsSnapshot({...snapshot(),targets:{foo:{naif:502,center:599,frame:'ICRF',rows:[]}}},{now:epoch}).valid,false);
});
test('reject stale 72h snapshots and timestamps in the future',()=>{
 assert.equal(validateHorizonsSnapshot(snapshot(),{now:epoch+73*HORIZONS_STEP_MS}).valid,false);
 assert.equal(validateHorizonsSnapshot(snapshot(),{now:epoch-11*60000}).valid,false);
 assert.equal(validateHorizonsSnapshot(snapshot(),{now:epoch+HORIZONS_STEP_MS}).valid,true);
});
test('interpolate linearly only between existing valid hourly samples',()=>{
 const s=snapshot(),mid=interpolateHorizons(s,'europa',epoch+HORIZONS_STEP_MS/2);
 assert.deepEqual(mid.positionKm,[100500,201000,301500]);
 assert.equal(mid.interpolationMinutes,60);
 assert.equal(mid.sampled,false);
 assert.equal(interpolateHorizons(s,'europa',epoch).sampled,true);
 assert.equal(interpolateHorizons(s,'europa',epoch+2*HORIZONS_STEP_MS),null);
 assert.equal(interpolateHorizons(s,'other',epoch),null);
});
test('refuse interpolation over gaps larger than supported hour',()=>{
 const s=snapshot({rows:[[epoch,[10,20,30],[1,2,3]],[epoch+3*HORIZONS_STEP_MS,[20,30,40],[1,2,3]]]});
 assert.equal(interpolateHorizons(s,'europa',epoch+HORIZONS_STEP_MS),null);
});
test('ICRF direction mapping retains right-handed coordinate orientation',()=>{
 const state=interpolateHorizons(snapshot(),'europa',epoch);
 const pos=horizonDisplayPosition(state);
 assert.equal(pos.length,3);
 assert.ok(pos[0]>0&&pos[1]>0&&pos[2]<0);
 const d=horizonsDistanceKm(state);
 assert.ok(Math.abs(d-Math.hypot(100000,200000,300000))<.001);
});
test('scientific trails use only snapshot intervals, not synthetic closed ellipses',()=>{
 const rows=Array.from({length:4},(_,i)=>[epoch+i*HORIZONS_STEP_MS,[100+i,20+i,30+i],[0,0,0]]);
 const out=horizonTrail({rows},{atMs:epoch+2*HORIZONS_STEP_MS});
 assert.equal(out.length,4);
 assert.notDeepEqual(out[0],out.at(-1));
});
test('empty snapshot is unavailable; no scientific orbit without real vectors',()=>{
 const empty={format:HORIZONS_FORMAT,schema:1,createdAt:null,frame:'ICRF',timeScale:'UTC',units:'km',stepMinutes:60,targets:{}};
 assert.equal(validateHorizonsSnapshot(empty,{now:epoch}).valid,false);
 assert.equal(interpolateHorizons(empty,'europa',epoch),null);
});
