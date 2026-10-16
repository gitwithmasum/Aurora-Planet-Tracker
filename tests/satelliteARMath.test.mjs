import test from 'node:test';
import assert from 'node:assert/strict';
import {guidingOffset,projectSatellite,wrapAzimuth,signedAngle} from '../src/satelliteARMath.mjs';
test('azimuth wrapping handles north and signed left-right guidance',()=>{
 assert.equal(wrapAzimuth(-5),355);
 assert.equal(signedAngle(350),-10);
 assert.equal(guidingOffset(90,40,75,30).turn,'Turn right');
 assert.equal(guidingOffset(90,40,105,50).turn,'Turn left');
 assert.equal(guidingOffset(90,40,90,40).aligned,true);
});
test('camera HUD projection puts aligned target at center, rejects below-horizon',()=>{
 const center=projectSatellite(180,30,180,30,65,16/9);
 assert.equal(center.inFrame,true);
 assert.ok(Math.abs(center.x-50)<1e-6&&Math.abs(center.y-50)<1e-6);
 assert.equal(projectSatellite(180,-10,180,-10,65,16/9).inFrame,false);
 assert.equal(projectSatellite(180,30,90,30,65,16/9).inFrame,false);
});
test('invalid orbit bearing cannot produce fabricated AR marker',()=>{
 assert.equal(projectSatellite(NaN,30,180,30),null);
 assert.equal(guidingOffset(45,NaN,50,20),null);
});
