import test from 'node:test';
import assert from 'node:assert/strict';
import {createFieldSession,updateFieldSession,normalizeFieldSession,normalizeFieldSessions,mergeFieldSessions,journalSummary,journalJSON,journalCSV,journalTextReport,JOURNAL_LIMIT,JOURNAL_FORMAT} from '../src/fieldJournalCore.mjs';

const clock='2026-10-20T12:00:00.000Z';
const later='2026-10-20T13:00:00.000Z';
const observer={label:'Selected observatory',lat:23.81,lon:90.41};
const make=(id='test-001')=>createFieldSession({
 id,title:'Mars session',targetId:'planet:Mars',targetType:'planet',targetName:'Mars',
 scheduledAt:later,createdAt:clock,observer
});
test('creation starts as planned without invented sighting result',()=>{
 const record=make();
 assert.equal(record.status,'planned');
 assert.equal(record.outcome,'not-attempted');
 assert.equal(record.startedAt,null);
 assert.equal(record.completedAt,null);
 assert.deepEqual(record.observer,observer);
});
test('manual start then observer-completed sighting is self-reported',()=>{
 const first=make();
 const started=updateFieldSession(first,{status:'in-progress'},later);
 assert.equal(started.status,'in-progress');
 assert.equal(started.startedAt,later);
 const completed=updateFieldSession(started,{status:'completed',outcome:'seen',notes:'Observed through binoculars'},later);
 assert.equal(completed.status,'completed');
 assert.equal(completed.outcome,'seen');
 assert.equal(completed.notes,'Observed through binoculars');
 assert.equal(completed.completedAt,later);
 assert.equal(first.outcome,'not-attempted');
});
test('non-completed sessions cannot claim a confirmed sighting',()=>{
 const record=updateFieldSession(make(),{outcome:'seen',status:'planned'});
 assert.equal(record.outcome,'not-attempted');
 const seen=updateFieldSession(make(),{status:'completed',outcome:'seen'},later);
 const reopened=updateFieldSession(seen,{status:'in-progress'},later);
 assert.equal(reopened.outcome,'not-attempted');
 assert.equal(reopened.completedAt,null);
});
test('editing cannot replace ID, creation timestamp or immutable target',()=>{
 const start=make();
 const changed=updateFieldSession(start,{title:'Revised title',id:'evil',createdAt:later,targetName:'Jupiter',targetType:'other',targetId:'planet:Jupiter'},later);
 assert.equal(changed.id,start.id);
 assert.equal(changed.createdAt,start.createdAt);
 assert.equal(changed.targetName,'Mars');
 assert.equal(changed.targetType,'planet');
 assert.equal(changed.targetId,'planet:Mars');
 assert.equal(changed.title,'Revised title');
});
test('invalid dates, IDs, observer and missing fields fail safely',()=>{
 assert.equal(createFieldSession({id:'bad!',title:'T',targetName:'Mars',scheduledAt:later,createdAt:clock}),null);
 assert.equal(createFieldSession({id:'ok-111',title:'',targetName:'Mars',scheduledAt:later,createdAt:clock}),null);
 assert.equal(createFieldSession({id:'ok-111',title:'T',targetName:'Mars',scheduledAt:'invalid',createdAt:clock}),null);
 const badObserver=normalizeFieldSession({...make(),observer:{label:'Observer',lat:100,lon:10}});
 assert.equal(badObserver.observer.lat,null);
 assert.equal(badObserver.observer.lon,null);
 assert.equal(normalizeFieldSession(null),null);
});
test('normalization caps notes/equipment and discards unsupported enum values',()=>{
 const x=normalizeFieldSession({...make(),notes:'n'.repeat(5000),equipment:'e'.repeat(300),conditions:'impossible',seeing:'nope',status:'completed',outcome:'invalid'});
 assert.equal(x.notes.length,2000);
 assert.equal(x.equipment.length,160);
 assert.equal(x.conditions,'unknown');
 assert.equal(x.seeing,'unknown');
 assert.equal(x.outcome,'not-attempted');
});
test('duplicate imports preserve newest record and limit session volume',()=>{
 const older=make(),newer=updateFieldSession(older,{title:'Newer'},later);
 assert.equal(normalizeFieldSessions([older,newer])[0].title,'Newer');
 assert.equal(mergeFieldSessions([newer],[older])[0].title,'Newer');
 const all=Array.from({length:JOURNAL_LIMIT+20},(_,i)=>make('session-'+String(i).padStart(4,'0')));
 assert.equal(normalizeFieldSessions(all).length,JOURNAL_LIMIT);
});
test('reports count completed user records only, not unverified predictions',()=>{
 const seen=updateFieldSession(make(),{status:'completed',outcome:'seen'},later);
 const missed=updateFieldSession(make('test-002'),{status:'completed',outcome:'not-seen'},later);
 const x=journalSummary([make('test-003'),seen,missed]);
 assert.deepEqual({total:x.total,planned:x.planned,completed:x.completed,confirmedByUser:x.confirmedByUser,notSeen:x.notSeen},{total:3,planned:1,completed:2,confirmedByUser:1,notSeen:1});
 assert.ok(journalTextReport([seen],later).includes('Self-reported'));
});
test('JSON format and CSV protect notes from spreadsheet formula execution',()=>{
 const value=updateFieldSession(make(),{notes:'=HYPERLINK("http://example.invalid","Click")\nAnother line',equipment:'@SUM(1,1)'},later);
 const json=JSON.parse(journalJSON([value],later));
 assert.equal(json.format,JOURNAL_FORMAT);
 assert.equal(json.sessions[0].notes,value.notes);
 assert.equal(json.sessions[0].observer.lat,23.81);
 const csv=journalCSV([value]);
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes("'@SUM"));
 assert.ok(csv.includes('""Click""'));
 assert.ok(csv.startsWith('id,title,targetType'));
});
