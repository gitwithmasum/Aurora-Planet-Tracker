import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Bell,CalendarDays,Volume2,VolumeX,Star,Clock3} from 'lucide-react';
import {predictSatelliteCalendar,ALERT_LEAD_MINUTES,DEFAULT_ALERT_SETTINGS,alertShouldFire,uniquePassKey,alertDirection} from './satellitePassPlanner.mjs';
import './SatellitePassPlanner.css';
const PREFS='aurora-satellite-alert-prefs-v1',FAVS='aurora-satellite-favorites-v1',SEEN='aurora-satellite-alert-seen-v1';
function stored(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'?v:fallback}catch{return fallback}}
function tone(audio){
 if(!audio)return;
 return audio.resume().then(()=>{
  for(const [i,freq] of [392,523.25,659.25].entries()){
   const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.15;
   osc.type='sine';osc.frequency.value=freq;
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.12,at+.035);gain.gain.exponentialRampToValueAtTime(.0001,at+.14);
   osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+.15);
  }
 }).catch(()=>{});
}
const localTime=d=>new Date(d).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
export default function SatellitePassPlanner({satrec,now,location,satellite,allSatellites=[]}){
 const [days,setDays]=useState(3),[minElevation,setMinElevation]=useState(10);
 const [prefs,setPrefs]=useState(()=>stored(PREFS,{})),[favorites,setFavorites]=useState(()=>stored(FAVS,{}));
 const [notice,setNotice]=useState(''),[expanded,setExpanded]=useState(false);
 const seen=useRef(new Set(stored(SEEN,[]))),audio=useRef(null);
 const id=String(satellite.noradId);
 const preference={...DEFAULT_ALERT_SETTINGS,...prefs[id]};
 const isFavorite=Boolean(favorites[id]);
 const minute=Math.floor(now/60000);
 const passes=useMemo(()=>predictSatelliteCalendar(satrec,new Date(minute*60000),location.lat,location.lon,days,minElevation),[satrec,minute,location.lat,location.lon,days,minElevation]);
 // Keep compute cadence at most once per minute, independent of the one-second alert ticker.
 useEffect(()=>{try{localStorage.setItem(PREFS,JSON.stringify(prefs))}catch{}},[prefs]);
 useEffect(()=>{try{localStorage.setItem(FAVS,JSON.stringify(favorites))}catch{}},[favorites]);
 const update=patch=>setPrefs(old=>({...old,[id]:{...DEFAULT_ALERT_SETTINGS,...old[id],...patch}}));
 async function enable(){
  if(preference.enabled){update({enabled:false});return}
  let permission='unsupported';
  if('Notification' in window){
   try{permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission}catch{permission='denied'}
  }
  if(preference.sound){try{const Context=window.AudioContext||window.webkitAudioContext;if(Context){audio.current??=new Context();await audio.current.resume()}}catch{setNotice('Sound could not be unlocked; text alerts remain available.')}}
  update({enabled:true});
  setNotice(permission==='granted'?'Browser notifications enabled while Satellite Tracker is running.':'In-page alerts enabled. Browser notifications may be blocked or unsupported.');
 }
 useEffect(()=>{
  if(!preference.enabled||!satrec)return;
  const due=passes.find(p=>alertShouldFire(p,now,preference.leadMinutes,seen.current.has(uniquePassKey(id,p))));
  if(!due)return;
  const key=uniquePassKey(id,due);
  seen.current.add(key);
  try{sessionStorage.setItem(SEEN,JSON.stringify([...seen.current].slice(-200)))}catch{}
  const message=satellite.name+' pass in '+Math.max(1,Math.ceil((due.start.getTime()-now)/60000))+' min · '+alertDirection(due);
  setNotice(message);
  if(preference.sound&&audio.current?.state==='running'&&document.visibilityState==='visible')try{tone(audio.current)}catch{}
  if('Notification' in window&&Notification.permission==='granted')try{
   const notification=new Notification('Aurora satellite pass alert',{body:message,tag:'aurora-pass-'+key});
   notification.onclick=()=>{window.focus();notification.close()};
  }catch(e){console.warn('Browser alert unavailable',e)}
 },[now,id,passes,preference.enabled,preference.leadMinutes,preference.sound,satrec,satellite.name]);
 const next=passes.find(p=>p.start.getTime()>now);
 const countdown=next?Math.max(0,Math.ceil((next.start.getTime()-now)/1000)):null;
 const clock=countdown===null?'--:--:--':[Math.floor(countdown/3600),Math.floor(countdown%3600/60),countdown%60].map(n=>String(n).padStart(2,'0')).join(':');
 const groups=useMemo(()=>{const m=new Map();for(const p of passes){const day=p.start.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});if(!m.has(day))m.set(day,[]);m.get(day).push(p)}return [...m]},[passes]);
 return <section className="satPlanner" aria-label="Satellite pass calendar and custom alerts">
  <div className="satPlannerHeading"><div><span className="eyebrow">AURORA / ORBITAL PASS PREDICTIONS</span><h4><CalendarDays size={19}/> {satellite.name} · Pass Calendar</h4><p>Estimated passes for your observer coordinates. All times use your device timezone.</p></div><button className="satFavorite" type="button" aria-pressed={isFavorite} onClick={()=>setFavorites(v=>({...v,[id]:!v[id]}))}><Star size={16} fill={isFavorite?'currentColor':'none'}/>{isFavorite?'FAVORITED':'ADD FAVORITE'}</button></div>
  <div className="satPlannerControls"><label>PERIOD <select aria-label="Pass prediction duration" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={1}>24 hours</option><option value={3}>3 days</option><option value={7}>7 days</option></select></label><label>MIN ELEVATION <select aria-label="Pass elevation threshold" value={minElevation} onChange={e=>setMinElevation(Number(e.target.value))}><option value={10}>10°</option><option value={20}>20°</option><option value={30}>30°</option></select></label><span>{passes.length} predicted passes</span></div>
  <div className="satPlannerAlert"><div><strong><Bell size={16}/> CUSTOM PASS ALERT</strong><span>Selected satellite · {satellite.noradId}</span></div><label>LEAD TIME <select aria-label="Alert lead time" value={preference.leadMinutes} onChange={e=>update({leadMinutes:Number(e.target.value)})}>{ALERT_LEAD_MINUTES.map(x=><option key={x} value={x}>{x} minutes</option>)}</select></label><label className="satPlannerSound"><input aria-label="Play chime for satellite alert" type="checkbox" checked={preference.sound} onChange={e=>update({sound:e.target.checked})}/>{preference.sound?<Volume2 size={15}/>:<VolumeX size={15}/>} SOUND</label><button type="button" onClick={enable}>{preference.enabled?'DISABLE':'ENABLE'} ALERT</button></div>
  {notice&&<div className="satPlannerNotice" role="status">{notice}</div>}
  <div className="satPlannerNext"><Clock3 size={18}/><span>NEXT PREDICTED PASS</span><strong>{next?localTime(next.start):'No upcoming pass'}</strong><b>{clock}</b></div>
  {!satrec?<p className="satPlannerEmpty">Fresh orbital data is unavailable for this satellite. Predictions and alerts are paused.</p>:groups.length===0?<p className="satPlannerEmpty">No pass above {minElevation}° within the selected period.</p>:
  <div className="satPlannerDays">{groups.map(([day,items])=><div key={day} className="satPlannerDay"><h5>{day}</h5>{items.map(p=><div className="satPlannerPass" key={p.start.getTime()}>
   <div><small>START / END</small><strong>{p.start.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})} – {p.end.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</strong></div>
   <div><small>PEAK</small><strong>{p.maxAltitude.toFixed(1)}°</strong><span>{localTime(p.peak)}</span></div>
   <div><small>LOOK TOWARD</small><strong>{alertDirection(p)}</strong></div>
   <div><small>VISIBILITY ESTIMATE</small><strong>{p.visibility.label}</strong><span>{p.visibility.score===null?'—':p.visibility.score+'/100 geometry score'}</span></div>
  </div>)}</div>)}</div>}
  <button type="button" className="satPlannerDetails" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?'HIDE':'READ'} VISIBILITY & ALERT LIMITATIONS</button>
  {expanded&&<p className="satPlannerFoot">Visibility scores are heuristic observing-geometry indicators—not statistical probabilities or brightness predictions. Sunlight estimates use a simplified Earth shadow and sunlight/darkness at pass peak, not full photometric visibility. Cloud cover, haze and obstacles are not included. Multi-satellite notifications and chime run only while the Satellite Tracker page is mounted, browser permitted, and tab awake; closing the app cannot reliably deliver alerts. Individual settings and favorites stay in this browser. ISS legacy alerts are separate and may also trigger if enabled.</p>}
 </section>;
}
