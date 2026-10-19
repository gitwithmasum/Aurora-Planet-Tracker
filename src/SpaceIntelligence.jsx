import React,{useEffect,useMemo,useState} from 'react';
import {Activity,Satellite,Orbit,Compass,Clock3,RefreshCw,Globe2,ArrowUpRight,AlertTriangle,Sun,Moon,Info} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import {satelliteTelemetry} from './satelliteOrbit.mjs';
import {skySummary} from './skyTonightMath.mjs';
import {GALAXIES,galaxyHorizontal} from './galaxyCatalog.mjs';
import {assessTle,summarizeOrbitCatalog,displayTleStatus,safeObserver} from './spaceScienceMath.mjs';
import {satelliteLook} from './spaceScienceLook.mjs';
import {useLanguage} from './i18n.jsx';
import './SpaceIntelligence.css';

const fmt=(value,d=1)=>Number.isFinite(value)?value.toFixed(d):'—';
const direction=angle=>Number.isFinite(angle)?['N','NE','E','SE','S','SW','W','NW'][Math.round(angle/45)%8]:'—';
const timeLabel=time=>Number.isFinite(time)?new Date(time).toLocaleString():'—';

export default function SpaceIntelligence({location,now,onNavigate,onSatellite,onGalaxy}){
 const {language}=useLanguage(),bn=language==='bn';
 const [catalog,setCatalog]=useState([]),[state,setState]=useState('loading'),[error,setError]=useState(''),[provenance,setProvenance]=useState(null);
 const [refreshKey,setRefreshKey]=useState(0),[selectedId,setSelectedId]=useState('iss'),[offset,setOffset]=useState(0);
 const observer=safeObserver(location);
 const simulated=useMemo(()=>new Date(now.getTime()+offset*60000),[now,offset]);
 useEffect(()=>{
  let active=true;
  setState('loading');setError('');
  loadSatelliteCatalog().then(data=>{
   if(!active)return;
   setCatalog(data.rows);setProvenance({source:String(data.source||'Public orbital-element catalog'),fetchedAt:data.fetchedAt});setState('ready');
   setSelectedId(previous=>data.rows.some(row=>row.id===previous)?previous:data.rows[0].id);
  }).catch(e=>{
   if(!active)return;
   setCatalog([]);setProvenance(null);setState('error');
   setError(e?.message||'Orbital catalog unavailable');
  });
  return()=>{active=false};
 },[refreshKey]);
 const health=useMemo(()=>summarizeOrbitCatalog(catalog,simulated),[catalog,simulated]);
 const chosen=catalog.find(x=>x.id===selectedId)||null;
 const tle=useMemo(()=>assessTle(chosen,simulated),[chosen,simulated]);
 const telemetry=useMemo(()=>chosen?satelliteTelemetry(chosen.satrec,simulated):null,[chosen,simulated]);
 const look=useMemo(()=>chosen?satelliteLook(chosen.satrec,simulated,observer):null,[chosen,simulated,observer?.lat,observer?.lon]);
 const sky=useMemo(()=>observer?skySummary(simulated,observer.lat,observer.lon):null,[simulated,observer?.lat,observer?.lon]);
 const abovePlanets=useMemo(()=>sky?.planets.filter(p=>p.above&&Number.isFinite(p.alt)).sort((a,b)=>b.alt-a.alt)||[],[sky]);
 const galaxies=useMemo(()=>observer?GALAXIES.map(g=>galaxyHorizontal(g,simulated,observer.lat,observer.lon))
  .filter(g=>g.above&&Number.isFinite(g.alt)).sort((a,b)=>b.alt-a.alt):[],[observer?.lat,observer?.lon,simulated]);
 const label=(en,bnText)=>bn?bnText:en;
 return <section className="spaceScience" aria-label="Advanced Space Intelligence">
  <div className="spaceScienceHero">
   <div><span className="spaceScienceEyebrow">AURORA / RESEARCH LAB / v4.0</span>
    <h3><Activity size={29}/>{label('Advanced Space Intelligence','উন্নত মহাকাশ বিশ্লেষণ')}</h3>
    <p>{label('Observer-based sky geometry and transparent SGP4 orbital estimates, with time and source context.','পর্যবেক্ষকের অবস্থানভিত্তিক আকাশের তথ্য ও সময়-উৎসসহ SGP4 কক্ষপথের গণনাভিত্তিক বিশ্লেষণ।')}</p>
   </div>
   <div className="spaceScienceHeroActions">
    <button type="button" onClick={()=>onNavigate('Sky Tonight')}><Sun size={16}/>{label('SKY TONIGHT','আজ রাতের আকাশ')} <ArrowUpRight size={13}/></button>
    <button type="button" onClick={()=>onNavigate('Earth Observation')}><Globe2 size={16}/>{label('EARTH DATA','পৃথিবীর তথ্য')} <ArrowUpRight size={13}/></button>
   </div>
  </div>
  <div className="spaceScienceControls">
   <div><Clock3 size={17}/><span>{label('MODEL TIME','মডেল সময়')}</span><strong>{simulated.toLocaleString()}</strong>{offset!==0&&<small>{offset>0?'+':''}{offset} min</small>}</div>
   <label>{label('TIME SHIFT','সময়ের পরিবর্তন')} <select aria-label="Scientific model time offset" value={offset} onChange={e=>setOffset(Number(e.target.value))}>
    <option value={0}>NOW</option><option value={-60}>−60 MIN</option><option value={-30}>−30 MIN</option><option value={30}>+30 MIN</option><option value={60}>+60 MIN</option>
   </select></label>
   <button type="button" onClick={()=>setOffset(0)} disabled={offset===0}>{label('RESET TIME','সময় রিসেট')}</button>
  </div>
  <div className="spaceScienceStats">
   <article><Satellite size={21}/><small>{label('VALIDATED SPACECRAFT','যাচাইকৃত স্যাটেলাইট')}</small><strong>{state==='ready'?health.count:'—'}</strong><span>{label('Curated public TLE catalog','নির্বাচিত পাবলিক TLE তালিকা')}</span></article>
   <article><Orbit size={21}/><small>{label('RECENT TLE EPOCHS','সাম্প্রতিক TLE EPOCH')}</small><strong>{state==='ready'?health.recent:'—'}</strong><span>{label('Within 24 hours of model time','মডেল সময়ের ২৪ ঘণ্টার মধ্যে')}</span></article>
   <article><Compass size={21}/><small>{label('PLANETS ABOVE HORIZON','দিগন্তের উপরে গ্রহ')}</small><strong>{sky?abovePlanets.length:'—'}</strong><span>{label('Geometric horizon only','শুধু জ্যামিতিক দিগন্ত')}</span></article>
   <article><Moon size={21}/><small>{label('MOON ILLUMINATION','চাঁদের আলোকিত অংশ')}</small><strong>{Number.isFinite(sky?.phase)?sky.phase+'%':'—'}</strong><span>{sky?.darkness||label('Unavailable','পাওয়া যায়নি')}</span></article>
  </div>
  <div className="spaceScienceColumns">
   <section className="spaceSciencePanel">
    <div className="spaceSciencePanelTitle"><h4><Satellite size={19}/>{label('ORBITAL INTELLIGENCE','কক্ষপথ বিশ্লেষণ')}</h4><button type="button" onClick={()=>setRefreshKey(v=>v+1)} disabled={state==='loading'}><RefreshCw size={14}/>{label('REFRESH TLE','TLE রিফ্রেশ')}</button></div>
    <p>{label('Choose a spacecraft to inspect SGP4 orbital elements, propagated position and local sky direction.','SGP4 কক্ষপথ, গণনাভিত্তিক অবস্থান ও স্থানীয় দিক দেখতে স্যাটেলাইট বেছে নাও।')}</p>
    {state==='loading'&&<p role="status" className="spaceScienceNote">{label('Loading validated orbital elements…','যাচাইকৃত কক্ষপথের তথ্য লোড হচ্ছে…')}</p>}
    {state==='error'&&<p role="alert" className="spaceScienceWarning">{error}. {label('No orbital numbers are estimated without valid elements.','বৈধ তথ্য ছাড়া কোনো কক্ষপথের সংখ্যা দেখানো হবে না।')}</p>}
    {state==='ready'&&<><p className="spaceScienceSource">{label('Catalog source','ক্যাটালগের উৎস')}: {provenance?.source||'Public TLE'} · {label('Updated','আপডেট')}: {Number.isFinite(Date.parse(provenance?.fetchedAt||''))?timeLabel(Date.parse(provenance.fetchedAt)):label('Not specified','উল্লেখ নেই')}</p><label className="spaceScienceSelect">{label('SPACECRAFT','স্যাটেলাইট')}<select aria-label="Select orbital intelligence satellite" value={chosen?.id||''} onChange={e=>setSelectedId(e.target.value)}>{catalog.map(s=><option key={s.id} value={s.id}>{s.name} · NORAD {s.noradId}</option>)}</select></label>
     <div className="spaceScienceQuality"><span className={'spaceScienceQualityFlag flag-'+tle.status}>{displayTleStatus(tle.status)}</span><small>{label('Epoch age','Epoch-এর বয়স')}: {fmt(tle.ageHours,1)} h</small></div>
     <div className="spaceScienceReadings">
      <div><span>{label('Inclination','কক্ষপথের কাত')}</span><strong>{fmt(tle.inclinationDeg,2)}°</strong></div>
      <div><span>{label('Eccentricity','উৎকেন্দ্রিকতা')}</span><strong>{fmt(tle.eccentricity,5)}</strong></div>
      <div><span>{label('Orbit period','কক্ষপথের সময়')}</span><strong>{fmt(tle.periodMinutes,1)} min</strong></div>
      <div><span>{label('Mean motion','গড় আবর্তন')}</span><strong>{fmt(tle.meanMotionRevDay,2)} rev/day</strong></div>
      <div><span>{label('Calculated altitude','গণনাভিত্তিক উচ্চতা')}</span><strong>{fmt(telemetry?.altitudeKm,1)} km</strong></div>
      <div><span>{label('Calculated speed','গণনাভিত্তিক গতি')}</span><strong>{fmt(telemetry?.speedKmS,2)} km/s</strong></div>
      <div><span>{label('Bearing from north','উত্তর থেকে দিক')}</span><strong>{fmt(look?.azimuth,1)}° {direction(look?.azimuth)}</strong></div>
      <div><span>{label('Elevation from observer','পর্যবেক্ষকের উচ্চতাকোণ')}</span><strong>{fmt(look?.elevation,1)}°</strong></div>
      <div><span>{label('Slant range','তির্যক দূরত্ব')}</span><strong>{fmt(look?.rangeKm,0)} km</strong></div>
      <div><span>{label('Observer horizon','পর্যবেক্ষকের দিগন্ত')}</span><strong>{look?(look.above?label('Above','উপরে'):label('Below','নিচে')):'—'}</strong></div>
     </div>
     <p className="spaceScienceSource">{label('Orbital epoch','কক্ষপথের Epoch')}: {tle.epoch?timeLabel(Date.parse(tle.epoch)):'—'} · {label('SGP4 model from TLE, not direct live spacecraft telemetry.','TLE থেকে SGP4 গণনা; সরাসরি স্যাটেলাইট টেলিমেট্রি নয়।')}</p>
     <button className="spaceSciencePrimary" type="button" onClick={()=>onSatellite(chosen.id)}>{label('OPEN SELECTED SATELLITE','নির্বাচিত স্যাটেলাইট খুলুন')} <ArrowUpRight size={16}/></button>
    </>}
   </section>
   <section className="spaceSciencePanel">
    <div className="spaceSciencePanelTitle"><h4><Compass size={19}/>{label('OBSERVER SKY INTELLIGENCE','আকাশ পর্যবেক্ষণ বিশ্লেষণ')}</h4></div>
    <p>{location?.label||label('Manual observer','নির্ধারিত পর্যবেক্ষক')} · {observer?`${fmt(observer.lat,3)}°, ${fmt(observer.lon,3)}°`:label('Invalid coordinates','অবৈধ স্থানাঙ্ক')}</p>
    <div className="spaceScienceSun"><Sun size={18}/><span>{label('SUN ALTITUDE','সূর্যের উচ্চতাকোণ')}</span><strong>{fmt(sky?.sun.alt,1)}°</strong><small>{sky?.darkness||'—'}</small></div>
    <h5>{label('PLANETS ABOVE HORIZON','দিগন্তের উপরে গ্রহ')}</h5>
    <div className="spaceScienceTargets">{abovePlanets.length?abovePlanets.slice(0,5).map(p=><div key={p.name}><div><strong>{p.name}</strong><span>{fmt(p.alt,1)}° · {direction(p.az)}</span></div><div className="spaceScienceTrack"><span style={{width:Math.max(0,Math.min(100,p.alt/90*100))+'%'}}/></div></div>):<p className="spaceScienceNote">{label('No sampled planets above the horizon at this model time.','এই মডেল সময়ে কোনো নমুনাভুক্ত গ্রহ দিগন্তের উপরে নেই।')}</p>}</div>
    <h5>{label('GALAXIES ABOVE HORIZON','দিগন্তের উপরে গ্যালাক্সি')}</h5>
    <div className="spaceScienceTargets">{galaxies.length?galaxies.slice(0,4).map(g=><button type="button" key={g.id} onClick={()=>onGalaxy(g.id)}><strong>{g.name}</strong><span>{fmt(g.alt,1)}° · {direction(g.az)} <ArrowUpRight size={12}/></span></button>):<p className="spaceScienceNote">{label('No catalog galaxies above the horizon for the selected model time.','নির্বাচিত সময়ে তালিকাভুক্ত কোনো গ্যালাক্সি দিগন্তের উপরে নেই।')}</p>}</div>
    <p className="spaceScienceSource">{label('Above horizon does not guarantee optical visibility. Sunlight, light pollution, weather, magnitude and equipment matter.','দিগন্তের উপরে থাকা মানেই খালি চোখে দেখা যাবে এমন নয়। আবহাওয়া, আলোকদূষণ ও যন্ত্রের ওপর নির্ভর করে।')}</p>
   </section>
  </div>
  <div className="spaceScienceMethod"><Info size={19}/><p><strong>{label('SCIENTIFIC METHOD & LIMITATIONS','বৈজ্ঞানিক পদ্ধতি ও সীমাবদ্ধতা')}</strong> {label('Positions use Astronomy Engine for celestial objects and satellite.js SGP4 for validated TLEs. Epoch age is a data-freshness indicator, not a positional-accuracy score. Future time shifts are illustrative predictions; model errors can grow with TLE age. No direct spacecraft telemetry or visual-sighting evidence is claimed.','গ্রহের অবস্থানে Astronomy Engine ও বৈধ TLE-এর জন্য satellite.js SGP4 ব্যবহৃত। Epoch-এর বয়স ডেটার সতেজতা বোঝায়, নির্ভুলতার স্কোর নয়। ভবিষ্যৎ গণনা অনুমাননির্ভর; এটি সরাসরি স্যাটেলাইট টেলিমেট্রি নয়।')}</p></div>
 </section>;
}
