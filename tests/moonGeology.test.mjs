import test from 'node:test';
import assert from 'node:assert/strict';
import {MOONS,moonById} from '../src/moonCatalog.mjs';
import {SURFACE_EVIDENCE,MOON_GEOLOGY,geologyForMoon,featuresForMoon,interiorLayers,surfaceFeatureById,geologySummary,validGeologyCatalog} from '../src/moonGeology.mjs';

test('v5.3 covers ten selected named moons with NASA documented geological features',()=>{
 const summary=geologySummary();
 assert.equal(summary.researchedMoons,10);
 assert.ok(summary.documentedFeatures>=23);
 assert.equal(summary.schematic,true);
 assert.equal(summary.depthScale,'not-to-scale');
 assert.equal(validGeologyCatalog().valid,true,validGeologyCatalog().errors.join('; '));
});
test('all named geological profiles belong to existing v5.1 natural moon catalog',()=>{
 for(const id of Object.keys(MOON_GEOLOGY)){
  assert.ok(MOONS.some(m=>m.id===id),'unknown moon '+id);
  assert.ok(featuresForMoon(id).length>=2,'no feature content '+id);
  assert.ok(interiorLayers(id).length>=2,'no layer content '+id);
  for(const feature of featuresForMoon(id))assert.ok(SURFACE_EVIDENCE.includes(feature.evidence));
 }
});
test('Europa Conamara NASA photo metadata does not invent non-IAU map coordinates',()=>{
 const europa=surfaceFeatureById('europa','conamara');
 assert.equal(europa.nasaId,'PIA01177');
 assert.equal(europa.coords,null);
 assert.match(europa.source,/^https:\/\/science\.nasa\.gov\//);
 assert.equal(europa.evidence,'observed');
 assert.match(europa.description,/may involve warm ice or water/);
});
test('Enceladus observations are separated from inferred ocean interior',()=>{
 const en=geologyForMoon('enceladus');
 assert.equal(en.features[0].evidence,'observed');
 assert.equal(en.layers[0].evidence,'observed');
 assert.equal(en.layers.find(x=>x.id==='ocean').evidence,'inferred');
 assert.match(en.note,/not photographed directly/);
});
test('Europa inferred ocean remains evidence, never a life-detection claim',()=>{
 const e=geologyForMoon('europa');
 assert.equal(e.ocean,'strong-evidence');
 assert.equal(e.layers.find(x=>x.id==='ocean').evidence,'inferred');
 assert.match(e.note,/no detected life/);
 assert.match(e.note,/no direct sample/);
});
test('Titan methane seas not mislabeled liquid water, and possible deep ocean remains model',()=>{
 const t=geologyForMoon('titan');
 assert.match(t.features.find(x=>x.id==='kraken').description,/methane and ethane/);
 assert.equal(t.layers.find(x=>x.id==='ocean').evidence,'inferred');
 assert.match(t.note,/not a subsurface water ocean/);
});
test('Triton present-day water ocean remains hypothetical',()=>{
 const t=geologyForMoon('triton');
 assert.equal(t.ocean,'hypothetical');
 assert.equal(t.layers.find(x=>x.id==='possible-ocean').evidence,'hypothetical');
 assert.match(t.note,/has not been confirmed/);
});
test('Charon potential ancient ocean is not misrepresented as current observed ocean',()=>{
 const c=geologyForMoon('charon');
 assert.equal(c.ocean,'hypothetical');
 assert.equal(c.layers.find(x=>x.id==='ancient-ocean').evidence,'hypothetical');
 assert.match(c.note,/No present-day liquid ocean/);
});
test('Io volcano details are NASA observations, not literal artist renders',()=>{
 const io=geologyForMoon('io');
 assert.equal(io.features.find(x=>x.id==='chors').nasaId,'PIA26371');
 assert.match(io.features.find(x=>x.id==='loki').description,/artist concept/);
 assert.equal(io.ocean,'none-detected');
});
test('unknown moons do not receive fabricated interior schematics or coordinates',()=>{
 for(const unknown of ['kerberos','styx','himalia']){
  assert.equal(geologyForMoon(unknown),null);
  assert.deepEqual(featuresForMoon(unknown),[]);
  assert.deepEqual(interiorLayers(unknown),[]);
  assert.equal(surfaceFeatureById(unknown,'fake'),null);
 }
 for(const profile of Object.values(MOON_GEOLOGY)){
  for(const feature of profile.features){
   if(feature.coords)assert.equal(feature.coords.approximate,true);
   assert.ok(feature.coords===null||Number.isFinite(feature.coords.latitudeN));
  }
 }
});
test('all interior evidence is explicit and color is a valid schematic-only hex value',()=>{
 const states=new Set(SURFACE_EVIDENCE);
 for(const [id,profile] of Object.entries(MOON_GEOLOGY)){
  for(const layer of profile.layers){
   assert.ok(states.has(layer.evidence),id+' lacks evidence');
   assert.match(layer.color,/^#[\da-f]{6}$/i);
   assert.ok(layer.description.length>25);
  }
 }
});
