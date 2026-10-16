import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineDates,comparisonPair,clampComparison,nextTimelineDate,cloudMarkerRadius} from '../src/earthVisualizationMath.mjs';
const items=[{date:'2026-10-14'},{date:'2026-10-12'},{date:'2026-10-13'}];
test('NASA imagery timeline orders dated mosaics and advances cyclically',()=>{
 assert.deepEqual(timelineDates(items),['2026-10-12','2026-10-13','2026-10-14']);
 assert.equal(nextTimelineDate(items,'2026-10-14'),'2026-10-12');
 assert.equal(nextTimelineDate(items,'2026-10-13'),'2026-10-14');
});
test('before-after comparison requires distinct dates',()=>{
 assert.deepEqual(comparisonPair(items,'2026-10-12','2026-10-14'),{before:'2026-10-12',after:'2026-10-14'});
 assert.equal(comparisonPair(items,'2026-10-13','2026-10-13'),null);
 assert.equal(comparisonPair([],null,null),null);
});
test('comparison swipe and clouds clamp invalid values safely',()=>{
 assert.equal(clampComparison(120),100);
 assert.equal(clampComparison(-3),0);
 assert.equal(clampComparison('oops'),50);
 assert.ok(cloudMarkerRadius(90)>cloudMarkerRadius(10));
 assert.equal(cloudMarkerRadius(200),cloudMarkerRadius(100));
});
