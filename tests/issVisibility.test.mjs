import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudLabel,assessIssPass} from '../src/issVisibility.mjs';
test('cloud cover categories stay bounded',()=>{
 assert.equal(cloudLabel(0),'Mostly clear');
 assert.equal(cloudLabel(60),'Mostly cloudy');
 assert.equal(cloudLabel(95),'Overcast');
 assert.equal(cloudLabel(null),'Unavailable');
});
test('no ISS pass is never promoted to visible',()=>{
 const r=assessIssPass(null,null,23.81,90.41);
 assert.equal(r.classification,'Unknown');
 assert.equal(r.sunlit,null);
});
