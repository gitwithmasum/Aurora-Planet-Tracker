import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_WINDOWS,eventCategories,filterEarthEvents,sourceEventLink} from '../src/earthEventsExplorer.mjs';
const now=Date.parse('2026-10-16T18:00:00Z');
const data=[
 {id:'EONET_1',title:'Fire event',category:'Wildfires',date:'2026-10-16T10:00:00Z'},
 {id:'EONET_2',title:'Tropical storm',category:'Severe Storms',date:'2026-10-02T10:00:00Z'},
 {id:'EONET_3',title:'Old volcano',category:'Volcanoes',date:'2026-08-01T10:00:00Z'}
];
test('Earth event filters support advertised durations',()=>{
 assert.deepEqual(EVENT_WINDOWS,[7,14,30,90,365]);
 assert.equal(filterEarthEvents(data,{days:7},now).length,1);
 assert.equal(filterEarthEvents(data,{days:30},now).length,2);
 assert.equal(filterEarthEvents(data,{days:90},now).length,3);
});
test('category and search are independent and case-insensitive',()=>{
 assert.deepEqual(eventCategories(data),['All','Severe Storms','Volcanoes','Wildfires']);
 assert.equal(filterEarthEvents(data,{category:'Severe Storms',days:30},now)[0].id,'EONET_2');
 assert.equal(filterEarthEvents(data,{search:'FIRE',days:30},now)[0].id,'EONET_1');
 assert.equal(filterEarthEvents(data,{search:'Storm',days:7},now).length,0);
});
test('reject invalid source identifiers for outbound EONET links',()=>{
 assert.equal(sourceEventLink({id:'EONET_25340'}),'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_25340');
 assert.equal(sourceEventLink({id:'javascript:alert(1)'}),null);
});
