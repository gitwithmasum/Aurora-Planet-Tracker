// v4.7 — versioned, local-only, loss-preventing recovery transactions.
// Never claim to include unrelated modules, cloud data, or weather forecasts.
import {JOURNAL_KEY,normalizeFieldSessions,mergeFieldSessions,JOURNAL_LIMIT} from './fieldJournalCore.mjs';
import {normalizeWatchlist} from './observationPlannerCore.mjs';
export const RECOVERY_FORMAT='aurora-recovery-v1';
export const RECOVERY_MAX_BYTES=2*1024*1024;
export const WATCH_KEY='aurora-observation-targets-v1';
export const RECOVERY_PREFERENCES={
 'aurora-language':['en','bn'],
 'aurora-galaxy-theme':['classic','cosmic','nebula','halftone'],
 'aurora-graphics-quality':['auto','high','low'],
 'aurora-sidebar-collapsed':['true','false']
};
const keys=[JOURNAL_KEY,WATCH_KEY,...Object.keys(RECOVERY_PREFERENCES)];
const readJSON=text=>{try{return JSON.parse(text)}catch{throw Error('Stored local data is corrupt. Export or repair it before restoring.')}};
export function createRecoveryBundle(storage,validIds,createdAt=new Date().toISOString()){
 if(!storage||!Array.isArray(validIds))throw Error('Storage and known target IDs are required');
 const rawJournal=storage.getItem(JOURNAL_KEY);
 const rawWatchlist=storage.getItem(WATCH_KEY);
 const journalInput=rawJournal===null?[]:readJSON(rawJournal);
 const watchInput=rawWatchlist===null?[]:readJSON(rawWatchlist);
 if(!Array.isArray(journalInput)||!Array.isArray(watchInput))throw Error('Existing local journal or watchlist format is invalid; backup not exported');
 const sessions=normalizeFieldSessions(journalInput);
 const watchlist=normalizeWatchlist(watchInput,validIds);
 if(sessions.length!==journalInput.length||watchlist.length!==watchInput.length){
  throw Error('Some locally saved records are malformed or duplicated. Export the original site data separately before repairing.');
 }
 const preferences={};
 for(const [key,allowed] of Object.entries(RECOVERY_PREFERENCES)){
  const value=storage.getItem(key);
  if(value!==null&&allowed.includes(value))preferences[key]=value;
 }
 const bundle={format:RECOVERY_FORMAT,createdAt,sessions,watchlist,preferences,
  scope:'Field Journal, Observation Planner shortlist and selected appearance preferences only.',
  warning:'Contains user-authored notes and possibly observer coordinates. Keep backup private.'};
 return bundle;
}
export function validateRecoveryBundle(input,validIds){
 if(!Array.isArray(validIds))throw Error('Target catalog is required');
 const data=typeof input==='string'?readJSON(input):input;
 if(!data||typeof data!=='object'||Array.isArray(data)||data.format!==RECOVERY_FORMAT)throw Error('Unsupported Aurora recovery backup format');
 if(!Array.isArray(data.sessions)||data.sessions.length>JOURNAL_LIMIT||!Array.isArray(data.watchlist)||data.watchlist.length>64||
    !data.preferences||typeof data.preferences!=='object'||Array.isArray(data.preferences))throw Error('Invalid recovery backup data or record limit');
 const sessions=normalizeFieldSessions(data.sessions);
 if(sessions.length!==data.sessions.length)throw Error('Some journal records are invalid or duplicated; backup rejected');
 const watchlist=normalizeWatchlist(data.watchlist,validIds);
 if(watchlist.length!==data.watchlist.length)throw Error('Backup contains unknown or duplicated watchlist targets; backup rejected');
 const preferences={};
 for(const [key,allowed] of Object.entries(RECOVERY_PREFERENCES)){
  const value=data.preferences[key];
  if(value!==undefined){
   if(!allowed.includes(value))throw Error('Invalid setting in backup: '+key);
   preferences[key]=value;
  }
 }
 return {format:RECOVERY_FORMAT,createdAt:String(data.createdAt||''),sessions,watchlist,preferences};
}
export function recoveryPreview(bundle){
 return {sessions:bundle.sessions.length,watchlist:bundle.watchlist.length,
  settings:Object.keys(bundle.preferences).length,
  hasLocationData:bundle.sessions.some(s=>s.observer?.lat!==null&&typeof s.observer?.lat==='number')};
}
export function applyRecoveryBundle(storage,bundle,validIds,{mode='merge'}={}){
 if(!['merge','replace'].includes(mode))throw Error('Unsupported restore mode');
 const normalized=validateRecoveryBundle(bundle,validIds);
 const before=new Map(keys.map(key=>[key,storage.getItem(key)]));
 const originalSessionData=before.get(JOURNAL_KEY)===null?[]:readJSON(before.get(JOURNAL_KEY));
 const originalWatchData=before.get(WATCH_KEY)===null?[]:readJSON(before.get(WATCH_KEY));
 if(!Array.isArray(originalSessionData)||!Array.isArray(originalWatchData)){
  throw Error('Existing browser data has an unsupported shape. No records changed.');
 }
 const existing=normalizeFieldSessions(originalSessionData);
 const currentWatch=normalizeWatchlist(originalWatchData,validIds);
 if(existing.length!==originalSessionData.length||currentWatch.length!==originalWatchData.length){
  throw Error('Existing browser data contains duplicates or invalid records. No records changed.');
 }
 if(mode==='merge'){
  const count=new Set([...existing,...normalized.sessions].map(s=>s.id)).size;
  if(count>JOURNAL_LIMIT)throw Error('Merge would exceed '+JOURNAL_LIMIT+' sessions and discard records. Export and free space first; no data changed.');
 }
 const sessions=mode==='merge'?mergeFieldSessions(existing,normalized.sessions):normalized.sessions;
 const watchlist=mode==='merge'?normalizeWatchlist([...currentWatch,...normalized.watchlist],validIds):normalized.watchlist;
 const actions=[[JOURNAL_KEY,JSON.stringify(sessions)],[WATCH_KEY,JSON.stringify(watchlist)]];
 if(mode==='replace')for(const [key,value] of Object.entries(normalized.preferences))actions.push([key,value]);
 const written=[];
 try{
  for(const [key,value] of actions){
   written.push(key); // Include possibly partial writes in rollback.
   storage.setItem(key,value);
   if(storage.getItem(key)!==value)throw Error('Browser did not retain verified data for '+key);
  }
 }catch(error){
  const rollbackErrors=[];
  for(const key of written.reverse()){
   try{const value=before.get(key);if(value===null)storage.removeItem(key);else storage.setItem(key,value)}catch{rollbackErrors.push(key)}
  }
  throw Error('Restore failed; '+(rollbackErrors.length?'some keys could not be rolled back: '+rollbackErrors.join(', '):'previous data was restored')+'. '+(error?.message||'Storage unavailable'));
 }
 return {sessions:sessions.length,watchlist:watchlist.length,settings:mode==='replace'?Object.keys(normalized.preferences).length:0,mode};
}
export function parseRecoveryText(text,validIds){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>RECOVERY_MAX_BYTES)throw Error('Recovery file exceeds the 2 MB limit');
 return validateRecoveryBundle(text,validIds);
}
