import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSpaceIndex,searchSpace,SPACE_MODULES} from '../src/spaceSearch.mjs';

const planets=[
 {name:'Earth',type:'Terrestrial',description:'Our blue home'},
 {name:'Mars',type:'Terrestrial',description:'The red planet'},
 {name:'Neptune',type:'Ice giant',description:'A blue planet'}
];
const galaxies=[
 {id:'m31',name:'Andromeda Galaxy',other:'Messier 31',constellation:'Andromeda'},
 {id:'m33',name:'Triangulum Galaxy',other:'Messier 33',constellation:'Triangulum'}
];
const satellites=[
 {id:'iss',name:'International Space Station',category:'ISS',noradId:25544},
 {id:'hubble',name:'Hubble Space Telescope',category:'Hubble',noradId:20580}
];
const index=buildSpaceIndex({planets,galaxies,satellites});
test('indexes planets satellites galaxies and existing modules',()=>{
 assert.equal(index.length,planets.length+satellites.length+galaxies.length+SPACE_MODULES.length);
 assert.equal(new Set(index.map(x=>x.id)).size,index.length);
});
test('search is case insensitive and chooses an exact planet first',()=>{
 assert.equal(searchSpace(index,' mArS ')[0].id,'planet:Mars');
 assert.equal(searchSpace(index,'earth')[0].id,'planet:Earth');
});
test('Messier aliases and official NORAD identifier find exact targets',()=>{
 assert.equal(searchSpace(index,'M31')[0].id,'galaxy:m31');
 assert.equal(searchSpace(index,'Messier 33')[0].id,'galaxy:m33');
 assert.equal(searchSpace(index,'25544')[0].id,'satellite:iss');
 assert.equal(searchSpace(index,'hubble')[0].id,'satellite:hubble');
});
test('matches module aliases and multi-token text independently of order',()=>{
 assert.ok(searchSpace(index,'nasa imagery').some(x=>x.id==='module:Earth Observation'));
 assert.ok(searchSpace(index,'orbit 3d').some(x=>x.id==='module:Command Center'));
});
test('empty search avoids huge lists and results obey limit',()=>{
 assert.deepEqual(searchSpace(index,'  '),[]);
 assert.equal(searchSpace(index,'planet',{limit:2}).length,2);
 assert.ok(searchSpace(index,'planet',{type:'planet'}).every(x=>x.type==='planet'));
});
test('missing catalog does not fabricate orbital records',()=>{
 const offline=buildSpaceIndex({planets,galaxies});
 assert.equal(searchSpace(offline,'25544').length,0);
 assert.ok(searchSpace(offline,'satellite').some(x=>x.id==='module:Satellite Tracker'));
});
test('search returns empty array for unavailable terms and is deterministic',()=>{
 assert.deepEqual(searchSpace(index,'nonexistent celestial object'),[]);
 assert.deepEqual(searchSpace(index,'earth'),searchSpace(index,'earth'));
});
