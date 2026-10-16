import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_LAYERS,validWeatherPoint,validEarthEvent,markerColor,layerValue,ageHours} from '../src/earthScienceData.mjs';
test('all promised Earth science layer controls are enumerated',()=>{
 assert.deepEqual(EARTH_LAYERS.map(x=>x.id),['cloud','temperature','precipitation','events']);
});
test('weather points must have valid coordinates, readings and source timestamps',()=>{
 const point={name:'South Asia',lat:23,lon:80,observedAt:'2026-10-16T17:15:00Z',temperatureC:28,cloudPercent:80,precipitationMm:0};
 assert.equal(Boolean(validWeatherPoint(point)),true);
 assert.equal(Boolean(validWeatherPoint({...point,cloudPercent:120})),false);
 assert.equal(Boolean(validWeatherPoint({...point,lat:100})),false);
 assert.equal(Boolean(validWeatherPoint({...point,observedAt:'invalid'})),false);
 assert.equal(layerValue('cloud',point),'80% cloud');
 assert.equal(layerValue('temperature',point),'28.0°C');
 assert.equal(layerValue('precipitation',point),'0.0 mm');
 assert.match(markerColor('cloud',point),/rgb/);
});
test('NASA event locations and dates must be valid',()=>{
 const event={id:'EONET_1',title:'Tropical cyclone',lat:-10.8,lon:-163.3,date:'2026-10-16T06:00:00Z'};
 assert.equal(Boolean(validEarthEvent(event)),true);
 assert.equal(Boolean(validEarthEvent({...event,lon:-181})),false);
 assert.equal(Boolean(validEarthEvent({...event,date:'nope'})),false);
});
test('source age does not masquerade as latest refresh',()=>{
 const time='2026-10-16T10:00:00Z',now=Date.parse('2026-10-16T17:00:00Z');
 assert.equal(ageHours(time,now),7);
 assert.equal(ageHours('invalid'),Infinity);
});
