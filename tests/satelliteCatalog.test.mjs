import test from 'node:test';
import assert from 'node:assert/strict';
import {SATELLITE_CATEGORIES,DEFAULT_SATELLITES,satelliteSearch,validatedSatellite} from '../src/satelliteCatalog.mjs';
test('curated categories include requested satellite families',()=>{
 for(const name of ['ISS','Tiangong','Hubble','Starlink','NOAA'])assert.ok(SATELLITE_CATEGORIES.includes(name));
});
test('search matches names NORAD IDs and exact categories',()=>{
 assert.equal(satelliteSearch(DEFAULT_SATELLITES,'20580').length,1);
 assert.equal(satelliteSearch(DEFAULT_SATELLITES,'tiangong').length,1);
 assert.equal(satelliteSearch(DEFAULT_SATELLITES,'','NOAA').length,2);
});
test('invalid, missing or stale orbital elements never produce positions',()=>{
 assert.equal(validatedSatellite({id:'x',noradId:20580,line1:'',line2:'',epoch:new Date().toISOString()}),null);
 assert.equal(validatedSatellite({noradId:25544,line1:'1 25544',line2:'2 25544',epoch:'2020-01-01T00:00:00Z'}),null);
});
