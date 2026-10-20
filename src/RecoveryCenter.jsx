import React,{useEffect,useMemo,useRef,useState} from 'react';
import {DatabaseBackup,Download,Upload,WifiOff,CheckCircle2,AlertTriangle,RefreshCcw,HardDriveDownload,ShieldCheck} from 'lucide-react';
import {OBSERVATION_TARGETS} from './observationForecast.mjs';
import {JOURNAL_KEY,normalizeFieldSessions} from './fieldJournalCore.mjs';
import {WATCH_KEY,RECOVERY_MAX_BYTES,createRecoveryBundle,parseRecoveryText,recoveryPreview,applyRecoveryBundle} from './recoveryCore.mjs';
import {useLanguage} from './i18n.jsx';
import './RecoveryCenter.css';
const VALID_IDS=OBSERVATION_TARGETS.map(x=>x.id);
const bytes=n=>Number.isFinite(n)?(n/1024/1024).toFixed(1)+' MB':'Unavailable';
const saveFile=(name,data)=>{
 const url=URL.createObjectURL(new Blob([data],{type:'application/json;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function localSummary(){
 try{
  const raw=localStorage.getItem(JOURNAL_KEY),watch=localStorage.getItem(WATCH_KEY);
  return {sessions:normalizeFieldSessions(raw?JSON.parse(raw):[]).length,watchlist:Array.isArray(watch?JSON.parse(watch):[])?JSON.parse(watch||'[]').length:0};
 }catch{return {sessions:null,watchlist:null}}
}
export default function RecoveryCenter({onNavigate}){
 const {language}=useLanguage(),bn=language==='bn',say=(en,translated)=>bn?translated:en;
 const [local,setLocal]=useState(localSummary);
 const [preview,setPreview]=useState(null),[restoreMode,setRestoreMode]=useState('merge');
 const [offline,setOffline]=useState(null),[storage,setStorage]=useState(null);
 const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');
 const picker=useRef(null);
 useEffect(()=>{
  let active=true;
  navigator.storage?.estimate?.().then(value=>{if(active)setStorage(value)}).catch(()=>{});
  const sync=e=>{if(e.key===JOURNAL_KEY||e.key===WATCH_KEY||e.key===null)setLocal(localSummary())};
  window.addEventListener('storage',sync);
  return()=>{active=false;window.removeEventListener('storage',sync)};
 },[]);
 useEffect(()=>{
  const listener=event=>{
   if(event.data?.type==='OFFLINE_STATUS_RESULT')setOffline(event.data);
  };
  navigator.serviceWorker?.addEventListener('message',listener);
  return()=>navigator.serviceWorker?.removeEventListener('message',listener);
 },[]);
 function inspectCache(){
  const worker=navigator.serviceWorker?.controller;
  if(!worker){setOffline({error:say('Offline cache is not active in this tab. Reload after a successful install.','এই ট্যাবে offline cache সক্রিয় নয়। ইনস্টল হলে রিলোড করুন।')});return}
  setOffline(null);
  worker.postMessage({type:'OFFLINE_STATUS'});
  setStatus(say('Checking cached astronomy modules…','ক্যাশে সংরক্ষিত astronomy modules যাচাই হচ্ছে…'));
 }
 function exportBackup(){
  setError('');setStatus('');
  try{
   const bundle=createRecoveryBundle(localStorage,VALID_IDS);
   saveFile('aurora-recovery-v4.6-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(bundle,null,2));
   setLocal(localSummary());
   setStatus(say('Backup downloaded. It contains local notes and may contain saved observer coordinates.','ব্যাকআপ ডাউনলোড হয়েছে। এতে ব্যক্তিগত নোট ও সংরক্ষিত স্থানাঙ্ক থাকতে পারে।'));
  }catch(e){setError(e?.message||'Unable to read local backup data')}
 }
 async function openFile(e){
  const file=e.target.files?.[0];e.target.value='';
  setPreview(null);setError('');setStatus('');
  if(!file)return;
  if(file.size>RECOVERY_MAX_BYTES){setError(say('Recovery file must not exceed 2 MB.','Recovery ফাইল ২ MB-এর বেশি হতে পারবে না।'));return}
  setBusy(true);
  try{
   const content=await file.text();
   const bundle=parseRecoveryText(content,VALID_IDS);
   setPreview({name:file.name,bundle,...recoveryPreview(bundle)});
   setStatus(say('Valid backup preview ready. No data has been restored.','ব্যাকআপ যাচাই হয়েছে। এখনো কোনো তথ্য restore করা হয়নি।'));
  }catch(err){setError(err?.message||'Invalid recovery backup')}
  finally{setBusy(false)}
 }
 function restore(){
  if(!preview)return;
  const reason=restoreMode==='replace'?
   say('Replace existing local journal, shortlist and included preferences with this backup? Export your current data first.','বিদ্যমান journal, shortlist ও backup-এ থাকা settings বদলে যাবে। আগে বর্তমান তথ্য backup নিয়েছ?'):
   say('Merge the backup with the current local journal and shortlist? Matching sessions prefer the latest edit.','ব্যাকআপের তথ্য বিদ্যমান journal ও shortlist-এর সঙ্গে merge করা হবে। একই সেশনের নতুন সংস্করণটি রাখা হবে।');
  if(!window.confirm(reason))return;
  setError('');setStatus('');
  try{
   const result=applyRecoveryBundle(localStorage,preview.bundle,VALID_IDS,{mode:restoreMode});
   setLocal(localSummary());setPreview(null);
   setStatus(say('Recovery completed: ','Restore সম্পন্ন: ')+result.sessions+say(' sessions, ','টি সেশন, ')+result.watchlist+say(' saved targets. Reload to refresh every module.','টি সংরক্ষিত লক্ষ্য। সব module হালনাগাদ দেখতে অ্যাপ রিলোড করুন।'));
  }catch(e){setError(e?.message||'Recovery failed')}
 }
 return <section className="recoveryCenter" aria-label="Aurora Offline and Data Recovery Center">
  <div className="recoveryHero"><div><span className="recoveryEyebrow">AURORA / RELIABILITY / v4.6</span>
   <h3><DatabaseBackup size={28}/>{say('Offline & Data Recovery','অফলাইন ও ডেটা রিকভারি')}</h3>
   <p>{say('Inspect installed offline astronomy modules, export a private backup, and restore selected browser-local information safely.','ইনস্টল করা offline astronomy modules যাচাই করুন, ব্যক্তিগত backup নিন এবং browser-local তথ্য restore করুন।')}</p>
  </div><button type="button" onClick={()=>onNavigate('Field Journal')}>{say('OPEN FIELD JOURNAL','ফিল্ড জার্নাল খুলুন')}</button></div>
  <div className="recoveryStats">
   <article><span>{say('SAVED SESSIONS','সংরক্ষিত সেশন')}</span><strong>{local.sessions??'—'}</strong></article>
   <article><span>{say('WATCHLIST TARGETS','পছন্দের লক্ষ্য')}</span><strong>{local.watchlist??'—'}</strong></article>
   <article><span>{say('ESTIMATED SITE STORAGE','সাইট স্টোরেজ')}</span><strong>{storage?bytes(storage.usage):'—'}</strong></article>
  </div>
  <div className="recoveryGrid">
   <article className="recoveryPanel">
    <h4><WifiOff size={21}/>{say('Offline readiness','অফলাইন প্রস্তুতি')}</h4>
    <p>{say('Checks the active service worker and its pre-cached JavaScript/CSS assets. A complete cache does not guarantee live weather or fresh satellite TLE feeds.','সক্রিয় service worker ও সংরক্ষিত JS/CSS assets যাচাই করে। সম্পূর্ণ cache মানেও live weather বা নতুন satellite TLE পাওয়া নিশ্চিত নয়।')}</p>
    <button type="button" onClick={inspectCache}><RefreshCcw size={16}/>{say('CHECK OFFLINE CACHE','অফলাইন ক্যাশ পরীক্ষা')}</button>
    {offline?.error&&<p className="recoveryWarning" role="alert">{offline.error}</p>}
    {offline&&!offline.error&&<div className="recoveryCacheInfo"><p><CheckCircle2 size={17}/>{say('Cached app shell','সংরক্ষিত অ্যাপ shell')}: {offline.shellReady?'YES':'NO'}</p>
     <p>{say('Cached astronomy JS/CSS assets','সংরক্ষিত astronomy JS/CSS assets')}: <strong>{offline.cachedAssets} / {offline.listedAssets}</strong></p>
     <p>{say('Offline asset state','অফলাইন asset অবস্থা')}: <strong>{offline.complete?say('All listed assets cached','তালিকাভুক্ত সব asset সংরক্ষিত'):say('Partial / cannot verify','আংশিক বা যাচাই সম্ভব নয়')}</strong></p>
     <p>{say('Worker version','Worker সংস্করণ')}: {offline.version||'—'}</p></div>}
    <small>{say('Live satellite calculations may become unavailable when TLEs are older than the validated age limit. Offline weather forecasts are not live data.','TLE পুরোনো হলে satellite calculation বন্ধ থাকতে পারে। Offline weather forecast লাইভ তথ্য নয়।')}</small>
   </article>
   <article className="recoveryPanel">
    <h4><HardDriveDownload size={21}/>{say('Private recovery backup','ব্যক্তিগত রিকভারি ব্যাকআপ')}</h4>
    <p>{say('Includes Field Journal, Observation Planner shortlist and selected theme/language/graphics settings. It does not include unrelated browser data, satellite feeds or weather.','Field Journal, Observation Planner shortlist ও কিছু theme/language/graphics settings থাকবে। অন্য browser data, satellite feed বা weather থাকবে না।')}</p>
    <button type="button" onClick={exportBackup}><Download size={16}/>{say('EXPORT RECOVERY JSON','রিকভারি JSON এক্সপোর্ট')}</button>
    <p className="recoverySensitive"><AlertTriangle size={16}/>{say('Sensitive: journal notes and observer coordinates may be included. Store or share the file carefully.','সতর্কতা: journal notes ও পর্যবেক্ষকের স্থানাঙ্ক থাকতে পারে। ফাইল নিরাপদে রাখুন।')}</p>
   </article>
  </div>
  <article className="recoveryRestore">
   <div><h4><Upload size={19}/>{say('Import and review a backup','ব্যাকআপ যাচাই ও আমদানি')}</h4><p>{say('Choose an Aurora recovery JSON file (up to 2 MB). The file is read locally; selecting it never overwrites data.','Aurora recovery JSON (সর্বোচ্চ ২ MB) নির্বাচন করুন। শুধু ফাইল নির্বাচন করলে কোনো তথ্য বদলাবে না।')}</p></div>
   <button type="button" disabled={busy} onClick={()=>picker.current?.click()}><Upload size={15}/>{busy?say('READING FILE','ফাইল পড়া হচ্ছে'):say('CHOOSE JSON BACKUP','JSON ব্যাকআপ নির্বাচন')}</button>
   <input hidden type="file" ref={picker} accept=".json,application/json" onChange={openFile} aria-label="Choose Aurora recovery JSON"/>
   {preview&&<div className="recoveryPreview">
    <p><ShieldCheck size={16}/><strong>{preview.name}</strong> · {say('Valid backup','বৈধ ব্যাকআপ')}</p>
    <div><span>{preview.sessions} {say('sessions','সেশন')}</span><span>{preview.watchlist} {say('targets','লক্ষ্য')}</span><span>{preview.settings} {say('settings','সেটিংস')}</span></div>
    {preview.hasLocationData&&<p className="recoverySensitive">{say('This backup contains observer coordinates.','এই ব্যাকআপে পর্যবেক্ষকের স্থানাঙ্ক রয়েছে।')}</p>}
    <fieldset><legend>{say('Restore strategy','রিকভারির পদ্ধতি')}</legend>
     <label><input type="radio" name="restoreMode" checked={restoreMode==='merge'} onChange={()=>setRestoreMode('merge')}/>{say('Merge with existing sessions and shortlist (keeps current preferences)','বিদ্যমান সেশন ও তালিকার সঙ্গে যুক্ত করুন (বর্তমান settings অক্ষত)')}</label>
     <label><input type="radio" name="restoreMode" checked={restoreMode==='replace'} onChange={()=>setRestoreMode('replace')}/>{say('Replace journal and shortlist (restore included preferences)','জার্নাল ও তালিকা বদলান (সংরক্ষিত settings ফিরিয়ে আনুন)')}</label>
    </fieldset>
    <button type="button" onClick={restore}><DatabaseBackup size={16}/>{say('CONFIRM RESTORE','রিকভারি নিশ্চিত করুন')}</button>
   </div>}
  </article>
  {status&&<p role="status" className="recoverySuccess">{status}</p>}
  {error&&<p role="alert" className="recoveryWarning">{error}</p>}
  <p className="recoveryFoot">{say('Reliability note: Safari/private browsing, storage quotas, data clearing and partially installed PWAs may still prevent offline use or restoring data. Export backups regularly before updates; no cloud sync or automatic backup is performed.','নির্ভরযোগ্যতা: Private browsing, storage limits, browser data clear বা অসম্পূর্ণ PWA install-এর কারণে offline বা recovery ব্যর্থ হতে পারে। আপডেটের আগে ব্যাকআপ রাখুন; এখানে স্বয়ংক্রিয় cloud backup নেই।')}</p>
 </section>;
}
