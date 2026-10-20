import test from 'node:test';
import assert from 'node:assert/strict';
import {MOONS,MOON_PLANETS,MOON_SOURCE,moonsForPlanet,moonById,moonPlanet,moonCatalogSummary} from '../src/moonCatalog.mjs';
import {validateMoonCatalog,moonOrbitPosition,moonOrbitPath,moonDrawRadius,moonRelativeEpoch,orbitalPhase,orbitalScale,sceneMoonList,MOON_ORBIT_EPOCH} from '../src/moonOrbitMath.mjs';

test('curated natural moon catalog covers every planet without inventing Mercury or Venus moons',()=>{
 assert.equal(MOON_PLANETS.length,9);
 assert.equal(moonsForPlanet('Mercury').length,0);
 assert.equal(moonsForPlanet('Venus').length,0);
 for(const planet of MOON_PLANETS.filter(x=>x.hasKnownMoons))assert.ok(moonsForPlanet(planet.name).length>=1);
 assert.ok(MOONS.length>=30);
 assert.equal(moonCatalogSummary().complete,false);
});
test('catalog IDs are unique, physical numeric properties are positive and sources are grounded',()=>{
 const result=validateMoonCatalog(MOONS);
 assert.equal(result.valid,true,result.errors.join('; '));
 assert.equal(new Set(MOONS.map(x=>x.id)).size,MOONS.length);
 assert.ok(MOONS.every(x=>x.simulated===true));
 assert.ok(MOONS.every(x=>x.dataSource===MOON_SOURCE.jpl));
 assert.equal(moonById('europa').planet,'Jupiter');
 assert.equal(moonById('nope'),null);
 assert.equal(moonPlanet('Pluto').kind,'Dwarf planet');
});
test('retrograde orbit is identified without falsely reversing physical period magnitude',()=>{
 const triton=moonById('triton'),phoebe=moonById('phoebe');
 assert.ok(triton.periodDays<0);
 assert.ok(phoebe.periodDays<0);
 assert.ok(orbitalPhase(triton,1)>0);
 const start=moonOrbitPosition(triton,0);
 const later=moonOrbitPosition(triton,1);
 assert.ok(start&&later);
 assert.ok(Math.abs(start.z-later.z)>1e-4);
});
test('Kepler ellipse is periodic to within numerical tolerance and remains finite',()=>{
 for(const moon of MOONS){
  const start=moonOrbitPosition(moon,2.13);
  const cycle=moonOrbitPosition(moon,2.13+Math.abs(moon.periodDays));
  assert.ok(start&&cycle,moon.id);
  assert.ok(Number.isFinite(start.x)&&Number.isFinite(start.z),moon.id);
  assert.ok(Math.abs(start.x-cycle.x)<1e-6,moon.id);
  assert.ok(Math.abs(start.z-cycle.z)<1e-6,moon.id);
  assert.ok(start.radialKm>0&&start.distance>0);
 }
});
test('orbit points close and outer moon geometry stays bounded',()=>{
 for(const moon of MOONS){
  const points=moonOrbitPath(moon,64);
  assert.equal(points.length,65);
  assert.ok(Math.abs(points[0][0]-points[64][0])<1e-8);
  assert.ok(Math.abs(points[0][2]-points[64][2])<1e-8);
  assert.ok(orbitalScale(moon.orbitKm)>=2);
  assert.ok(orbitalScale(moon.orbitKm)<=9);
  assert.ok(moonDrawRadius(moon.radiusKm)<=.36);
 }
});
test('bad orbit inputs safely return null or no geometry',()=>{
 assert.equal(moonOrbitPosition({id:'invalid'},0),null);
 assert.equal(orbitalPhase(moonById('io'),NaN),null);
 assert.equal(moonOrbitPosition(moonById('io'),Infinity),null);
 assert.deepEqual(moonOrbitPath(moonById('io'),3),[]);
 assert.ok(validateMoonCatalog([...MOONS,MOONS[0]]).errors.some(x=>x.includes('Duplicate')));
});
test('3D scene selection is bounded but catalog can list additional moons',()=>{
 const jupiter=moonsForPlanet('Jupiter');
 assert.ok(sceneMoonList('Jupiter',3).length<=3);
 assert.ok(sceneMoonList('Jupiter').length<=12);
 assert.equal(sceneMoonList('Mercury').length,0);
 assert.ok(sceneMoonList('Saturn')[0].orbitKm<sceneMoonList('Saturn').at(-1).orbitKm);
});
test('date conversion is deterministic and explicitly illustrative not live',()=>{
 assert.equal(moonRelativeEpoch(new Date(MOON_ORBIT_EPOCH)),0);
 assert.equal(moonRelativeEpoch('not a date'),null);
 const day=new Date(Date.parse(MOON_ORBIT_EPOCH)+86400000);
 assert.equal(moonRelativeEpoch(day),1);
});
