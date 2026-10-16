import test from 'node:test';
import assert from 'node:assert/strict';
import {validCity,searchCities,locationCountries,cityInsights} from '../src/earthLocationInsights.mjs';
const make=(name,country)=>({name,country,lat:23.81,lon:90.41,observedAt:'2026-10-16T18:45:00Z',temperatureC:28,cloudPercent:25,precipitationMm:0,humidityPercent:60,windKmh:3,history:[{date:'2026-10-14',minC:22,maxC:30,rainMm:2},{date:'2026-10-15',minC:23,maxC:31,rainMm:0},{date:'2026-10-16',minC:24,maxC:32,rainMm:1}]});
test('curated city results validate coordinates and historical data',()=>{
 const p=make('Dhaka','Bangladesh');
 assert.equal(validCity(p),true);
 assert.equal(validCity({...p,lon:500}),false);
 assert.equal(validCity({...p,history:[]}),false);
});
test('location and country searches are case-insensitive and independent',()=>{
 const cities=[make('Dhaka','Bangladesh'),make('Tokyo','Japan'),make('Chattogram','Bangladesh')];
 assert.equal(searchCities(cities,'BANGLA').length,2);
 assert.equal(searchCities(cities,'tokyo','Japan').length,1);
 assert.equal(searchCities(cities,'tokyo','Bangladesh').length,0);
 assert.deepEqual(locationCountries(cities),['All','Bangladesh','Japan']);
});
test('historical aggregates use dated values rather than invented observations',()=>{
 const x=cityInsights(make('Dhaka','Bangladesh'));
 assert.equal(x.totalRainMm,3);
 assert.equal(x.highestC,32);
 assert.equal(x.lowestC,22);
 assert.equal(x.averageC,27);
 assert.equal(x.temperatureDeviationC,1);
 assert.equal(x.history.length,3);
});
