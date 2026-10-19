import test from 'node:test';
import assert from 'node:assert/strict';
import {createFieldSession,updateFieldSession} from '../src/fieldJournalCore.mjs';
import {analyzeObservationSessions,localDayKey,observationAnalyticsJSON,observationAnalyticsCSV,observationAnalyticsReport} from '../src/observationAnalyticsCore.mjs';

const now=Date.parse('2026-10-20T12:00:00Z');
function session(id,daysAgo,{type='planet',name='Mars',targetId='planet:Mars',outcome='planned',notes='',equipment=''}={}){
 const date=new Date(now-daysAgo*86400000).toISOString();
 const base=createFieldSession({id:'obs-'+id,title:'Session '+id,targetType:type,targetName:name,targetId,
  scheduledAt:date,createdAt:date,notes,equipment,observer:{label:'Private observer',lat:23.81,lon:90.41}});
 return outcome==='planned'?base:updateFieldSession(base,{
  status:'completed',outcome,conditions:'clear',notes,equipment
 },date);
}
const data=[
 session('one',1,{outcome:'seen',notes:'Visible with small telescope',equipment:'Telescope'}),
 session('two',2,{outcome:'not-seen'}),
 session('three',3,{outcome:'not-attempted'}),
 session('four',10,{type:'galaxy',name:'Andromeda',targetId:'galaxy:m31',outcome:'seen'}),
 session('five',45,{type:'satellite',name:'ISS',targetId:'satellite:iss',outcome:'seen'}),
 session('six',-2)
];

test('empty analysis keeps ratio unknown instead of presenting zero confidence',()=>{
 const a=analyzeObservationSessions([],{now,rangeDays:30});
 assert.equal(a.total,0);
 assert.equal(a.confirmedAttempts,0);
 assert.equal(a.sightingRatio,null);
 assert.equal(a.targets.length,0);
 assert.equal(a.trend.length,30);
});
test('date-range selection excludes old and upcoming sessions',()=>{
 const week=analyzeObservationSessions(data,{now,rangeDays:7});
 const month=analyzeObservationSessions(data,{now,rangeDays:30});
 assert.equal(week.total,3);
 assert.equal(month.total,4);
 assert.equal(week.upcoming,1);
 assert.equal(analyzeObservationSessions(data,{now,rangeDays:'all'}).total,6);
});
test('self-reported counts only include completed explicitly recorded outcomes',()=>{
 const a=analyzeObservationSessions(data,{now,rangeDays:30});
 assert.deepEqual(a.status,{planned:0,inProgress:0,completed:4});
 assert.deepEqual(a.outcomes,{seen:2,notSeen:1,unknown:1});
 assert.equal(a.confirmedAttempts,3);
 assert.ok(Math.abs(a.sightingRatio-2/3)<1e-9);
});
test('target category filter changes totals without including unrelated objects',()=>{
 const galaxy=analyzeObservationSessions(data,{now,rangeDays:'all',targetType:'galaxy'});
 assert.equal(galaxy.total,1);
 assert.equal(galaxy.targets[0].name,'Andromeda');
 const planet=analyzeObservationSessions(data,{now,rangeDays:'all',targetType:'planet'});
 assert.equal(planet.total,4);
 assert.equal(planet.targets[0].name,'Mars');
 assert.equal(planet.upcoming,1);
});
test('trend is non-empty, chronological and grouped by scheduled day',()=>{
 const a=analyzeObservationSessions(data,{now,rangeDays:7});
 assert.equal(a.trend.length,7);
 assert.equal(a.trend.at(-1).day,localDayKey(now));
 assert.equal(a.trend.reduce((n,d)=>n+d.scheduled,0),a.total);
 assert.equal(a.trend.reduce((n,d)=>n+d.seen,0),a.outcomes.seen);
});
test('all-time trend stays bounded, and malformed range defaults conservatively',()=>{
 const all=analyzeObservationSessions(data,{now,rangeDays:'all'});
 assert.equal(all.trend.length,30);
 assert.equal(all.total,6);
 assert.equal(analyzeObservationSessions(data,{now,rangeDays:'invalid'}).rangeDays,30);
 assert.equal(analyzeObservationSessions(data,{now:NaN}),null);
});
test('notes and equipment counts reflect actual journal content',()=>{
 const a=analyzeObservationSessions(data,{now,rangeDays:30});
 assert.equal(a.withNotes,1);
 assert.equal(a.withEquipment,1);
 assert.equal(a.uniqueTargets,2);
 assert.equal(a.types.planet,3);
 assert.equal(a.types.galaxy,1);
});
test('aggregate JSON excludes raw notes, private observer and coordinates',()=>{
 const a=analyzeObservationSessions(data,{now,rangeDays:'all'});
 const output=observationAnalyticsJSON(a);
 assert.equal(JSON.parse(output).format,'aurora-observation-analytics-v1');
 assert.equal(output.includes('Visible with small telescope'),false);
 assert.equal(output.includes('Private observer'),false);
 assert.equal(output.includes('23.81'),false);
 assert.equal(observationAnalyticsJSON(null),null);
});
test('research text includes denominator, caveat and no raw notes',()=>{
 const a=analyzeObservationSessions(data,{now,rangeDays:30});
 const text=observationAnalyticsReport(a);
 assert.ok(text.includes('n=3'));
 assert.ok(text.includes('not independently verified'));
 assert.equal(text.includes('Visible with small telescope'),false);
 assert.equal(observationAnalyticsReport(null),null);
});
test('aggregate CSV protects custom target names from spreadsheet formulas',()=>{
 const malicious=session('escape',1,{type:'other',name:'=HYPERLINK("example.invalid","x")',targetId:'',outcome:'seen'});
 const a=analyzeObservationSessions([malicious],{now,rangeDays:'all'});
 const csv=observationAnalyticsCSV(a);
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes('""example.invalid""'));
 assert.equal(csv.includes('Private observer'),false);
 assert.equal(observationAnalyticsCSV(null),null);
});
