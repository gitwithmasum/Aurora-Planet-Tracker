import test from 'node:test';
import assert from 'node:assert/strict';
import {MOON_GEOLOGY} from '../src/moonGeology.mjs';
import {IAU_GAZETTEER,IAU_FEATURE_COORDS,nomenclatureForMoon,nomenclatureForFeature,westLongitudeToEast,projectIAUPoint,validNomenclatureCoordinate,nomenclatureAudit} from '../src/moonNomenclature.mjs';
import {moonRenderPolicy,frameCadenceEstimate} from '../src/moonPerformance.mjs';

test('IAU Gazetteer has only approved, independently sourced named features',()=>{
 const audit=nomenclatureAudit(MOON_GEOLOGY);
 assert.equal(audit.valid,true,audit.errors.join('; '));
 assert.equal(audit.records,5);
 assert.equal(audit.moons,4);
 assert.ok(IAU_FEATURE_COORDS.every(x=>x.source===IAU_GAZETTEER+'Feature/'+x.usgsId));
});
test('Europa Conamara official center corrects original rough coordinates',()=>{
 const p=nomenclatureForFeature('europa','conamara');
 assert.equal(p.usgsId,1282);
 assert.equal(p.latitude,9.7);
 assert.equal(p.longitudeWest,272.7);
 assert.equal(p.coordinateSystem,'planetographic +West 0–360');
 assert.equal(MOON_GEOLOGY.europa.features[0].coords,null);
});
test('Phobos Stickney approved planetary coordinate is sourced to exact USGS feature',()=>{
 const p=nomenclatureForFeature('phobos','stickney');
 assert.deepEqual([p.latitude,p.longitudeWest,p.usgsId],[1,49,5707]);
 assert.equal(p.source,'https://planetarynames.wr.usgs.gov/Feature/5707');
});
test('Titan north polar lakes have IAU-approved and distinct centers',()=>{
 const byId=new Map(nomenclatureForMoon('titan').map(x=>[x.featureId,x]));
 assert.deepEqual([byId.get('kraken').latitude,byId.get('kraken').longitudeWest],[68,310]);
 assert.deepEqual([byId.get('ligeia').latitude,byId.get('ligeia').longitudeWest],[79.7,247.9]);
});
test('Callisto Valhalla broad impact basin is a feature CENTER, not footprint boundary',()=>{
 const p=nomenclatureForFeature('callisto','valhalla');
 assert.equal(p.latitude,14.7);
 assert.equal(p.longitudeWest,56);
 assert.equal(p.usgsId,6284);
});
test('west-longitude conversion preserves correct orientation and wraps 0 exactly',()=>{
 assert.equal(westLongitudeToEast(0),0);
 assert.equal(westLongitudeToEast(90),270);
 assert.equal(westLongitudeToEast(180),180);
 assert.equal(westLongitudeToEast(270),90);
 assert.equal(westLongitudeToEast(NaN),null);
});
test('equirectangular reference grid maps north high and sources near 0 correctly',()=>{
 const europa=projectIAUPoint(nomenclatureForFeature('europa','conamara'));
 assert.ok(Math.abs(europa.x-174.6)<.00001);
 assert.ok(Math.abs(europa.y-160.6)<.00001);
 const titan=projectIAUPoint(nomenclatureForFeature('titan','kraken'));
 assert.ok(titan.y<europa.y);
 assert.ok(titan.x<europa.x);
});
test('projection refuses incorrect IAU status, frame, invalid values and sizes',()=>{
 const source=nomenclatureForFeature('europa','conamara');
 assert.equal(validNomenclatureCoordinate({...source,status:'Dropped'}),false);
 assert.equal(validNomenclatureCoordinate({...source,longitudeWest:361}),false);
 assert.equal(validNomenclatureCoordinate({...source,latitude:95}),false);
 assert.equal(validNomenclatureCoordinate({...source,coordinateSystem:'unknown'}),false);
 assert.equal(validNomenclatureCoordinate({...source,source:'https://example.com'}),false);
 assert.equal(projectIAUPoint({...source,usgsId:999},{}),null);
 assert.equal(projectIAUPoint(source,{width:0}),null);
});
test('unknown and non-georeferenced moons have no map pins at all',()=>{
 assert.equal(nomenclatureForFeature('ganymede','invented'),null);
 assert.deepEqual(nomenclatureForMoon('ganymede'),[]);
 assert.deepEqual(nomenclatureForMoon('mercury'),[]);
 assert.deepEqual(nomenclatureForMoon('unknown'),[]);
});
test('Moonverse ECO mode lowers pixel load without changing science calculations',()=>{
 const auto=moonRenderPolicy({coarsePointer:true,mode:'model',playing:true});
 assert.equal(auto.quality,'low');
 assert.equal(auto.dprMax,1);
 assert.equal(auto.stars,300);
 assert.equal(auto.moonCap,12);
 const high=moonRenderPolicy({preference:'detail',appQuality:'high'});
 assert.equal(high.quality,'high');
 assert.equal(high.dprMax,1.5);
 assert.equal(moonRenderPolicy({preference:'detail',appQuality:'low'}).quality,'low');
});
test('animation shuts off on hidden tab, below viewport, reduced motion or JPL vectors',()=>{
 const args={mode:'model',playing:true,speed:1};
 assert.equal(moonRenderPolicy({...args,hidden:true}).animate,false);
 assert.equal(moonRenderPolicy({...args,onScreen:false}).animate,false);
 assert.equal(moonRenderPolicy({...args,reducedMotion:true}).animate,false);
 assert.equal(moonRenderPolicy({...args,mode:'horizons'}).animate,false);
 assert.equal(moonRenderPolicy({...args}).animate,true);
 assert.equal(moonRenderPolicy({...args,saveData:true}).quality,'low');
});
test('frame cadence diagnostic rejects missing or nonmonotonic samples rather than inventing GPU fps',()=>{
 assert.equal(frameCadenceEstimate([0,16,32,48]),63);
 assert.equal(frameCadenceEstimate([0,0,16]),null);
 assert.equal(frameCadenceEstimate([0,NaN,33]),null);
 assert.equal(frameCadenceEstimate([]),null);
});
