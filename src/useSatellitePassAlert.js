import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {predictIssPasses,issLook,direction} from './skyTonightMath.mjs';
import {fetchIssOrbit} from './issOrbitSource.mjs';
const ENDPOINT='https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const KEY='aurora-iss-alert-enabled';
const ALERT_BEFORE_MS=10*60*1000;
export function remainingTime(ms){
 const seconds=Math.max(0,Math.ceil(ms/1000));
 return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':');
}
export function upcomingAlertPass(passes,now){
 return passes.find(p=>new Date(p.end).getTime()>now&&new Date(p.start).getTime()>now)||null;
}
export function shouldAnnounce(start,now,alreadyNotified=false){
 const remaining=new Date(start).getTime()-now;
 return !alreadyNotified&&remaining>=0&&remaining<=ALERT_BEFORE_MS;
}
export function azimuthInstruction(az){
 if(!Number.isFinite(az))return 'Direction unavailable';
 return 'Face '+direction(az)+' ('+Math.round(az)+'° from true north)';
}
function createChime(context){
 const start=context.currentTime,notes=[420,630,840,630];
 for(let i=0;i<notes.length;i++){
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(notes[i],start+i*.14);
  gain.gain.setValueAtTime(.0001,start+i*.14);
  gain.gain.exponentialRampToValueAtTime(.16,start+i*.14+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,start+i*.14+.13);
  osc.connect(gain).connect(context.destination);
  osc.start(start+i*.14);osc.stop(start+i*.14+.14);
 }
}
export function useSatellitePassAlert(location){
 const [armed,setArmed]=useState(()=>{try{return localStorage.getItem(KEY)==='yes'}catch{return false}});
 const [soundOn,setSoundOn]=useState(true),[status,setStatus]=useState('off'),[error,setError]=useState('');
 const [satrec,setSatrec]=useState(null),[tick,setTick]=useState(()=>Date.now()),[lastAlert,setLastAlert]=useState(null);
 const audio=useRef(null),notified=useRef(new Set()),active=useRef(true);
 useEffect(()=>{const id=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{try{localStorage.setItem(KEY,armed?'yes':'no')}catch{}},[armed]);
 const refresh=useCallback(async()=>{
  setStatus('loading');setError('');
  try{
   const tle=await fetchIssOrbit();
   if(!active.current)return;
   setSatrec(tle.satrec);setStatus('ready');
  }catch(e){if(!active.current)return;setSatrec(null);setError(e?.message||'ISS data unavailable');setStatus('error')}
 },[]);
 useEffect(()=>{active.current=true;return()=>{active.current=false;audio.current?.close?.()}},[]);
 useEffect(()=>{refresh();const id=setInterval(refresh,3*3600000);return()=>clearInterval(id)},[refresh]);
 // Recalculate only every 60 seconds or when location/data changes.
 const minute=Math.floor(tick/60000);
 const passes=useMemo(()=>satrec?predictIssPasses(satrec,new Date(minute*60000),location.lat,location.lon,24,10):[],[satrec,minute,location.lat,location.lon]);
 const upcoming=upcomingAlertPass(passes,tick);
 const activePass=passes.find(p=>new Date(p.start).getTime()<=tick&&new Date(p.end).getTime()>tick)||null;
 const target=activePass||upcoming;
 const viewingTime=target?activePass?new Date(tick):target.start:null;
 const look=target&&satrec?issLook(satrec,viewingTime,location.lat,location.lon):null;
 const timeLeft=upcoming?new Date(upcoming.start).getTime()-tick:null;
 const withinCountdown=timeLeft!==null&&timeLeft<=ALERT_BEFORE_MS;
 const enable=useCallback(async()=>{
  setError('');
  if(soundOn){
   try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(Context){if(!audio.current)audio.current=new Context();await audio.current.resume();}
   }catch(e){setError('Sound may require another tap or browser audio permission.')}
  }
  if('Notification'in window&&Notification.permission==='default'){
   try{await Notification.requestPermission()}catch{}
  }
  setArmed(true);
 },[soundOn]);
 const disable=useCallback(()=>{setArmed(false);setLastAlert(null)},[]);
 const testSound=useCallback(async()=>{
  try{
   const Context=window.AudioContext||window.webkitAudioContext;
   if(!Context)throw Error('Web Audio is unavailable.');
   if(!audio.current)audio.current=new Context();
   await audio.current.resume();createChime(audio.current);
  }catch(e){setError(e?.message||'Unable to play sound')}
 },[]);
 useEffect(()=>{
  if(!armed||status!=='ready'||!upcoming||!shouldAnnounce(upcoming.start,tick,notified.current.has(upcoming.start.getTime())))return;
  const id=upcoming.start.getTime();
  notified.current.add(id);
  setLastAlert(id);
  if(soundOn&&audio.current?.state==='running'){try{createChime(audio.current)}catch{}}
  if('Notification'in window&&Notification.permission==='granted'){
   try{const n=new Notification('Aurora • ISS pass in '+Math.max(1,Math.ceil((id-tick)/60000))+' minutes',{
    body:azimuthInstruction(upcoming.azStart)+'. Keep this page open for countdown and live direction.',
    tag:'aurora-iss-'+id
   });n.onclick=()=>{window.focus();n.close()}}catch(e){console.warn('ISS notification unavailable',e)}
  }
 },[armed,status,upcoming?.start?.getTime(),tick,soundOn]);
 return {armed,soundOn,setSoundOn,status,error,satrec,tick,enable,disable,testSound,refresh,
  upcoming,activePass,look,timeLeft,withinCountdown,lastAlert,countdown:timeLeft===null?'--:--:--':remainingTime(timeLeft),
  directionText:look?azimuthInstruction(look.az):target?azimuthInstruction(target.azStart):'Direction unavailable'};
}
