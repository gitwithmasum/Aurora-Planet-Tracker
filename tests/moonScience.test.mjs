import test from 'node:test';
import assert from 'node:assert/strict';
import {MOONS,moonsForPlanet,moonById} from '../src/moonCatalog.mjs';
import {PHYSICAL_PARAMETERS,physicalParameters,moonScience,moonComparison,searchMoonScience,PHYSICAL_SOURCE} from '../src/moonScience.mjs';
import {MOON_MEDIA,moonMedia,nasaImageQuery,extractNasaThumbnail} from '../src/moonMedia.mjs';

test('v5.1 expands catalog with NASA/JPL confirmed moon orbits and does not invent Mercury/Venus moons',()=>{
 assert.equal(MOONS.length,43);
 assert.equal(moonsForPlanet('Mercury').length,0);
 assert.equal(moonsForPlanet('Venus').length,0);
 assert.equal(moonsForPlanet('Saturn').some(m=>m.id==='janus'),true);
 assert.equal(moonsForPlanet('Jupiter').some(m=>m.id==='thebe'),true);
});
test('JPL source covers every selected moon with unique NAIF satellite ID',()=>{
 assert.ok(PHYSICAL_SOURCE.startsWith('https://ssd.jpl.nasa.gov/'));
 for(const moon of MOONS)assert.ok(PHYSICAL_PARAMETERS[moon.id],'Missing JPL physical record '+moon.id);
 const codes=MOONS.map(m=>PHYSICAL_PARAMETERS[m.id].naifCode);
 assert.equal(new Set(codes).size,codes.length);
});
test('Europa JPL GM/density and derived surface gravity are numerically consistent',()=>{
 const europa=physicalParameters(moonById('europa'));
 assert.equal(europa.naifCode,502);
 assert.equal(europa.gmKm3S2,3202.71210);
 assert.equal(europa.densityGcm3,3.0130);
 assert.ok(Math.abs(europa.gravityMS2-1.315)<.003);
 assert.ok(Math.abs(europa.escapeVelocityMS-2025)<8);
 assert.equal(europa.quality,'estimated');
});
test('large-world gravity is stronger than small moon gravity',()=>{
 assert.ok(physicalParameters(moonById('titan')).gravityMS2>physicalParameters(moonById('phobos')).gravityMS2);
 assert.ok(physicalParameters(moonById('ganymede')).massKg>physicalParameters(moonById('io')).massKg);
});
test('Nereid zero GM and unmeasured Pluto moons remain unknown, not zero',()=>{
 for(const name of ['nereid','kerberos','styx']){
  const d=physicalParameters(moonById(name));
  assert.equal(d.massKg,null);
  assert.equal(d.gravityMS2,null);
  assert.equal(d.escapeVelocityMS,null);
  assert.equal(d.quality,'not available');
 }
});
test('small irregular satellites with large uncertainties are not labeled precise',()=>{
 const atlas=physicalParameters(moonById('atlas'));
 const galatea=physicalParameters(moonById('galatea'));
 assert.ok(Number.isFinite(atlas.gravityMS2));
 assert.ok(galatea.gmUncertainty>1);
 assert.equal(galatea.quality,'very uncertain');
});
test('scientific interior statements distinguish observations and models',()=>{
 assert.equal(moonScience(moonById('enceladus')).status.evidence,'observed');
 assert.equal(moonScience(moonById('callisto')).status.evidence,'hypothesis');
 assert.match(moonScience(moonById('europa')).status.environment,/no confirmed life/);
 assert.equal(moonScience(moonById('thebe')).status,null);
});
test('search finds missions/NAIF identifiers, and category/radius filters are stable',()=>{
 const j=moonsForPlanet('Jupiter');
 assert.equal(searchMoonScience(j,{query:'502'})[0].id,'europa');
 assert.ok(searchMoonScience(j,{query:'Juno'}).some(m=>m.id==='io'));
 assert.ok(searchMoonScience(MOONS,{category:'retrograde'}).every(m=>m.category==='retrograde'));
 assert.ok(searchMoonScience(j,{minRadius:2000}).every(m=>m.radiusKm>=2000));
 assert.deepEqual(searchMoonScience(j,{sort:'radius-desc'}).slice(0,2).map(x=>x.name),['Ganymede','Callisto']);
});
test('comparison deduplicates, accepts only four moons and never fills unknown as zero',()=>{
 const compare=moonComparison([moonById('titan'),moonById('titan'),moonById('nereid'),moonById('europa'),moonById('io'),moonById('phobos')]);
 assert.equal(compare.length,4);
 assert.equal(compare[1].gravityMS2,null);
 assert.equal(compare[1].densityGcm3,null);
 assert.equal(compare[0].planet,'Saturn');
});
test('NASA images are curated to actual photojournal records, with known IDs and attribution',()=>{
 for(const [id,record] of Object.entries(MOON_MEDIA)){
  assert.match(record.nasaId,/^PIA\d{5}$/);
  assert.ok(record.page.startsWith('https://science.nasa.gov/'));
  assert.match(record.credit,/NASA/);
  assert.equal(moonMedia(id),record);
  assert.ok(nasaImageQuery(record).includes('nasa_id='+record.nasaId));
 }
 assert.equal(moonMedia('thebe'),null);
});
test('NASA thumbnail extraction rejects lookalike assets from non-NASA domains or wrong ID',()=>{
 const record=moonMedia('europa');
 const payload={collection:{items:[
  {data:[{nasa_id:record.nasaId}],links:[
   {rel:'preview',href:'https://evil.example.org/fake.jpg'},
   {rel:'preview',href:'https://images-assets.nasa.gov/image/PIA01295/thumb.jpg'}
  ]}
 ]}};
 assert.equal(extractNasaThumbnail(payload,record),'https://images-assets.nasa.gov/image/PIA01295/thumb.jpg');
 assert.equal(extractNasaThumbnail(payload,moonMedia('titan')),null);
 assert.equal(extractNasaThumbnail({collection:{}},record),null);
});
