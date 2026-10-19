import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWeatherResponse,weatherAtPeak,weatherMatchesObserver,evaluatePassConditions,forecastAgeStatus,WEATHER_MAX_AGE_MS} from '../src/satelliteWeatherMath.mjs';

const start=Date.parse('2026-10-20T00:00:00Z');
const payload={hourly:{
 time:['2026-10-20T00:00','2026-10-20T01:00','2026-10-20T02:00'],
 cloud_cover:[15,60,92],
 precipitation:[0,0.1,0.6],
 precipitation_probability:[2,20,88]
}};
const base=normalizeWeatherResponse(payload,{requestedAt:start,latitude:23.8,longitude:90.4});
const pass={maxAltitude:50};
const light={dark:true,sunlit:true};

test('validates hourly weather and preserves UTC model timestamps',()=>{
 assert.equal(base.items.length,3);
 assert.equal(base.items[0].time,start);
 assert.equal(base.items[2].precipitationMm,0.6);
 assert.equal(base.source,'Open-Meteo model forecast');
 assert.throws(()=>normalizeWeatherResponse({hourly:{time:['x'],cloud_cover:[]}}, {requestedAt:start,latitude:1,longitude:2}));
});
test('invalid or out of bounds cloud entries are dropped, not repaired into false confidence',()=>{
 const result=normalizeWeatherResponse({hourly:{time:['2026-10-20T00:00','2026-10-20T01:00'],cloud_cover:[50,120]}},{requestedAt:start,latitude:0,longitude:0});
 assert.equal(result.items.length,1);
 assert.throws(()=>normalizeWeatherResponse({hourly:{time:['2026-10-20T00:00'],cloud_cover:[NaN]}},{requestedAt:start,latitude:0,longitude:0}));
});
test('matches nearest forecast hour only within observed forecast coverage',()=>{
 assert.equal(weatherAtPeak(base,start+40*60000).time,start+3600000);
 assert.equal(weatherAtPeak(base,start+3*3600000+20*60000),null);
 assert.equal(weatherAtPeak(base,start-3*3600000),null);
 assert.equal(weatherAtPeak(base,NaN),null);
});
test('different observer locations cannot reuse previous weather data',()=>{
 assert.equal(weatherMatchesObserver(base,{lat:23.8,lon:90.4}),true);
 assert.equal(weatherMatchesObserver(base,{lat:23.81,lon:90.4}),false);
});
test('sunlight or dark observer geometry is required',()=>{
 assert.equal(evaluatePassConditions({pass,illumination:{sunlit:false,dark:true}}).label,'Earth shadow');
 assert.equal(evaluatePassConditions({pass,illumination:{sunlit:true,dark:false}}).label,'Sky too bright');
 assert.equal(evaluatePassConditions({pass:{maxAltitude:11},illumination:light}).label,'Low horizon');
 assert.equal(evaluatePassConditions({pass,illumination:{sunlit:null,dark:true}}).label,'Unknown');
});
test('missing forecast stays unknown rather than becoming a green window',()=>{
 const missing=evaluatePassConditions({pass,illumination:light});
 assert.equal(missing.level,'unknown');
 assert.equal(missing.weatherKnown,false);
});
test('model weather labels distinguish clear, mixed, extensive clouds and rain',()=>{
 assert.equal(evaluatePassConditions({pass,illumination:light,weather:base.items[0]}).level,'potential');
 assert.equal(evaluatePassConditions({pass,illumination:light,weather:base.items[1]}).level,'mixed');
 assert.equal(evaluatePassConditions({pass,illumination:light,weather:{cloudCover:85,precipitationMm:0}}).label,'Cloud limited');
 assert.equal(evaluatePassConditions({pass,illumination:light,weather:base.items[2]}).label,'Rain risk');
});
test('forecast status depends on acquisition time and expires after three hours',()=>{
 assert.equal(forecastAgeStatus(base,start+WEATHER_MAX_AGE_MS),'recent');
 assert.equal(forecastAgeStatus(base,start+WEATHER_MAX_AGE_MS+1),'old');
 assert.equal(forecastAgeStatus(null,start),'unavailable');
 assert.equal(forecastAgeStatus(base,start-120000),'invalid');
});
