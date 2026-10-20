import React,{Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,Stars,Text} from '@react-three/drei';
import * as THREE from 'three';
import {Globe2,Satellite,Search,Play,Pause,LocateFixed,RotateCcw,Focus} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import {orbitalSamples,satelliteTelemetry,EARTH_MODEL_RADIUS,geoToScene} from './satelliteOrbit.mjs';
import {EARTH_LAYERS,loadEarthScienceData,markerColor,layerValue,ageHours} from './earthScienceData.mjs';
import {EVENT_WINDOWS,eventCategories,filterEarthEvents,sourceEventLink} from './earthEventsExplorer.mjs';
import {loadNasaImageryManifest,imageryAssetUrl,NASA_IMAGERY_ATTRIBUTION} from './earthImageryData.mjs';
import {timelineDates,comparisonPair,clampComparison,nextTimelineDate,cloudMarkerRadius} from './earthVisualizationMath.mjs';
import EarthLocationIntelligence from './EarthLocationIntelligence.jsx';
import GlobalLocationExplorer from './GlobalLocationExplorer.jsx';
import './EarthObservation.css';

const COLORS=['#67edff','#ffb969','#a5ffcb','#ff86c3','#c5acff','#9be7a1'];
const textureUrl=import.meta.env.BASE_URL+'planet-textures/earth.jpg';
const fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—';
function EarthBody({imageUrl,imageryOpacity,onImageStatus}){
 const texture=useMemo(()=>{const map=new THREE.TextureLoader().load(textureUrl);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map},[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group>
  <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS,72,48]}/><meshStandardMaterial map={texture} roughness={.91} metalness={0}/></mesh>
  {imageUrl&&<DatedEarthOverlay key={imageUrl} url={imageUrl} opacity={imageryOpacity} onStatus={onImageStatus}/>}
  <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS*1.024,48,32]}/><meshBasicMaterial color="#4f9bff" transparent opacity={.07} side={THREE.BackSide} depthWrite={false}/></mesh>
 </group>;
}
function DatedEarthOverlay({url,opacity,onStatus}){
 const [map,setMap]=useState(null);
 useEffect(()=>{
  let active=true;
  onStatus('loading');
  const loader=new THREE.TextureLoader();
  loader.load(url,texture=>{
   if(!active){texture.dispose();return}
   texture.colorSpace=THREE.SRGBColorSpace;
   texture.anisotropy=4;
   setMap(texture);
   onStatus('ready');
  },undefined,()=>{
   if(active){setMap(null);onStatus('error')}
  });
  return()=>{active=false};
 },[url,onStatus]);
 useEffect(()=>()=>{map?.dispose()},[map]);
 if(!map)return null;
 return <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS*1.007,72,48]}/><meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/></mesh>;
}
function OrbitLine({points,color}){
 const geometry=useMemo(()=>points.length>1?new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p.point))):null,[points]);
 useEffect(()=>()=>geometry?.dispose(),[geometry]);
 return geometry?<line geometry={geometry}><lineBasicMaterial color={color} transparent opacity={.65} depthWrite={false}/></line>:null;
}
function Craft({record,active,color,onChoose,showLabel,clock}){
 const current=useMemo(()=>satelliteTelemetry(record.satrec,new Date(clock)),[record,clock]);
 if(!current)return null;
 return <group position={current.point}>
  <mesh onClick={e=>{e.stopPropagation();onChoose(record.id)}}><octahedronGeometry args={[active?.13:.08,0]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
  {active&&<mesh><sphereGeometry args={[.2,12,8]}/><meshBasicMaterial color={color} transparent opacity={.19} depthWrite={false}/></mesh>}
  {showLabel&&<Text position={[.14,.16,0]} fontSize={.13} anchorX="left" anchorY="middle" maxWidth={2.8} color={active?'#ffbfe3':'#bce7ff'} outlineColor="#081d35" outlineWidth={.005}>{record.name}</Text>}
 </group>;
}
function WeatherMarkers({layer,points,onSelect,cloudDetail=1}){
 if(!layer||layer==='none'||layer==='events')return null;
 return <group>{points.map((p,i)=><group key={p.name+'-'+i} position={geoToScene(p.lat,p.lon,22)}>
  <mesh onClick={e=>{e.stopPropagation();onSelect({kind:'weather',...p})}}>
   <sphereGeometry args={[layer==='cloud'?cloudMarkerRadius(p.cloudPercent)*cloudDetail:.046+p.cloudPercent/6000,10,8]}/><meshBasicMaterial color={markerColor(layer,p)} depthTest={true} toneMapped={false}/>
  </mesh>
 </group>)}</group>;
}
function EventMarkers({events,onSelect}){
 return <group>{events.map(e=><group key={e.id} position={geoToScene(e.lat,e.lon,38)}>
  <mesh onClick={ev=>{ev.stopPropagation();onSelect({kind:'event',...e})}}>
   <octahedronGeometry args={[.095,0]}/><meshBasicMaterial color="#ffcf68" toneMapped={false}/>
  </mesh>
 </group>)}</group>;
}
function Follow({target,enabled}){
 const {camera,controls}=useThree();
 const desired=useRef(new THREE.Vector3()),diff=useRef(new THREE.Vector3());
 useFrame((_,delta)=>{
  if(!enabled||!target||!controls)return;
  desired.current.set(target[0],target[1],target[2]);
  diff.current.subVectors(desired.current,controls.target);
  const factor=1-Math.exp(-delta*2.2);
  camera.position.addScaledVector(diff.current,factor);
  controls.target.lerp(desired.current,factor);
  controls.update();
 });
 return null;
}
function EarthScene({records,selectedId,positions,samples,showOrbits,labels,follow,onChoose,eco,foreground,paused,science,layer,onScienceChoose,focusedEvent,focusedLocation,events,imageUrl,imageryOpacity,onImageStatus,cloudDetail}){
 const active=positions.find(p=>p.id===selectedId)?.point||null;
 return <Canvas frameloop={!foreground||paused?'demand':'always'} camera={{position:[0,1.2,10.3],fov:44}} dpr={[1,eco?1:1.5]} gl={{alpha:false,antialias:!eco,powerPreference:'low-power'}}>
  <color attach="background" args={['#030a17']}/>
  <ambientLight intensity={.7}/><directionalLight position={[8,5,6]} intensity={2.6}/><hemisphereLight args={['#85b8ff','#131d37',.5]}/>
  {!eco&&<Stars radius={65} depth={45} count={1800} factor={3} saturation={0} fade speed={0}/>}
  <Suspense fallback={null}><EarthBody imageUrl={imageUrl} imageryOpacity={imageryOpacity} onImageStatus={onImageStatus}/></Suspense>
  {science&&layer==='events'?<EventMarkers events={events} onSelect={onScienceChoose}/>:<WeatherMarkers layer={layer} points={science?.weatherSamples||[]} onSelect={onScienceChoose} cloudDetail={cloudDetail}/>}
  {records.map((record,index)=><React.Fragment key={record.id}>
    {showOrbits&&<OrbitLine points={samples[record.id]||[]} color={COLORS[index%COLORS.length]}/>}
    <Craft record={record} active={selectedId===record.id} color={COLORS[index%COLORS.length]} onChoose={onChoose} showLabel={labels} clock={positions.find(p=>p.id===record.id)?.clock||Date.now()}/>
  </React.Fragment>)}
  <OrbitControls makeDefault enableDamping dampingFactor={.065} enablePan={false} minDistance={4.6} maxDistance={22}/>
  {focusedLocation&&<group position={geoToScene(focusedLocation.lat,focusedLocation.lon,38)}><mesh><sphereGeometry args={[.11,12,10]}/><meshBasicMaterial color="#8cf9d9" toneMapped={false}/></mesh></group>}
  <Follow target={focusedLocation?geoToScene(focusedLocation.lat,focusedLocation.lon,0):focusedEvent?geoToScene(focusedEvent.lat,focusedEvent.lon,0):active} enabled={Boolean(focusedLocation)||Boolean(focusedEvent)||follow}/>
 </Canvas>;
}
export default function EarthObservation({initialEco=false,foreground=true}){
 const [catalog,setCatalog]=useState([]),[error,setError]=useState(''),[status,setStatus]=useState('loading');
 const [selectedId,setSelectedId]=useState('iss'),[query,setQuery]=useState('');
 const [visibleIds,setVisibleIds]=useState(['iss','tiangong','hubble','noaa19','noaa20']);
 const [labels,setLabels]=useState(true),[showOrbits,setShowOrbits]=useState(true),[follow,setFollow]=useState(false),[eco,setEco]=useState(()=>initialEco||(typeof window!=='undefined'&&window.matchMedia?.('(max-width: 720px), (prefers-reduced-motion: reduce)')?.matches===true)),[paused,setPaused]=useState(false);
 const [now,setNow]=useState(Date.now()),[offset,setOffset]=useState(0);
 const [imagery,setImagery]=useState(null),[imageryError,setImageryError]=useState(''),[imageryEnabled,setImageryEnabled]=useState(false),[imageryDate,setImageryDate]=useState(''),[imageryOpacity,setImageryOpacity]=useState(.85),[imageLoadStatus,setImageLoadStatus]=useState('idle');
 const [timelinePlaying,setTimelinePlaying]=useState(false),[compareEnabled,setCompareEnabled]=useState(false),[beforeDate,setBeforeDate]=useState(''),[compareSplit,setCompareSplit]=useState(50),[cloudDetail,setCloudDetail]=useState(1);
 async function refreshImagery(){setImageryError('');try{const x=await loadNasaImageryManifest();setImagery(x);setImageryDate(previous=>x.snapshots.some(s=>s.date===previous)?previous:x.snapshots[0].date);setBeforeDate(previous=>x.snapshots.some(s=>s.date===previous)?previous:x.snapshots[x.snapshots.length-1].date)}catch(e){setImageryError(e.message||'NASA imagery not available')}}
 useEffect(()=>{refreshImagery()},[]);
 const imageItem=imagery?.snapshots.find(x=>x.date===imageryDate);
 const dates=useMemo(()=>timelineDates(imagery?.snapshots||[]),[imagery]);
 const pair=comparisonPair(imagery?.snapshots||[],beforeDate,imageryDate);
 const beforeImage=pair?imageryAssetUrl(imagery.snapshots.find(x=>x.date===pair.before).file):null;
 const afterImage=pair?imageryAssetUrl(imagery.snapshots.find(x=>x.date===pair.after).file):null;
 useEffect(()=>{if(!timelinePlaying||dates.length<2||compareEnabled||!foreground)return;const timer=setInterval(()=>setImageryDate(previous=>nextTimelineDate(imagery.snapshots,previous)),2400);return()=>clearInterval(timer)},[timelinePlaying,dates.length,imagery,compareEnabled,foreground]);
 const imageUrl=imageryEnabled&&imageItem?imageryAssetUrl(imageItem.file):null;
 const onImageStatus=React.useCallback(next=>setImageLoadStatus(next),[]);
 const [science,setScience]=useState(null),[scienceError,setScienceError]=useState(''),[scienceStatus,setScienceStatus]=useState('loading'),[layer,setLayer]=useState('none'),[scienceChoice,setScienceChoice]=useState(null);
 const [eventCategory,setEventCategory]=useState('All'),[eventDays,setEventDays]=useState(30),[eventSearch,setEventSearch]=useState(''),[focusedEvent,setFocusedEvent]=useState(null),[focusedLocation,setFocusedLocation]=useState(null);
 const filteredEvents=useMemo(()=>filterEarthEvents(science?.events||[],{category:eventCategory,days:eventDays,search:eventSearch}),[science,eventCategory,eventDays,eventSearch]);
 const categories=useMemo(()=>eventCategories(science?.events||[]),[science]);
 function chooseScience(item){setScienceChoice(item);if(item?.kind==='event'){setFocusedEvent(item);setFocusedLocation(null);setFollow(false)}}
 async function refreshScience(){setScienceStatus('loading');setScienceError('');try{const data=await loadEarthScienceData();setScience(data);setScienceStatus('ready')}catch(error){setScienceError(error.message||'Earth data unavailable');setScienceStatus('error')}}
 useEffect(()=>{refreshScience()},[]);
 const reload=async()=>{setStatus('loading');setError('');try{const data=await loadSatelliteCatalog();setCatalog(data.rows);setStatus('ready')}catch(e){setStatus('error');setError(e.message||'Catalog unavailable')}};
 useEffect(()=>{reload()},[]);
 useEffect(()=>{if(paused||!foreground)return;setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[paused,foreground]);
 const sceneTime=now+offset*60000;
 const records=useMemo(()=>catalog.filter(s=>visibleIds.includes(s.id)).slice(0,6),[catalog,visibleIds]);
 const epochMinute=Math.floor(sceneTime/60000);
 const orbitSamples=useMemo(()=>Object.fromEntries(records.map(record=>[record.id,orbitalSamples(record.satrec,epochMinute*60000,110,eco?150:90)])),[records,epochMinute,eco]);
 const positions=useMemo(()=>records.map(record=>({id:record.id,clock:sceneTime,point:satelliteTelemetry(record.satrec,new Date(sceneTime))?.point})).filter(x=>x.point),[records,sceneTime]);
 const selected=catalog.find(item=>item.id===selectedId)||null;
 const info=useMemo(()=>selected?satelliteTelemetry(selected.satrec,new Date(sceneTime)):null,[selected,sceneTime]);
 const result=catalog.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())||String(s.noradId).includes(query)).slice(0,30);
 function choose(id){setSelectedId(id);setFocusedLocation(null);setFocusedEvent(null);setVisibleIds(current=>current.includes(id)?current:[...current.slice(-5),id])}
 function toggle(id){setVisibleIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current.slice(-5),id])}
 return <section className="earthMission" aria-label="Earth Observation mission view">
  <div className="earthMissionTop"><div><span className="eyebrow">AURORA / EARTH OBSERVATION / PHASE E</span><h3><Globe2 size={28}/> Earth Mission View</h3><p>Interactive Earth globe with calculated spacecraft positions, selectable orbital paths and cinematic camera following.</p></div><span className="earthMissionLive">{paused?'SIMULATION PAUSED':offset?'SIMULATED TIME':'CALCULATED NOW'}</span></div>
  <div className="earthMissionDashboard"><div><small>TRACKED CATALOG</small><b>{catalog.length}</b></div><div><small>VISIBLE ORBITS</small><b>{records.length}</b></div><div><small>FOCUSED MISSION</small><b>{selected?.name||'—'}</b></div><div><small>TIME (LOCAL)</small><b>{new Date(sceneTime).toLocaleTimeString()}</b></div></div>
  <div className="earthMissionStage">
    <div className="earthMissionCanvas" aria-label="Interactive 3D Earth with satellite orbits">
     {records.length?<EarthScene records={records} selectedId={selectedId} positions={positions} samples={orbitSamples} showOrbits={showOrbits} labels={labels} follow={follow} onChoose={choose} eco={eco} foreground={foreground} paused={paused} science={science} layer={layer} onScienceChoose={chooseScience} focusedEvent={focusedEvent} focusedLocation={focusedLocation} events={filteredEvents} imageUrl={imageUrl} imageryOpacity={imageryOpacity} onImageStatus={onImageStatus} cloudDetail={cloudDetail}/>:<div className="earthMissionEmpty">{status==='loading'?'Loading mission orbits…':error||'Select spacecraft to start mission view.'}</div>}
     <div className="earthMissionCorner">AURORA · EARTH OBSERVATION<br/>SGP4 / TLE-DERIVED ESTIMATES</div>
    </div>
    <div className="earthMissionPanel">
     <h4><Satellite size={17}/> SATELLITE MISSIONS</h4>
     <input aria-label="Search Earth Observation satellites" placeholder="Search satellites / NORAD…" value={query} onChange={e=>setQuery(e.target.value)}/>
     {status==='error'&&<p className="earthMissionError" role="alert">{error} <button onClick={reload}>RETRY</button></p>}
     <div className="earthMissionSatList">{result.map(s=><div key={s.id} className={s.id===selectedId?'active':''}><input type="checkbox" checked={visibleIds.includes(s.id)} aria-label={'Show orbit for '+s.name} onChange={()=>toggle(s.id)}/><button type="button" onClick={()=>choose(s.id)}>{s.name}<small>NORAD {s.noradId} · {s.category}</small></button></div>)}</div>
     <div className="earthMissionFocused"><small>CURRENT SATELLITE</small><strong>{selected?.name||'None selected'}</strong><span>ALT {fmt(info?.altitudeKm)} km · {fmt(info?.speedKmS,2)} km/s</span><span>LAT {fmt(info?.latitude,2)}° · LON {fmt(info?.longitude,2)}°</span></div>
     <button className={follow?'earthMissionActive':''} type="button" onClick={()=>{setFocusedEvent(null);setFocusedLocation(null);setFollow(x=>!x)}}><Focus size={16}/> {follow?'STOP FOLLOWING':'FOLLOW SATELLITE'}</button>
    </div>
  </div>
  <div className="earthMissionControls">
   <button type="button" onClick={()=>setPaused(x=>!x)}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?'RESUME':'PAUSE'}</button>
   <button type="button" onClick={()=>{setOffset(0);setNow(Date.now());setFollow(false)}}><RotateCcw size={16}/> RESET VIEW TIME</button>
   <label>TIME OFFSET <input aria-label="Earth Observation time offset" type="range" min="-90" max="90" step="5" value={offset} onChange={e=>setOffset(Number(e.target.value))}/><b>{offset>0?'+':''}{offset} min</b></label>
   <label><input type="checkbox" checked={showOrbits} onChange={e=>setShowOrbits(e.target.checked)}/> ORBIT PATHS</label>
   <label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/> LABELS</label>
   <label><input type="checkbox" checked={eco} onChange={e=>setEco(e.target.checked)}/> ECO GRAPHICS</label>
  </div>
  <GlobalLocationExplorer focusedName={focusedLocation?.name} onFocus={place=>{setFocusedLocation(place);setFocusedEvent(null);setFollow(false)}} onClearFocus={()=>setFocusedLocation(null)}/>
  <EarthLocationIntelligence focusedName={focusedLocation?.name} onFocus={city=>{setFocusedLocation(city);setFocusedEvent(null);setFollow(false)}} onClearFocus={()=>setFocusedLocation(null)}/>
  <section className="earthImageryPanel" aria-label="NASA Worldview imagery controls">
    <div className="earthImageryHeader"><div><span className="eyebrow">NASA GIBS / DATED EARTH IMAGERY</span><h4>NASA Worldview Imagery</h4><p>Authentic MODIS Terra true-color daily browse mosaics, layered over the globe. Select a date to view its imagery—not a live camera feed.</p></div><button type="button" onClick={refreshImagery}>REFRESH DATES</button></div>
    <div className="earthImageryControls">
      <label className="earthImageryToggle"><input type="checkbox" aria-label="Enable NASA Earth imagery overlay" checked={imageryEnabled} disabled={!imagery?.snapshots?.length} onChange={e=>setImageryEnabled(e.target.checked)}/> NASA IMAGERY OVERLAY</label>
      <label>IMAGERY DATE <select aria-label="NASA imagery date" value={imageryDate} onChange={e=>setImageryDate(e.target.value)} disabled={!imagery?.snapshots?.length}>{(imagery?.snapshots||[]).map(x=><option key={x.date} value={x.date}>{x.date}</option>)}</select></label>
      <label>OPACITY <input type="range" min=".2" max="1" step=".05" aria-label="NASA imagery opacity" value={imageryOpacity} onChange={e=>setImageryOpacity(Number(e.target.value))}/><strong>{Math.round(imageryOpacity*100)}%</strong></label>
    </div>
    <div className="earthImageryTimeline">
      <strong>IMAGERY TIMELINE · {dates.length} ARCHIVED DATES</strong>
      <div className="earthImageryTimelineActions">
       <button type="button" onClick={()=>setImageryDate(current=>{const i=dates.indexOf(current);return dates[Math.max(0,i-1)]||current})} disabled={!dates.length}>◀ PREVIOUS</button>
       <input type="range" min="0" max={Math.max(0,dates.length-1)} step="1" disabled={dates.length<2} aria-label="NASA imagery timeline" value={Math.max(0,dates.indexOf(imageryDate))} onChange={e=>setImageryDate(dates[Number(e.target.value)])}/>
       <button type="button" onClick={()=>setImageryDate(current=>nextTimelineDate(imagery.snapshots,current))} disabled={!dates.length}>NEXT ▶</button>
       <button type="button" onClick={()=>{setCompareEnabled(false);setTimelinePlaying(p=>!p)}} disabled={dates.length<2}>{timelinePlaying?'PAUSE TIMELINE':'PLAY TIMELINE'}</button>
       <label><input type="checkbox" aria-label="Compare NASA imagery dates" checked={compareEnabled} disabled={dates.length<2} onChange={e=>{setCompareEnabled(e.target.checked);setTimelinePlaying(false)}}/> BEFORE / AFTER</label>
      </div>
      {compareEnabled&&<div className="earthImageryCompare">
       <div className="earthImageryCompareTop"><label>BEFORE <select aria-label="NASA before imagery date" value={beforeDate} onChange={e=>setBeforeDate(e.target.value)}>{dates.map(d=><option key={d} value={d}>{d}</option>)}</select></label><label>AFTER <select aria-label="NASA after imagery date" value={imageryDate} onChange={e=>setImageryDate(e.target.value)}>{dates.map(d=><option key={d} value={d}>{d}</option>)}</select></label></div>
       {pair?<><div className="earthImageryBeforeAfter" aria-label="NASA imagery before and after comparison"><img src={beforeImage} alt={'MODIS Terra browse mosaic '+pair.before} loading="lazy"/><div className="earthImageryAfterClip" style={{clipPath:'inset(0 0 0 '+compareSplit+'%)'}}><img src={afterImage} alt={'MODIS Terra browse mosaic '+pair.after} loading="lazy"/></div><div className="earthImagerySplitLine" style={{left:compareSplit+'%'}}/></div><label className="earthImagerySplitControl">COMPARISON SPLIT <input type="range" aria-label="NASA imagery before after comparison split" min="0" max="100" value={compareSplit} onChange={e=>setCompareSplit(clampComparison(e.target.value))}/><b>{compareSplit}%</b></label><p className="earthImageryNote">Left: {pair.before} · Right: {pair.after}. These are global daily mosaics, so changes can reflect swath gaps and lighting, not just actual environmental changes. The main 3D globe shows the AFTER date.</p></>:<p className="earthImageryError">Choose two different dates to compare.</p>}
      </div>}
    </div>
    <div className="earthImageryMeta"><span>PROVIDER: NASA GIBS / MODIS TERRA</span><span>SELECTED DATE: {imageItem?.date||'—'}</span><span>TEXTURE: {imageUrl?imageLoadStatus.toUpperCase():'DISABLED'}</span><span>ARCHIVED IMAGERY: {imagery?.snapshots.length||0} DAYS</span></div>
    {imageryError&&<p role="alert" className="earthImageryError">{imageryError}</p>}
    {imageryEnabled&&imageLoadStatus==='error'&&<p role="alert" className="earthImageryError">NASA imagery texture failed to load. The base Earth globe is still available; try another date.</p>}
    <p className="earthImageryNote">{NASA_IMAGERY_ATTRIBUTION}. Browse imagery mosaics may have gaps and are not a timestamp-perfect single satellite photograph. Data coverage and acquisition vary by location. <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noopener noreferrer">Explore official NASA Worldview ↗</a></p>
  </section>
  <section className="earthSciencePanel" aria-label="Earth science data layers">
    <div className="earthScienceHeader"><div><span className="eyebrow">EARTH SCIENCE / VERIFIED SOURCES</span><h4>Earth Data Layers</h4><p>Model-based weather samples at a sparse set of geographic points and timestamped NASA event locations—not a continuous global raster or live satellite image.</p></div><button type="button" onClick={refreshScience} disabled={scienceStatus==='loading'}>REFRESH SOURCE DATA</button></div>
    <div className="earthScienceOptions">
      <button type="button" aria-pressed={layer==='none'} onClick={()=>setLayer('none')}>NONE</button>
      {EARTH_LAYERS.map(x=><button key={x.id} type="button" aria-pressed={layer===x.id} onClick={()=>{setLayer(x.id);setScienceChoice(null);setFocusedEvent(null)}}>{x.label.toUpperCase()}</button>)}
    </div>
    {layer==='cloud'&&<div className="earthCloudControls"><label>CLOUD MARKER SIZE <input type="range" aria-label="Cloud coverage marker size" min=".5" max="2" step=".25" value={cloudDetail} onChange={e=>setCloudDetail(Number(e.target.value))}/><b>{cloudDetail.toFixed(2)}×</b></label><p>Point-based Open-Meteo cloud cover, not a global cloud shell. Circle size reflects local estimated coverage.</p></div>}
   <div className="earthScienceMeta"><span>DATA: {scienceStatus==='ready'?'AVAILABLE':scienceStatus.toUpperCase()}</span><span>WEATHER SAMPLES: {science?.weatherSamples?.length||0}</span><span>NASA EVENTS: {science?.events?.length||0}</span><span>FETCHED: {science?.fetchedAt?new Date(science.fetchedAt).toLocaleString():'—'}</span></div>
    {scienceError&&<p role="alert" className="earthScienceWarning">{scienceError}</p>}
    {!!science?.errors?.length&&<p role="status" className="earthScienceWarning">Data provider warning: {science.errors.join(' | ')}. Source timestamps are retained; data may be older than refresh time.</p>}
    {science&&layer!=='none'&&<div className="earthScienceResults">
      {layer==='events'?<div className="earthEventsExplorer">
        <div className="earthEventsFilters">
         <label>EVENT CATEGORY <select aria-label="Filter Earth event category" value={eventCategory} onChange={e=>{setEventCategory(e.target.value);setScienceChoice(null);setFocusedEvent(null)}}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
         <label>DATE RANGE <select aria-label="Filter Earth event date range" value={eventDays} onChange={e=>{setEventDays(Number(e.target.value));setScienceChoice(null);setFocusedEvent(null)}}>{EVENT_WINDOWS.map(n=><option key={n} value={n}>Last {n} days</option>)}</select></label>
         <label>SEARCH <input aria-label="Search Earth events" placeholder="Storms, fires, places…" value={eventSearch} onChange={e=>setEventSearch(e.target.value)}/></label>
         <span>{filteredEvents.length} events in range</span>
        </div>
        <div className="earthScienceEvents">
          {filteredEvents.length?filteredEvents.map(e=><button key={e.id} type="button" className={scienceChoice?.id===e.id?'active':''} onClick={()=>chooseScience({kind:'event',...e})}><strong>{e.title}</strong><span>{e.category||'Natural event'} · {new Date(e.date).toLocaleDateString()}</span><small>FOCUS ON EARTH</small></button>):<p>No matching recent events in this catalog snapshot.</p>}
        </div>
        {focusedEvent&&<div className="earthEventsFocused"><span>CAMERA FOCUSED: {focusedEvent.title}</span><button type="button" onClick={()=>setFocusedEvent(null)}>EXIT EVENT FOCUS</button></div>}
       </div>:<div className="earthScienceSamples">{science.weatherSamples.map(p=><button key={p.name} type="button" className={scienceChoice?.name===p.name?'active':''} onClick={()=>setScienceChoice({kind:'weather',...p})}><strong>{p.name}</strong><span>{layerValue(layer,p)}</span><small>{new Date(p.observedAt).toLocaleString()} · {ageHours(p.observedAt).toFixed(1)}h old</small></button>)}</div>}
      {scienceChoice&&<div className="earthScienceSelection"><strong>{scienceChoice.kind==='event'?scienceChoice.title:scienceChoice.name}</strong><span>{scienceChoice.kind==='event'?scienceChoice.category:layerValue(layer,scienceChoice)}</span><span>LAT {scienceChoice.lat.toFixed(2)}° · LON {scienceChoice.lon.toFixed(2)}°</span><span>DATA TIME: {new Date(scienceChoice.kind==='event'?scienceChoice.date:scienceChoice.observedAt).toLocaleString()}</span>{scienceChoice.kind==='event'&&sourceEventLink(scienceChoice)&&<a href={sourceEventLink(scienceChoice)} target="_blank" rel="noopener noreferrer">NASA EONET SOURCE ↗</a>}</div>}
    </div>}
    <p className="earthScienceAttribution">Weather: <a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Open-Meteo Forecast API</a> (forecast model, sparse point samples). Events: <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA EONET</a> (curated event reports, not a real-time disaster alert). Color-coded dots mark sampled locations; dots do not cover regions between sample coordinates.</p>
  </section>
  <p className="earthMissionDisclaimer">NASA-inspired visualization, not affiliated with or endorsed by NASA. Uses bundled Earth imagery and recent public satellite orbital elements. Positions are computed estimates, not a live spacecraft GPS stream. Only a curated sample of the catalog is rendered at once to limit GPU load. Weather model samples, NASA EONET event markers and dated GIBS browse imagery are attributed in their respective panels. These are not continuously observed global satellite imagery.</p>
 </section>;
}
