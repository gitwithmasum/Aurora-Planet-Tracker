import test from 'node:test';
import assert from 'node:assert/strict';
import {validCoordinates,parseCoordinates,normalizePlace,weatherSummary} from '../src/globalEarthLocation.mjs';
test('geographic coordinates validate poles and antimeridian',()=>{
 assert.equal(validCoordinates(90,180),true);
 assert.equal(validCoordinates(-90,-180),true);
 assert.equal(validCoordinates(91,90),false);
 assert.deepEqual(parseCoordinates('23.8103','90.4125'),{lat:23.8103,lon:90.4125});
 assert.equal(parseCoordinates('','0'),null);
 assert.equal(parseCoordinates('45','190'),null);
});
test('public geocoder results require bounded coordinates and named country',()=>{
 assert.deepEqual(normalizePlace({id:1,name:'Kyoto',country:'Japan',latitude:35.01,longitude:135.76}).name,'Kyoto');
 assert.equal(normalizePlace({id:1,name:'Kyoto',country:'Japan',latitude:400,longitude:135}),null);
});
test('weather response preserves provider daily dates and numeric weather',()=>{
 const value={latitude:23.81,longitude:90.41,current:{time:'2026-10-17T00:00',temperature_2m:29,cloud_cover:30,precipitation:0,wind_speed_10m:4},daily:{time:['2026-10-15','2026-10-16'],temperature_2m_max:[33,34],temperature_2m_min:[24,25],precipitation_sum:[1,0]}};
 assert.equal(weatherSummary(value).history.length,2);
 assert.equal(weatherSummary(value).history[0].rainMm,1);
});
