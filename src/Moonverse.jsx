import React,{Suspense,lazy,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,ChevronRight,Clock3,Compass,Database,ExternalLink,Globe2,Info,Orbit,Pause,Play,Search,SlidersHorizontal} from 'lucide-react';
import {MOON_PLANETS,MOONS,MOON_SOURCE,moonsForPlanet,moonById,moonPlanet,moonCatalogSummary} from './moonCatalog.mjs';
import {moonRelativeEpoch,sceneMoonList} from './moonOrbitMath.mjs';
import {searchMoonScience,physicalParameters} from './moonScience.mjs';
import {moonRenderPolicy} from './moonPerformance.mjs';
import {HORIZONS_PATH,HORIZONS_SOURCE,validateHorizonsSnapshot,interpolateHorizons,horizonsDistanceKm,HORIZONS_BODIES} from './horizonsCore.mjs';
import {useLanguage} from './i18n.jsx';
import FeatureBoundary from './FeatureBoundary.jsx';
import './Moonverse.css';
const MoonverseScene=lazy(()=>import('./MoonverseScene.jsx'));
const MoonScienceLab=lazy(()=>import('./MoonScienceLab.jsx'));
const frame=(date)=>date?.toLocaleDateString?.(undefined,{dateStyle:'medium'})||'—';
const num=(n,fraction=1)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:fraction}):'Not available';
const initialMoon=planet=>moonsForPlanet(planet)[0]?.id||'';
export default function Moonverse({initialPlanet='Jupiter',initialMoonId='',onPlanet=()=>{},onSelectParent=()=>{},quality='high'}){
 const {language}=useLanguage();const bn=language==='bn';const t=(a,b)=>bn?b:a;
 const [planet,setPlanet]=useState(MOON_PLANETS.some(p=>p.name===initialPlanet)?initialPlanet:'Jupiter');
 const [moonId,setMoonId]=useState(()=>moonById(initialMoonId)?.id||initialMoon(initialPlanet));
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('all'),[order,setOrder]=useState('orbit-asc');
 const [active,setActive]=useState(true),[speed,setSpeed]=useState(1);
 const [date,setDate]=useState(()=>new Date());
 const [orbitalMode,setOrbitalMode]=useState('model'),[snapshot,setSnapshot]=useState(null),[snapshotStatus,setSnapshotStatus]=useState('loading'),[snapshotError,setSnapshotError]=useState('');
 const [sceneOnscreen,setSceneOnscreen]=useState(true),[pageVisible,setPageVisible]=useState(document.visibilityState!=='hidden');
 const [scenePreference,setScenePreference]=useState('auto');
 const viewport=useRef(null);
 async function loadEphemeris(signal){
  setSnapshotStatus('loading');setSnapshotError('');
  try{
   const response=await fetch(import.meta.env.BASE_URL+HORIZONS_PATH,{cache:'no-store',signal});
   if(!response.ok)throw Error('Snapshot HTTP '+response.status);
   const data=await response.json();
   const validity=validateHorizonsSnapshot(data);
   if(!validity.valid)throw Error(validity.reason);
   if(signal?.aborted)return;
   setSnapshot(data);setSnapshotStatus('ready');
  }catch(e){
   if(signal?.aborted)return;
   setSnapshot(null);setSnapshotStatus('unavailable');setSnapshotError(String(e?.message||e));
  }
 }
 useEffect(()=>{const controller=new AbortController();loadEphemeris(controller.signal);return()=>controller.abort()},[]);
 useEffect(()=>{
  if(!MOON_PLANETS.some(p=>p.name===initialPlanet))return;
  setPlanet(initialPlanet);setMoonId(moonById(initialMoonId)?.planet===initialPlanet?initialMoonId:initialMoon(initialPlanet));
 },[initialPlanet,initialMoonId]);
 useEffect(()=>{
  const onChange=()=>setPageVisible(document.visibilityState!=='hidden');
  document.addEventListener('visibilitychange',onChange);
  return()=>document.removeEventListener('visibilitychange',onChange);
 },[]);
 useEffect(()=>{
  const node=viewport.current;
  if(!node||typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(([entry])=>setSceneOnscreen(!!entry?.isIntersecting),{threshold:[0,.01]});
  observer.observe(node);
  return()=>observer.disconnect();
 },[planet]);
 const all=useMemo(()=>moonsForPlanet(planet),[planet]);
 const shown=useMemo(()=>searchMoonScience(all,{query,category,sort:order}),[all,query,category,order]);
 const selected=moonById(moonId)?.planet===planet?moonById(moonId):all[0]||null;
 const parent=moonPlanet(planet);
 const sceneMoons=useMemo(()=>sceneMoonList(planet),[planet]);
 const selectedRendered=!!selected&&sceneMoons.some(x=>x.id===selected.id);
 const baseDays=useMemo(()=>moonRelativeEpoch(date),[date]);
 const summary=moonCatalogSummary();
 const atMs=date.getTime();
 const verifiedForPlanet=useMemo(()=>sceneMoons.filter(m=>!!interpolateHorizons(snapshot,m.id,atMs)),[sceneMoons,snapshot,atMs]);
 const scientificEnabled=verifiedForPlanet.length>0;
 const effectiveMode=orbitalMode==='horizons'&&scientificEnabled?'horizons':'model';
 const selectedVector=selected?interpolateHorizons(snapshot,selected.id,atMs):null;
 const scenePolicy=moonRenderPolicy({preference:scenePreference,appQuality:quality,
  saveData:navigator.connection?.saveData===true,reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true,
  coarsePointer:window.matchMedia?.('(pointer: coarse)').matches===true,memoryGb:navigator.deviceMemory||null,
  hidden:!pageVisible,onScreen:sceneOnscreen,mode:effectiveMode,speed,playing:active});
 const sceneActive=scenePolicy.animate;
 function changePlanet(name){setPlanet(name);setMoonId(initialMoon(name));setQuery('');setCategory('all');onSelectParent(name)}
 function changeDate(value){const parsed=new Date(value.includes('T')?value+':00.000Z':value+'T00:00:00.000Z');if(Number.isFinite(parsed.getTime()))setDate(parsed)}
 return <section className="moonverse" aria-label="Moonverse Observatory">
  <div className="moonverseHero">
   <div><span className="moonverseEyebrow">AURORA / MOONVERSE OBSERVATORY / v5.4</span>
    <h3><Orbit size={29}/>{t('Planetary Moon Systems','গ্রহ ও প্রাকৃতিক উপগ্রহের জগৎ')}</h3>
    <p>{t('Travel among natural moons, inspect scientific facts, and explore educational 3D orbits without mistaking them for live ephemerides.','প্রাকৃতিক উপগ্রহের বৈজ্ঞানিক তথ্য, আবিষ্কার ও 3D orbital simulation দেখুন। এটি live orbital ephemeris নয়।')}</p>
   </div><div className="moonverseHeroMark"><strong>{summary.curated}</strong><small>{t('CURATED MOONS','নির্বাচিত উপগ্রহ')}</small></div>
  </div>
  <div className="moonversePlanetRail" role="group" aria-label="Select parent planet or dwarf planet">
   {MOON_PLANETS.map(p=><button type="button" key={p.name} aria-pressed={p.name===planet} className={p.name===planet?'active':''} onClick={()=>changePlanet(p.name)}>
    <span className="moonverseOrb" style={{'--orb-color':p.color}} aria-hidden="true"/>
    <span>{p.name}</span><small>{p.hasKnownMoons?moonsForPlanet(p.name).length+' '+t('selected','নির্বাচিত'):t('none','নেই')}</small>
   </button>)}
  </div>
  <div className="moonverseSummary">
   <div><small>{t('PARENT WORLD','মাতৃ গ্রহ')}</small><strong>{parent?.name}</strong></div>
   <div><small>{t('CATALOG ENTRIES','ক্যাটালগের উপগ্রহ')}</small><strong>{all.length}</strong></div>
   <div><small>{t('3D OBJECTS','3D উপগ্রহ')}</small><strong>{sceneMoons.length}</strong></div>
   <div><small>{t('ORBIT MODEL','কক্ষপথ মডেল')}</small><strong>{effectiveMode==='horizons'?'JPL ICRF':t('Illustrative','শিক্ষামূলক')}</strong></div>
  </div>
  {all.length===0?<div className="moonverseEmpty">
   <Globe2 size={26}/><h4>{planet}: {t('No natural moons','কোনো প্রাকৃতিক উপগ্রহ নেই')}</h4>
   <p>{t('Neither Mercury nor Venus has a confirmed natural moon. Choose another planet to explore its satellite system.','Mercury ও Venus-এর কোনো স্বীকৃত প্রাকৃতিক উপগ্রহ নেই। অন্য গ্রহ নির্বাচন করুন।')}</p>
  </div>:<div className="moonverseWorkspace">
   <div className="moonverseScenePanel">
    <div className="moonverseSceneHeader"><div><span className="moonverseEyebrow">INTERACTIVE 3D / {planet.toUpperCase()}</span><h4>{t('Orbital Observatory','অরবিটাল অবজারভেটরি')}</h4></div>
     <span className="moonverseSimulationTag">{effectiveMode==='horizons'?t('JPL SAMPLED VECTORS · UTC','JPL সংগৃহীত অবস্থান · UTC'):t('ILLUSTRATIVE MODEL · NOT LIVE','শিক্ষামূলক মডেল · লাইভ নয়')}</span></div>
    <div ref={viewport} className="moonverseCanvas" aria-label={'Interactive 3D orbit illustration of '+planet}>
     <FeatureBoundary name="Moonverse 3D renderer"><Suspense fallback={<div className="moonverseLoading" role="status">{t('Loading 3D moon system…','3D উপগ্রহ লোড হচ্ছে…')}</div>}>
      <MoonverseScene key={planet+'-'+effectiveMode} planet={parent} moons={sceneMoons} selectedId={selected?.id} onSelect={setMoonId} epochDays={baseDays||0} speed={speed} active={sceneActive} quality={scenePolicy.quality} mode={effectiveMode} snapshot={snapshot} atMs={atMs}/>
     </Suspense></FeatureBoundary>
    </div>
    <div className="moonverseHorizonsModes" role="group" aria-label="Moon orbit position source">
      <button type="button" aria-pressed={effectiveMode==='model'} className={effectiveMode==='model'?'active':''} onClick={()=>setOrbitalMode('model')}>{t('EDUCATIONAL ORBITS','শিক্ষামূলক কক্ষপথ')}</button>
      <button type="button" aria-pressed={effectiveMode==='horizons'} className={effectiveMode==='horizons'?'active':''} disabled={!scientificEnabled} onClick={()=>setOrbitalMode('horizons')}>{t('JPL HORIZONS SNAPSHOT','JPL Horizons অবস্থান')}</button>
      <button type="button" aria-label="Reload Horizons snapshot" onClick={()=>loadEphemeris()} disabled={snapshotStatus==='loading'}>{snapshotStatus==='loading'?'CHECKING…':'CHECK DATA'}</button>
     </div>
    <div className="moonverseEphemerisStatus" role="status">
     {snapshotStatus==='ready'?<>{t('Verified JPL snapshot captured','JPL snapshot সংগ্রহের সময়')}: <strong>{new Date(snapshot.createdAt).toISOString().slice(0,16).replace('T',' ')} UTC</strong> · {verifiedForPlanet.length} {t('moons covered at selected UTC time','টি উপগ্রহ এই UTC সময়ে পাওয়া যাচ্ছে')}</>:<>{t('No verified JPL position data currently available','যাচাইকৃত JPL অবস্থানের তথ্য পাওয়া যায়নি')}: {snapshotStatus==='loading'?t('checking…','পরীক্ষা হচ্ছে…'):snapshotError||t('educational mode','শিক্ষামূলক মোড')}</>}
     {snapshotStatus==='ready'&&!scientificEnabled&&<span> · {t('Selected time/planet outside snapshot coverage; educational model shown','নির্বাচিত সময়/গ্রহ snapshot-এর বাইরে; শিক্ষামূলক মডেল দেখানো হচ্ছে')}</span>}
    </div>
    <div className="moonverseSceneControls">
     <label>{t('3D QUALITY','3D মান')}
      <select aria-label="Moonverse 3D rendering quality" value={scenePreference} onChange={e=>setScenePreference(e.target.value)}>
       <option value="auto">AUTO</option><option value="eco">ECO</option><option value="detail">DETAIL</option>
      </select>
     </label>
     <button type="button" disabled={effectiveMode==='horizons'} onClick={()=>setActive(v=>!v)} aria-pressed={!active}>{active?<Pause size={15}/>:<Play size={15}/>} {active?t('PAUSE','থামাও'):t('RESUME','চালাও')}</button>
     <label><SlidersHorizontal size={14}/> {t('SIM SPEED','সিমুলেশনের গতি')}
      <select aria-label="Moon orbit playback speed" disabled={effectiveMode==='horizons'} value={speed} onChange={e=>setSpeed(Number(e.target.value))}>
       <option value="0">0×</option><option value=".25">0.25×</option><option value="1">1×</option><option value="5">5×</option>
      </select>
     </label>
     <label><Clock3 size={14}/> {t('UTC TIMESTAMP','UTC সময়')} <input aria-label="Moon orbital time UTC" type="datetime-local" step="60" min="2000-01-01T00:00" max="2100-12-31T23:59" value={date.toISOString().slice(0,16)} onChange={e=>changeDate(e.target.value)}/></label>
    </div>
    <p className="moonverseNotice"><Info size={15}/>{scenePolicy.explanation} · {t('Up to 12 moon models; no measured GPU FPS. Switch to ECO if scroll or camera motion feels slow.','সর্বোচ্চ ১২টি moon model; এটি GPU FPS পরীক্ষা নয়। scroll বা camera ধীর হলে ECO নির্বাচন করুন।')}</p>
    <p className="moonverseNotice"><Info size={15}/>{effectiveMode==='horizons'?t('JPL planet-centered geometric ICRF vectors, sampled every hour and linearly interpolated up to 60 minutes apart. Position directions are referenced to the source frame; visual distance is compressed. Trails show only the available snapshot interval, not complete orbits. No live Horizons API requests are made by this website.','JPL-র গ্রহ-কেন্দ্রিক ICRF অবস্থান প্রতি ঘণ্টায় সংগৃহীত, মাঝের সময় linear interpolation। 3D দূরত্ব সংকুচিত এবং রেখা শুধু snapshot সময়সীমার, পুরো কক্ষপথ নয়। ওয়েবসাইট সরাসরি Horizons API ব্যবহার করে না।'):t('Educational two-body orbital ellipses, arbitrary phase and simplified orientations—not observational ephemerides. Distances compressed and moon sizes enlarged.','শিক্ষামূলক উপবৃত্তাকার কক্ষপথ, আনুমানিক phase ও দিক। বাস্তব বর্তমান অবস্থান নয়। দূরত্ব সংকুচিত ও উপগ্রহের আকার বড়।')}</p>
   </div>
   <div className="moonverseCatalogPanel">
    <div className="moonverseCatalogHeader"><h4><Database size={18}/>{t('Moon Catalog','উপগ্রহ ক্যাটালগ')}</h4><span>{shown.length} / {all.length}</span></div>
    <label className="moonverseSearch"><Search size={16}/><input aria-label="Search natural moons" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Search moon, geology, mission, JPL ID…','উপগ্রহ, ভূতত্ত্ব, অভিযান, JPL ID…')}/></label>
    <div className="moonverseCatalogFilters">
     <label>{t('TYPE','ধরন')}<select aria-label="Filter moon category" value={category} onChange={e=>setCategory(e.target.value)}>
      <option value="all">ALL</option>
      {[...new Set(all.map(m=>m.category))].sort().map(type=><option value={type} key={type}>{type}</option>)}
     </select></label>
     <label>{t('SORT','ক্রম')}<select aria-label="Sort natural moons" value={order} onChange={e=>setOrder(e.target.value)}>
      <option value="orbit-asc">ORBITAL DISTANCE</option><option value="radius-desc">LARGEST FIRST</option>
      <option value="gravity-desc">GRAVITY (DERIVED)</option><option value="name-asc">A–Z</option>
     </select></label>
    </div>
    <div className="moonverseCatalogList" role="group" aria-label="Natural moon selections">
     {shown.map(m=><button type="button" className={selected?.id===m.id?'selected':''} key={m.id} aria-pressed={selected?.id===m.id} onClick={()=>setMoonId(m.id)}>
      <span className="moonverseMiniMoon" aria-hidden="true"/><span><strong>{m.name}</strong><small>{m.category} · {num(m.radiusKm,1)} km {t('radius','ব্যাসার্ধ')} · JPL {physicalParameters(m)?.naifCode||'—'}</small></span><ChevronRight size={15}/>
     </button>)}
     {!shown.length&&<p>{t('No matching moon. Clear search to show the selected catalog.','কোনো উপগ্রহ মেলেনি। অন্য শব্দ দিয়ে খুঁজুন।')}</p>}
    </div>
    <p className="moonverseCatalogFoot">{t('Named major/selected moons only. This is not a full inventory of every discovered planetary satellite.','শুধু নির্বাচিত ও গুরুত্বপূর্ণ প্রাকৃতিক উপগ্রহ। এটি সব আবিষ্কৃত উপগ্রহের পূর্ণ তালিকা নয়।')}</p>
   </div>
  </div>}
  {selected&&<section className="moonverseIntelligence" aria-label={'Scientific profile of '+selected.name}>
   <div className="moonverseIntelligenceHeader"><div><span className="moonverseEyebrow">{planet.toUpperCase()} / MOON INTELLIGENCE</span><h4>{selected.name}</h4><span className="moonverseCategory">{selected.category.toUpperCase()} · {t('NATURAL SATELLITE','প্রাকৃতিক উপগ্রহ')}</span></div>
    {planet!=='Pluto'&&<button type="button" onClick={()=>onPlanet(planet)}><ArrowUpRight size={15}/>{t('PARENT PLANET DATA','গ্রহের বিস্তারিত')}</button>}
   </div>
   {!selectedRendered&&<p className="moonverseNotice">{t('This catalog moon is not one of the 12 objects rendered simultaneously in the 3D scene for performance. Its scientific profile remains accessible.','পারফরম্যান্সের জন্য এই উপগ্রহটি 3D scene-এ render করা হয়নি, কিন্তু বৈজ্ঞানিক তথ্য পাওয়া যাবে।')}</p>}
   <div className="moonverseMetrics">
    <div><small>{t('MEAN RADIUS','গড় ব্যাসার্ধ')}</small><strong>{num(selected.radiusKm)} km</strong></div>
    <div><small>{t('ORBIT DISTANCE','কক্ষপথের গড় দূরত্ব')}</small><strong>{num(selected.orbitKm,0)} km</strong></div>
    <div><small>{t('SIDEREAL PERIOD','কক্ষপথের সময়')}</small><strong>{num(Math.abs(selected.periodDays),3)} {t('days','দিন')}</strong></div>
    <div><small>{t('ECCENTRICITY','উৎকেন্দ্রিকতা')}</small><strong>{num(selected.eccentricity,4)}</strong></div>
    <div><small>{t('ORBIT SENSE','কক্ষপথের দিক')}</small><strong>{selected.periodDays<0?t('Retrograde','বিপরীতমুখী'):t('Prograde*','সামনের দিকে*')}</strong></div>
    <div><small>{t('DISCOVERY','আবিষ্কার')}</small><strong>{selected.discovery}</strong></div>
   </div>
   <FeatureBoundary name="Moonverse Advanced Science"><Suspense fallback={<p role="status" className="moonverseNotice">Loading advanced scientific data…</p>}>
    <MoonScienceLab moon={selected}/>
   </Suspense></FeatureBoundary>
   <div className="moonverseEphemerisDetail"><h5>{t('JPL Orbital Intelligence','JPL কক্ষপথ গবেষণা')}</h5>{selectedVector?<p><strong>{selected.name}:</strong> {t('Planet-relative distance','গ্রহ থেকে দূরত্ব')} {num(horizonsDistanceKm(selectedVector),1)} km · {selectedVector.sampled?t('exact snapshot sample','সংগৃহীত sample'):t('hourly-sample interpolation','ঘণ্টাভিত্তিক interpolation')} · {new Date(selectedVector.timeMs).toISOString()} UTC</p>:<p>{t('No verified UTC vector for this moon and timestamp. Its educational orbit remains available.','নির্বাচিত সময়ে এই উপগ্রহের যাচাইকৃত vector নেই। শিক্ষামূলক কক্ষপথ ব্যবহার করুন।')}</p>}<a href={HORIZONS_SOURCE} target="_blank" rel="noreferrer">JPL Horizons API documentation</a></div>
   <div className="moonverseResearchGrid">
    <article><h5><BookOpen size={17}/>{t('Scientific Highlight','বৈজ্ঞানিক বৈশিষ্ট্য')}</h5><p>{selected.science}</p></article>
    <article><h5><Globe2 size={17}/>{t('Surface & Geology','পৃষ্ঠ ও ভূতত্ত্ব')}</h5><p>{selected.surface}</p></article>
    <article><h5><Compass size={17}/>{t('Exploration & Missions','মহাকাশ অভিযান')}</h5><p>{selected.missions.join(' · ')}</p></article>
   </div>
   <div className="moonverseSources"><strong>{t('Sources & limitations','তথ্যসূত্র ও সীমাবদ্ধতা')}</strong>
    <p>{t('Rounded reference values. Orbital plane/phase and body appearance are artistic educational representations. Discovery, density, gravity and orbital information are not equally established for all small moons.','সংখ্যাগুলো আনুমানিক/রাউন্ড করা। 3D orbit ও body texture শিক্ষামূলক visualization; সব ছোট উপগ্রহের তথ্য সমান নির্ভুল নয়।')}</p>
    <div><a href={MOON_SOURCE.nasa} target="_blank" rel="noreferrer">NASA Moons <ExternalLink size={12}/></a><a href={MOON_SOURCE.jpl} target="_blank" rel="noreferrer">JPL Physical Data <ExternalLink size={12}/></a><a href={MOON_SOURCE.orbits} target="_blank" rel="noreferrer">JPL Orbital Elements <ExternalLink size={12}/></a></div>
   </div>
  </section>}
  <p className="moonverseFoot">{t('Next expansion: wider confirmed moon inventory, verified image assets, orbital ephemerides and advanced moon interior research. The current release deliberately prioritizes a fast, accessible curated explorer.','পরবর্তী ধাপে পূর্ণ Moon inventory, যাচাইকৃত ছবি, Horizons ephemerides ও moon interior গবেষণা যোগ হবে। বর্তমান release দ্রুত ও সহজ curated explorer হিসেবে তৈরি।')}</p>
 </section>;
}
