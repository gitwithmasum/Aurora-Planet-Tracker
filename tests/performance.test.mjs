import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseGraphicsQuality,resolveGraphicsQuality} from '../src/performance.mjs';

test('capable desktop keeps high graphics in AUTO mode',()=>{
  assert.equal(chooseGraphicsQuality({viewportWidth:1440,hardwareConcurrency:8,deviceMemory:8,devicePixelRatio:1.5}),'high');
});
test('small touchscreens choose ECO rendering',()=>{
  assert.equal(chooseGraphicsQuality({viewportWidth:390,coarsePointer:true,hardwareConcurrency:8,deviceMemory:8}),'low');
});
test('low memory and fewer CPU cores choose ECO rendering',()=>{
  assert.equal(chooseGraphicsQuality({viewportWidth:1600,deviceMemory:4,hardwareConcurrency:16}),'low');
  assert.equal(chooseGraphicsQuality({viewportWidth:1600,deviceMemory:16,hardwareConcurrency:4}),'low');
});
test('reduced motion and save-data are respected',()=>{
  assert.equal(chooseGraphicsQuality({reducedMotion:true}),'low');
  assert.equal(chooseGraphicsQuality({saveData:true}),'low');
});
test('manual graphics setting overrides automatic recommendation',()=>{
  assert.equal(resolveGraphicsQuality('high','low'),'high');
  assert.equal(resolveGraphicsQuality('low','high'),'low');
  assert.equal(resolveGraphicsQuality('auto','low'),'low');
  assert.equal(resolveGraphicsQuality('auto','high'),'high');
  assert.equal(resolveGraphicsQuality('invalid','low'),'low');
});
test('unreported browser capability metrics do not force ECO',()=>{
  assert.equal(chooseGraphicsQuality({deviceMemory:undefined,hardwareConcurrency:undefined,viewportWidth:1280}),'high');
});
