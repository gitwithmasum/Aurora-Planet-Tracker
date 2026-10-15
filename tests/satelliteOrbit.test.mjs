import test from 'node:test';
import assert from 'node:assert/strict';
import {geoToScene,satelliteTelemetry,orbitalSamples,segmentGroundTrack,EARTH_MODEL_RADIUS} from '../src/satelliteOrbit.mjs';
const EPS=1e-9;
test('equator and Greenwich face the positive model Z axis',()=>{
 const point=geoToScene(0,0,0);
 assert.ok(Math.abs(point[0])<EPS);assert.ok(Math.abs(point[1])<EPS);
 assert.ok(Math.abs(point[2]-EARTH_MODEL_RADIUS)<EPS);
});
test('north pole lies on model positive Y and altitude scales from center',()=>{
 const pole=geoToScene(90,0,0);assert.ok(Math.abs(pole[1]-EARTH_MODEL_RADIUS)<EPS);
 const high=geoToScene(0,0,420);assert.ok(high[2]>EARTH_MODEL_RADIUS);
});
test('invalid orbit does not show fabricated live telemetry',()=>{
 assert.equal(satelliteTelemetry(null,new Date()),null);
 assert.deepEqual(orbitalSamples(null,Date.now()),[]);
});
test('flat ground tracks split at international dateline',()=>{
 const points=[{latitude:0,longitude:170},{latitude:1,longitude:178},{latitude:2,longitude:-179},{latitude:3,longitude:-170},{latitude:4,longitude:-160}];
 const segments=segmentGroundTrack(points);
 assert.equal(segments.length,2);
 assert.equal(segments[0].length,2);assert.equal(segments[1].length,3);
});
