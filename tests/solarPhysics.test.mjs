import test from 'node:test';import assert from 'node:assert/strict';
import {solarOrbitRadius,solarPlanetRadius,spinRate,AXIAL_TILT,SEMIMAJOR_AU} from '../src/solarPhysics.mjs';
test('AU-distance mode keeps increasing orbit distances',()=>{const names=Object.keys(SEMIMAJOR_AU);const values=names.map(n=>solarOrbitRadius(n,'distance',4));assert.ok(values.every((v,i)=>i===0||v>values[i-1]));});
test('readable diagram mode preserves configured orbital radii',()=>assert.equal(solarOrbitRadius('Saturn','readable',13.3),13.3));
test('Venus and Uranus spin retrograde',()=>{assert.ok(spinRate('Venus')<0);assert.ok(spinRate('Uranus')<0);});
test('Uranus tilted near sideways',()=>assert.ok(AXIAL_TILT.Uranus>97&&AXIAL_TILT.Uranus<99));
test('distance scale is explicitly not physical-size accurate',()=>assert.ok(solarPlanetRadius('Mercury','distance',.3)>.383*.12));
