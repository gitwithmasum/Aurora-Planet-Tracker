import test from 'node:test';
import assert from 'node:assert/strict';
import {DEVICE_QA_KEY,DEVICE_QA_FORMAT,DEVICE_CHECKS,devicePlatform,normalizeDeviceQa,qaSummary,qaReport} from '../src/deviceQaCore.mjs';

test('device classification is coarse and excludes full user agent in report',()=>{
 assert.equal(devicePlatform('Mozilla Android 16 Chrome'),'Android');
 assert.equal(devicePlatform('Windows NT 10.0 Edge'),'Windows');
 assert.equal(devicePlatform('iPhone Safari'),'iOS/iPadOS');
 assert.equal(devicePlatform('iPad Safari'),'iOS/iPadOS');
 assert.equal(devicePlatform('Macintosh Safari'),'macOS');
 assert.equal(devicePlatform('unknown'),'Other');
});
test('empty or corrupt manual results remain untested, never automatically certified',()=>{
 const normalized=normalizeDeviceQa(null);
 assert.equal(Object.keys(normalized.checks).length,DEVICE_CHECKS.length);
 assert.equal(qaSummary(normalized).manualComplete,false);
 assert.equal(qaSummary(normalized).pass,0);
 assert.equal(normalizeDeviceQa({checks:{install:'nonexistent'}}).checks.install,'untested');
});
test('manual completeness requires explicit pass for each independent item',()=>{
 const checks=Object.fromEntries(DEVICE_CHECKS.map(c=>[c.id,'pass']));
 const completed=qaSummary({checks});
 assert.equal(completed.manualComplete,true);
 assert.equal(completed.pass,DEVICE_CHECKS.length);
 const partial=qaSummary({checks:{...checks,restore:'blocked'}});
 assert.equal(partial.manualComplete,false);
 assert.equal(partial.blocked,1);
});
test('manual report does not export notes, personal coordinates, user agent or extra arbitrary keys',()=>{
 const qa={checks:{install:'pass',otherSecret:'token','offline-reload':'fail'},personalNotes:'my medical note'};
 const report=qaReport({qa,probes:{standalone:true,online:false,storageWritable:true,
  screenWidth:393,screenHeight:851,secretToken:'secret',observerCoordinates:'23.81,90.41',frameCadence:58},platform:'Android',createdAt:'2026-10-20T21:00:00Z',version:'4.9.0'});
 assert.equal(report.format,DEVICE_QA_FORMAT);
 assert.equal(report.platform,'Android');
 assert.equal(report.checklist.install,'pass');
 assert.equal(report.checklist['offline-reload'],'fail');
 assert.equal(report.summary.manualComplete,false);
 assert.equal(report.probeResults.frameCadence,58);
 const serialized=JSON.stringify(report);
 for(const sensitive of ['medical note','otherSecret','secretToken','observerCoordinates','23.81','90.41'])assert.equal(serialized.includes(sensitive),false);
});
test('unknown platform and invalid fields fail closed',()=>{
 const report=qaReport({qa:[],probes:{storageQuota:Infinity,frameCadence:NaN,online:'YES',touch:false},platform:'secret-device',createdAt:'2026-10-20T20:00:00Z',version:'4.9.0'});
 assert.equal(report.platform,'Other');
 assert.equal('storageQuota'in report.probeResults,false);
 assert.equal('frameCadence'in report.probeResults,false);
 assert.equal('online'in report.probeResults,false);
 assert.equal(report.probeResults.touch,false);
 assert.equal(report.summary.pass,0);
});
test('report explicitly disclaims device certification and GPU FPS equivalence',()=>{
 const report=qaReport({qa:null,probes:{frameCadence:60,cacheComplete:true},platform:'Windows',createdAt:'2026-10-20T00:00:00Z',version:'4.9.0'});
 assert.match(report.measuredIn,/self-reported/);
 assert.match(report.disclaimer,/NOT WebGL GPU FPS/);
 assert.match(report.disclaimer,/physical-device verification/);
 assert.equal(report.probeResults.cacheComplete,true);
 assert.equal(DEVICE_QA_KEY,'aurora-device-qa-v1');
});
