import test from 'node:test';
import assert from 'node:assert/strict';
import {createFieldSession} from '../src/fieldJournalCore.mjs';
import {JOURNAL_KEY} from '../src/fieldJournalCore.mjs';
import {WATCH_KEY,RECOVERY_FORMAT,createRecoveryBundle,validateRecoveryBundle,applyRecoveryBundle,parseRecoveryText,recoveryPreview,RECOVERY_MAX_BYTES} from '../src/recoveryCore.mjs';
const TARGETS=['planet:Mars','planet:Venus','galaxy:m31'];
const date='2026-10-20T09:00:00.000Z';
function sample(id='test-a',update=date){
 const first=createFieldSession({id,title:'Observe Mars',targetType:'planet',targetName:'Mars',targetId:'planet:Mars',
  scheduledAt:date,createdAt:date,observer:{label:'Home',lat:23.8,lon:90.4},notes:'Personal observation'});
 return {...first,updatedAt:update};
}
function fakeStorage(initial={},failKey=null){
 const map=new Map(Object.entries(initial));
 return {getItem:key=>map.get(key)??null,
  setItem:(key,value)=>{if(key===failKey)throw Error('Storage quota denied');map.set(key,String(value))},
  removeItem:key=>{map.delete(key)},map};
}
test('exports an intentionally scoped portable bundle and valid preferences',()=>{
 const store=fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample()]),[WATCH_KEY]:JSON.stringify(['planet:Mars','bad','planet:Mars']),'aurora-language':'bn','aurora-galaxy-theme':'halftone'});
 const bundle=createRecoveryBundle(store,TARGETS,date);
 assert.equal(bundle.format,RECOVERY_FORMAT);
 assert.equal(bundle.sessions.length,1);
 assert.deepEqual(bundle.watchlist,['planet:Mars']);
 assert.equal(bundle.preferences['aurora-language'],'bn');
 assert.equal(bundle.preferences['aurora-galaxy-theme'],'halftone');
 assert.equal(bundle.warning.includes('coordinates'),true);
});
test('old or unrelated backup versions are rejected with no writes',()=>{
 const invalid={format:'some-other-tool',sessions:[],watchlist:[],preferences:{}};
 assert.throws(()=>validateRecoveryBundle(invalid,TARGETS));
 assert.throws(()=>parseRecoveryText('not json',TARGETS));
 assert.throws(()=>parseRecoveryText('x'.repeat(RECOVERY_MAX_BYTES+5),TARGETS));
});
test('malformed or duplicate session records reject the full restore',()=>{
 const correct=createRecoveryBundle(fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample()])}),TARGETS,date);
 assert.throws(()=>validateRecoveryBundle({...correct,sessions:[{id:'wrong'}]},TARGETS));
 assert.throws(()=>validateRecoveryBundle({...correct,sessions:[sample(),sample()]},TARGETS));
});
test('unknown watchlist target IDs and invalid settings are rejected',()=>{
 const bundle=createRecoveryBundle(fakeStorage(),TARGETS,date);
 assert.throws(()=>validateRecoveryBundle({...bundle,watchlist:['planet:Unknown']},TARGETS));
 assert.throws(()=>validateRecoveryBundle({...bundle,preferences:{'aurora-language':'evil'}},TARGETS));
});
test('merge keeps existing preferences and newer journal edits',()=>{
 const newer=sample('test-a','2026-10-20T12:00:00.000Z');
 const current=fakeStorage({[JOURNAL_KEY]:JSON.stringify([newer]),[WATCH_KEY]:JSON.stringify(['planet:Mars']),'aurora-language':'en'});
 const bundle=createRecoveryBundle(fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample(),sample('test-b')]),[WATCH_KEY]:JSON.stringify(['planet:Venus']),'aurora-language':'bn'}),TARGETS,date);
 const result=applyRecoveryBundle(current,bundle,TARGETS,{mode:'merge'});
 assert.equal(result.sessions,2);
 assert.deepEqual(JSON.parse(current.getItem(WATCH_KEY)),['planet:Mars','planet:Venus']);
 assert.equal(current.getItem('aurora-language'),'en');
 assert.equal(JSON.parse(current.getItem(JOURNAL_KEY)).find(x=>x.id==='test-a').updatedAt,newer.updatedAt);
});
test('replace changes selected journal, shortlist, and only included preferences',()=>{
 const current=fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample('original')]),[WATCH_KEY]:JSON.stringify(['planet:Mars']),'aurora-language':'en','unrelated-data':'retain'});
 const bundle=createRecoveryBundle(fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample('replacement')]),[WATCH_KEY]:JSON.stringify(['galaxy:m31']),'aurora-language':'bn'}),TARGETS,date);
 const result=applyRecoveryBundle(current,bundle,TARGETS,{mode:'replace'});
 assert.equal(result.sessions,1);
 assert.equal(JSON.parse(current.getItem(JOURNAL_KEY))[0].id,'replacement');
 assert.equal(current.getItem('aurora-language'),'bn');
 assert.equal(current.getItem('unrelated-data'),'retain');
});
test('failure during storage transaction rolls back previously modified keys',()=>{
 const original=JSON.stringify([sample('original')]),watch=JSON.stringify(['planet:Mars']);
 const store=fakeStorage({[JOURNAL_KEY]:original,[WATCH_KEY]:watch},WATCH_KEY);
 const bundle=createRecoveryBundle(fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample('other')])}),TARGETS,date);
 assert.throws(()=>applyRecoveryBundle(store,bundle,TARGETS,{mode:'replace'}),/previous data was restored/);
 assert.equal(store.getItem(JOURNAL_KEY),original);
 assert.equal(store.getItem(WATCH_KEY),watch);
});
test('preview counts are grounded and sensitive observer coordinates disclosed',()=>{
 const b=createRecoveryBundle(fakeStorage({[JOURNAL_KEY]:JSON.stringify([sample()]),[WATCH_KEY]:JSON.stringify(['planet:Mars'])}),TARGETS,date);
 assert.deepEqual(recoveryPreview(b),{sessions:1,watchlist:1,settings:0,hasLocationData:true});
 assert.throws(()=>applyRecoveryBundle(fakeStorage(),b,TARGETS,{mode:'unknown'}));
});
