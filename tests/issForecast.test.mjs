import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudForecastAt,analyzeFullIssPass} from '../src/issVisibility.mjs';
test('UTC cloud forecast selects nearest valid hourly forecast',()=>{
 const forecast={times:['2026-10-16T00:00Z','2026-10-16T01:00Z'],clouds:[12,82]};
 assert.equal(cloudForecastAt(forecast,new Date('2026-10-16T00:48:00Z')),82);
 assert.equal(cloudForecastAt(forecast,new Date('2026-10-16T05:00:00Z')),null);
 assert.equal(cloudForecastAt(forecast,new Date('2026-10-16T01:00:00Z')),82);
});
test('missing and invalid forecasts cannot invent cloud percentages',()=>{
 assert.equal(cloudForecastAt(null,new Date()),null);
 assert.equal(cloudForecastAt({times:['2026-10-16T00:00Z'],clouds:[null]},new Date('2026-10-16T00:00Z')),null);
});
test('missing ISS pass returns unknown rather than fabricated timeline',()=>{
 const result=analyzeFullIssPass(null,null,23.81,90.41);
 assert.equal(result.classification,'Unknown');
 assert.equal(result.bestWindow,null);
});
