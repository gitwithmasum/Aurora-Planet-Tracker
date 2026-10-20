import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Activity,CheckCircle2,ClipboardCheck,Download,HardDrive,RefreshCw,Smartphone,ShieldCheck,Wifi,WifiOff} from 'lucide-react';
import {useLanguage} from './i18n.jsx';
import {DEVICE_QA_KEY,DEVICE_CHECKS,devicePlatform,normalizeDeviceQa,qaSummary,qaReport} from './deviceQaCore.mjs';
import './DeviceQACenter.css';

const version='4.9.0';
function loadSaved(){
 try{return normalizeDeviceQa(JSON.parse(localStorage.getItem(DEVICE_QA_KEY)))}catch{return normalizeDeviceQa(null)}
}
const saveJson=(name,obj)=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)+'\n'],{type:'application/json;charset=utf-8'}));
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
async function browserFrameCadence(){
 return new Promise(resolve=>{
  let frames=0,start=0,last=0,handle=0;
  const tick=stamp=>{
   if(!start)start=stamp;
   frames++;last=stamp;
   if(stamp-start>=1200){resolve(Math.round((frames-1)*1000/(last-start)));return}
   handle=requestAnimationFrame(tick);
  };
  handle=requestAnimationFrame(tick);
  setTimeout(()=>{if(!last||last-start<1200){cancelAnimationFrame(handle);resolve(null)}},3500);
 });
}
async function cacheStatus(){
 if(!navigator.serviceWorker?.controller)return {serviceWorker:!!navigator.serviceWorker,controller:false,cacheComplete:null,cachedAssets:null,listedAssets:null};
 const controller=navigator.serviceWorker.controller;
 return new Promise(resolve=>{
  let done=false;
  const finish=value=>{
   if(done)return;
   done=true;clearTimeout(timeout);navigator.serviceWorker.removeEventListener('message',message);
   resolve({serviceWorker:true,controller:true,cacheComplete:value?.complete??null,
    cachedAssets:value?.cachedAssets??null,listedAssets:value?.listedAssets??null});
  };
  const message=e=>{if(e.source===controller&&e.data?.type==='OFFLINE_STATUS_RESULT')finish(e.data)};
  const timeout=setTimeout(()=>finish(null),5000);
  navigator.serviceWorker.addEventListener('message',message);
  try{controller.postMessage({type:'OFFLINE_STATUS'})}catch{finish(null)}
 });
}
async function inspectDevice(){
 let storageWritable=false,storageBytes=null,storageQuota=null;
 const token='aurora-device-qa-probe';
 try{
  const old=localStorage.getItem(token);
  try{localStorage.setItem(token,'probe');storageWritable=localStorage.getItem(token)==='probe'}
  finally{if(old===null)localStorage.removeItem(token);else localStorage.setItem(token,old)}
 }catch{}
 try{
  const estimate=await navigator.storage?.estimate?.();
  if(Number.isFinite(estimate?.usage))storageBytes=estimate.usage;
  if(Number.isFinite(estimate?.quota))storageQuota=estimate.quota;
 }catch{}
 const service=await cacheStatus();
 const frameCadence=await browserFrameCadence();
 return {
  standalone:window.matchMedia?.('(display-mode: standalone)').matches===true||navigator.standalone===true,
  online:navigator.onLine,
  ...service,
  storageWritable,storageBytes,storageQuota,
  touch:(navigator.maxTouchPoints||0)>0||window.matchMedia?.('(pointer: coarse)').matches===true,
  reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true,
  screenWidth:window.innerWidth,screenHeight:window.innerHeight,frameCadence
 };
}
const readProbe=(value,yes,no,unknown='Not measured')=>value===true?yes:value===false?no:unknown;

export default function DeviceQACenter({onNavigate}){
 const {language}=useLanguage(),bn=language==='bn',say=(en,translated)=>bn?translated:en;
 const [qa,setQa]=useState(loadSaved);
 const [probes,setProbes]=useState(null),[busy,setBusy]=useState(false);
 const [notice,setNotice]=useState(''),[error,setError]=useState('');
 const active=useRef(true);
 const platform=useMemo(()=>devicePlatform(navigator.userAgent),[]);
 const summary=useMemo(()=>qaSummary(qa),[qa]);
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
 const update=useCallback((id,status)=>{
  setQa(prev=>{
   const next=normalizeDeviceQa({...prev,checks:{...prev.checks,[id]:status}});
   try{localStorage.setItem(DEVICE_QA_KEY,JSON.stringify(next));setError('')}
   catch{setError('Browser storage unavailable. Checklist changes may not persist.')}
   return next;
  });
 },[]);
 async function inspect(){
  setBusy(true);setNotice('');setError('');
  try{
   const result=await inspectDevice();
   if(active.current){setProbes(result);setNotice(say('Browser-level checks completed. Complete the physical-device checklist yourself.','ব্রাউজার-ভিত্তিক পরীক্ষা শেষ। বাস্তব ডিভাইসের checklist নিজে পূরণ করুন।'))}
  }catch(e){if(active.current)setError(String(e?.message||e))}
  finally{if(active.current)setBusy(false)}
 }
 function exportReport(){
  try{
   const report=qaReport({qa,probes,platform,createdAt:new Date().toISOString(),version});
   saveJson('aurora-device-qa-v4.9-'+platform.toLowerCase().replace(/[^a-z]/g,'-')+'.json',report);
   setNotice(say('QA report exported. Checklist values are self-reported, not independently verified.','QA report export হয়েছে। Checklist-এর ফল নিজে দেওয়া, স্বাধীনভাবে যাচাই করা হয়নি।'));
  }catch(e){setError(String(e?.message||e))}
 }
 return <section className="deviceQA" aria-label="Aurora Device QA Center">
  <div className="deviceQAHero"><div><span className="deviceQAEyebrow">AURORA / RELEASE ASSURANCE / v4.9</span>
   <h3><Smartphone size={26}/>{say('Real-Device QA Center','রিয়েল-ডিভাইস QA সেন্টার')}</h3>
   <p>{say('Check browser capabilities and record your own Windows / Android / iOS installation results. Browser diagnostics cannot certify a physical device.','ব্রাউজারের সক্ষমতা যাচাই করুন এবং Windows / Android / iOS ইনস্টলেশনের নিজস্ব পরীক্ষার ফল লিখুন। ব্রাউজারের পরীক্ষা দিয়ে বাস্তব ডিভাইস certified হয় না।')}</p>
  </div><button type="button" onClick={()=>onNavigate('Offline Recovery')}>{say('OPEN RECOVERY','রিকভারি খুলুন')}</button></div>

  <div className="deviceQAStats">
   <div><span>{say('Detected platform','সনাক্তকৃত প্ল্যাটফর্ম')}</span><strong>{platform}</strong></div>
   <div><span>{say('Self-reported passes','নিজে রিপোর্ট করা পাস')}</span><strong>{summary.pass} / {summary.total}</strong></div>
   <div><span>{say('Failures / blocked','ব্যর্থ / আটকে আছে')}</span><strong>{summary.fail} / {summary.blocked}</strong></div>
  </div>

  <article className="deviceQAPanel">
   <div className="deviceQATitle"><div><h4><Activity size={20}/>{say('Browser diagnostics','ব্রাউজার ডায়াগনস্টিকস')}</h4>
    <p>{say('Run on the actual device. No location permission, camera activation, remote upload, or private notes are required.','আসল ডিভাইসে চালান। Location, camera, remote upload বা ব্যক্তিগত note দরকার নেই।')}</p></div>
    <button type="button" disabled={busy} onClick={inspect}><RefreshCw size={16}/>{busy?say('CHECKING…','পরীক্ষা চলছে…'):say('RUN DEVICE CHECKS','ডিভাইস পরীক্ষা করুন')}</button></div>
   {probes?<div className="deviceQAProbeGrid">
    <div><small>{say('Installed display','ইনস্টলড ডিসপ্লে')}</small><strong>{readProbe(probes.standalone,'STANDALONE','BROWSER TAB')}</strong></div>
    <div><small>{say('Network state','নেটওয়ার্ক')}</small><strong>{readProbe(probes.online,'ONLINE','OFFLINE')}</strong></div>
    <div><small>{say('PWA controlled','PWA কন্ট্রোল')}</small><strong>{readProbe(probes.controller,'CONTROLLED','NOT CONTROLLED')}</strong></div>
    <div><small>{say('Static asset cache','স্ট্যাটিক ক্যাশ')}</small><strong>{probes.cachedAssets===null?'UNAVAILABLE':probes.cachedAssets+' / '+probes.listedAssets}</strong></div>
    <div><small>{say('Cache completeness','ক্যাশ সম্পূর্ণতা')}</small><strong>{readProbe(probes.cacheComplete,'COMPLETE','PARTIAL','UNKNOWN')}</strong></div>
    <div><small>{say('Local storage write','লোকাল স্টোরেজ')}</small><strong>{readProbe(probes.storageWritable,'PASS','FAILED')}</strong></div>
    <div><small>{say('Touch detected','টাচ সাপোর্ট')}</small><strong>{readProbe(probes.touch,'YES','NO')}</strong></div>
    <div><small>{say('Viewport','স্ক্রিন')}</small><strong>{probes.screenWidth} × {probes.screenHeight}</strong></div>
    <div><small>{say('Reduced motion','কম অ্যানিমেশন')}</small><strong>{readProbe(probes.reducedMotion,'ON','OFF')}</strong></div>
    <div><small>{say('Browser frame cadence','ব্রাউজার ফ্রেম ক্যাডেন্স')}</small><strong>{probes.frameCadence===null?'—':probes.frameCadence+' / s'}</strong></div>
   </div>:<p className="deviceQAEmpty">{say('No browser diagnostics measured yet. Results reflect this browser session, not historic device tests.','এখনো কোনো ডায়াগনস্টিকস নেওয়া হয়নি। ফল শুধু এই ব্রাউজার সেশনের।')}</p>}
   <p className="deviceQANote"><ShieldCheck size={16}/>{say('Frame cadence is NOT WebGL GPU FPS. A full cache is NOT proof that live weather/TLE updates work without internet.','Frame cadence আসল WebGL GPU FPS নয়। সম্পূর্ণ cache মানেও offline-এ live weather/TLE পাওয়া যাবে না।')}</p>
  </article>

  <article className="deviceQAPanel">
   <div className="deviceQATitle"><div><h4><ClipboardCheck size={20}/>{say('Physical-device verification checklist','বাস্তব ডিভাইস যাচাইয়ের তালিকা')}</h4>
    <p>{say('These statuses are manually reported by you. Select PASS only after testing the task on this device.','এই ফল আপনি নিজে দেবেন। নিজের ডিভাইসে পরীক্ষা করার পরেই PASS দিন।')}</p></div></div>
   <div className="deviceQAChecklist">
    {DEVICE_CHECKS.map((item,index)=><div key={item.id} className="deviceQACheck">
     <span>{String(index+1).padStart(2,'0')}</span>
     <label htmlFor={'deviceqa-'+item.id}>{bn?item.bn:item.en}</label>
     <select id={'deviceqa-'+item.id} aria-label={'Verification status: '+item.id} value={qa.checks[item.id]} onChange={e=>update(item.id,e.target.value)}>
      <option value="untested">{say('NOT TESTED','পরীক্ষা হয়নি')}</option>
      <option value="pass">{say('PASS — SELF REPORTED','পাস — নিজস্ব রিপোর্ট')}</option>
      <option value="fail">{say('FAILED','ব্যর্থ')}</option>
      <option value="blocked">{say('BLOCKED / UNSUPPORTED','সম্ভব নয় / আটকে আছে')}</option>
     </select>
    </div>)}
   </div>
   <p className="deviceQANote">{summary.manualComplete?say('Every item is self-reported PASS. This is not independently certified.','সবগুলো নিজস্ব রিপোর্ট অনুযায়ী PASS। এটি স্বাধীন certification নয়।'):say('Device sign-off remains incomplete until every required check is actually tested.','সব প্রয়োজনীয় পরীক্ষা বাস্তবে না করা পর্যন্ত device sign-off অসম্পূর্ণ।')}</p>
  </article>
  <div className="deviceQAActions"><button type="button" onClick={exportReport}><Download size={16}/>{say('EXPORT PRIVACY-SAFE QA JSON','QA রিপোর্ট JSON এক্সপোর্ট')}</button>
   <button type="button" onClick={()=>onNavigate('Offline Recovery')}><HardDrive size={16}/>{say('BACKUP BEFORE TESTING','পরীক্ষার আগে ব্যাকআপ')}</button>
  </div>
  {notice&&<p className="deviceQAStatus" role="status"><CheckCircle2 size={16}/>{notice}</p>}
  {error&&<p className="deviceQAError" role="alert">{error}</p>}
  <p className="deviceQAFoot"><WifiOff size={16}/>{say('Use airplane mode manually for true installed-PWA offline testing. This page does not force your device offline or request GPS/camera permissions. QA report excludes journal notes, observer coordinates and raw user-agent details.','আসল offline পরীক্ষা করতে নিজে Airplane mode চালু করুন। এই পেজ ডিভাইস offline করে না বা GPS/camera permission চায় না। QA রিপোর্টে notes, coordinates বা সম্পূর্ণ user-agent থাকবে না।')}</p>
 </section>;
}
