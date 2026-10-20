import test from 'node:test';
import assert from 'node:assert/strict';
import {MOONS} from '../src/moonCatalog.mjs';
import {missionArchiveFor,missionArchiveSummary} from '../src/moonMissionArchive.mjs';
test('archive supports every curated moon without fabricating events',()=>{
 for(const moon of MOONS){const events=missionArchiveFor(moon);assert.ok(Array.isArray(events));for(const item of events){assert.match(item.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(item.title&&item.mission&&item.source.startsWith('https://'));assert.ok(['completed','planned'].includes(item.status));}}
});
test('mission dates are sorted and the Europa Clipper flyby is planned',()=>{
 const europa=missionArchiveFor(MOONS.find(m=>m.id==='europa'));
 assert.deepEqual(europa.map(e=>e.date),[...europa.map(e=>e.date)].sort());
 const future=europa.find(e=>e.mission==='Europa Clipper'&&e.kind==='planned');
 assert.equal(future.status,'planned');
 assert.ok(missionArchiveSummary().moons>0);
});
