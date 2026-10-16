import React,{Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,Stars,Html} from '@react-three/drei';
import * as THREE from 'three';
import {Globe2,Satellite,Search,Play,Pause,LocateFixed,RotateCcw,Focus} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import {orbitalSamples,satelliteTelemetry,EARTH_MODEL_RADIUS,geoToScene} from './satelliteOrbit.mjs';
import {EARTH_LAYERS,loadEarthScienceData,markerColor,layerValue,ageHours} from './earthScienceData.mjs';
import './EarthObservation.css';

const COLORS=['#67edff','#ffb969','#a5ffcb','#ff86c3','#c5acff','#9be7a1'];
const textureUrl=import.meta.env.BASE_URL+'planet-textures/earth.jpg';
const fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—';
function EarthBody(){
 const texture=useMemo(()=>{const map=new THREE.TextureLoader().load(textureUrl);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map},[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group>
  <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS,72,48]}/><meshStandardMaterial map={texture} roughness={.91} metalness={0}/></mesh>
  <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS*1.024,48,32]}/><meshBasicMaterial color="#4f9bff" transparent opacity={.07} side={THREE.BackSide} depthWrite={false}/></mesh>
 </group>;
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
  {showLabel&&<Html position={[.14,.16,0]} center={false} distanceFactor={8} style={{pointerEvents:'none'}}><span className={'earthMissionLabel '+(active?'selected':'')}>{record.name}</span></Html>}
 </group>;
}
function WeatherMarkers({layer,points,onSelect}){
 if(!layer||layer==='events')return null;
 return <group>{points.map((p,i)=><group key={p.name+'-'+i} position={geoToScene(p.lat,p.lon,22)}>
  <mesh onClick={e=>{e.stopPropagation();onSelect({kind:'weather',...p})}}>
   <sphereGeometry args={[.046+p.cloudPercent/6000,10,8]}/><meshBasicMaterial color={markerColor(layer,p)} depthTest={true} toneMapped={false}/>
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
 useFrame((_,delta)=>{
  if(!enabled||!target||!controls)return;
  const desired=new THREE.Vector3(...target);
  const diff=desired.clone().sub(controls.target);
  const factor=1-Math.exp(-delta*2.2);
  camera.position.addScaledVector(diff,factor);
  controls.target.lerp(desired,factor);
  controls.update();
 });
 return null;
}
function EarthScene({records,selectedId,positions,samples,showOrbits,labels,follow,onChoose,eco,science,layer,onScienceChoose}){
 const active=positions.find(p=>p.id===selectedId)?.point||null;
 return <Canvas camera={{position:[0,1.2,10.3],fov:44}} dpr={[1,eco?1:1.5]} gl={{alpha:false,antialias:!eco,powerPreference:'low-power'}}>
  <color attach="background" args={['#030a17']}/>
  <ambientLight intensity={.7}/><directionalLight position={[8,5,6]} intensity={2.6}/><hemisphereLight args={['#85b8ff','#131d37',.5]}/>
  {!eco&&<Stars radius={65} depth={45} count={1800} factor={3} saturation={0} fade speed={0}/>}
  <Suspense fallback={null}><EarthBody/></Suspense>
  {science&&layer==='events'?<EventMarkers events={science.events} onSelect={onScienceChoose}/>:<WeatherMarkers layer={layer} points={science?.weatherSamples||[]} onSelect={onScienceChoose}/>}
  {records.map((record,index)=><React.Fragment key={record.id}>
    {showOrbits&&<OrbitLine points={samples[record.id]||[]} color={COLORS[index%COLORS.length]}/>}
    <Craft record={record} active={selectedId===record.id} color={COLORS[index%COLORS.length]} onChoose={onChoose} showLabel={labels} clock={positions.find(p=>p.id===record.id)?.clock||Date.now()}/>
  </React.Fragment>)}
  <OrbitControls makeDefault enableDamping dampingFactor={.065} enablePan={false} minDistance={4.6} maxDistance={22}/>
  <Follow target={active} enabled={follow}/>
 </Canvas>;
}
export default function EarthObservation(){
 const [catalog,setCatalog]=useState([]),[error,setError]=useState(''),[status,setStatus]=useState('loading');
 const [selectedId,setSelectedId]=useState('iss'),[query,setQuery]=useState('');
 const [visibleIds,setVisibleIds]=useState(['iss','tiangong','hubble','noaa19','noaa20']);
 const [labels,setLabels]=useState(true),[showOrbits,setShowOrbits]=useState(true),[follow,setFollow]=useState(false),[eco,setEco]=useState(false),[paused,setPaused]=useState(false);
 const [now,setNow]=useState(Date.now()),[offset,setOffset]=useState(0);
 const [science,setScience]=useState(null),[scienceError,setScienceError]=useState(''),[scienceStatus,setScienceStatus]=useState('loading'),[layer,setLayer]=useState('none'),[scienceChoice,setScienceChoice]=useState(null);
 async function refreshScience(){setScienceStatus('loading');setScienceError('');try{const data=await loadEarthScienceData();setScience(data);setScienceStatus('ready')}catch(error){setScienceError(error.message||'Earth data unavailable');setScienceStatus('error')}}
 useEffect(()=>{refreshScience()},[]);
 const reload=async()=>{setStatus('loading');setError('');try{const data=await loadSatelliteCatalog();setCatalog(data.rows);setStatus('ready')}catch(e){setStatus('error');setError(e.message||'Catalog unavailable')}};
 useEffect(()=>{reload()},[]);
 useEffect(()=>{if(paused)return;const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[paused]);
 const sceneTime=now+offset*60000;
 const records=useMemo(()=>catalog.filter(s=>visibleIds.includes(s.id)).slice(0,6),[catalog,visibleIds]);
 const epochMinute=Math.floor(sceneTime/60000);
 const orbitSamples=useMemo(()=>Object.fromEntries(records.map(record=>[record.id,orbitalSamples(record.satrec,epochMinute*60000,110,eco?150:90)])),[records,epochMinute,eco]);
 const positions=useMemo(()=>records.map(record=>({id:record.id,clock:sceneTime,point:satelliteTelemetry(record.satrec,new Date(sceneTime))?.point})).filter(x=>x.point),[records,sceneTime]);
 const selected=catalog.find(item=>item.id===selectedId)||null;
 const info=useMemo(()=>selected?satelliteTelemetry(selected.satrec,new Date(sceneTime)):null,[selected,sceneTime]);
 const result=catalog.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())||String(s.noradId).includes(query)).slice(0,30);
 function choose(id){setSelectedId(id);setVisibleIds(current=>current.includes(id)?current:[...current.slice(-5),id])}
 function toggle(id){setVisibleIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current.slice(-5),id])}
 return <section className="earthMission" aria-label="Earth Observation mission view">
  <div className="earthMissionTop"><div><span className="eyebrow">AURORA / EARTH OBSERVATION / PHASE B</span><h3><Globe2 size={28}/> Earth Mission View</h3><p>Interactive Earth globe with calculated spacecraft positions, selectable orbital paths and cinematic camera following.</p></div><span className="earthMissionLive">{paused?'SIMULATION PAUSED':offset?'SIMULATED TIME':'CALCULATED NOW'}</span></div>
  <div className="earthMissionDashboard"><div><small>TRACKED CATALOG</small><b>{catalog.length}</b></div><div><small>VISIBLE ORBITS</small><b>{records.length}</b></div><div><small>FOCUSED MISSION</small><b>{selected?.name||'—'}</b></div><div><small>TIME (LOCAL)</small><b>{new Date(sceneTime).toLocaleTimeString()}</b></div></div>
  <div className="earthMissionStage">
    <div className="earthMissionCanvas" aria-label="Interactive 3D Earth with satellite orbits">
     {records.length?<EarthScene records={records} selectedId={selectedId} positions={positions} samples={orbitSamples} showOrbits={showOrbits} labels={labels} follow={follow} onChoose={choose} eco={eco} science={science} layer={layer} onScienceChoose={setScienceChoice}/>:<div className="earthMissionEmpty">{status==='loading'?'Loading mission orbits…':error||'Select spacecraft to start mission view.'}</div>}
     <div className="earthMissionCorner">AURORA · EARTH OBSERVATION<br/>SGP4 / TLE-DERIVED ESTIMATES</div>
    </div>
    <div className="earthMissionPanel">
     <h4><Satellite size={17}/> SATELLITE MISSIONS</h4>
     <input aria-label="Search Earth Observation satellites" placeholder="Search satellites / NORAD…" value={query} onChange={e=>setQuery(e.target.value)}/>
     {status==='error'&&<p className="earthMissionError" role="alert">{error} <button onClick={reload}>RETRY</button></p>}
     <div className="earthMissionSatList">{result.map(s=><div key={s.id} className={s.id===selectedId?'active':''}><input type="checkbox" checked={visibleIds.includes(s.id)} aria-label={'Show orbit for '+s.name} onChange={()=>toggle(s.id)}/><button type="button" onClick={()=>choose(s.id)}>{s.name}<small>NORAD {s.noradId} · {s.category}</small></button></div>)}</div>
     <div className="earthMissionFocused"><small>CURRENT SATELLITE</small><strong>{selected?.name||'None selected'}</strong><span>ALT {fmt(info?.altitudeKm)} km · {fmt(info?.speedKmS,2)} km/s</span><span>LAT {fmt(info?.latitude,2)}° · LON {fmt(info?.longitude,2)}°</span></div>
     <button className={follow?'earthMissionActive':''} type="button" onClick={()=>setFollow(x=>!x)}><Focus size={16}/> {follow?'STOP FOLLOWING':'FOLLOW SATELLITE'}</button>
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
  <section className="earthSciencePanel" aria-label="Earth science data layers">
    <div className="earthScienceHeader"><div><span className="eyebrow">EARTH SCIENCE / VERIFIED SOURCES</span><h4>Earth Data Layers</h4><p>Model-based weather samples at a sparse set of geographic points and timestamped NASA event locations—not a continuous global raster or live satellite image.</p></div><button type="button" onClick={refreshScience} disabled={scienceStatus==='loading'}>REFRESH SOURCE DATA</button></div>
    <div className="earthScienceOptions">
      <button type="button" aria-pressed={layer==='none'} onClick={()=>setLayer('none')}>NONE</button>
      {EARTH_LAYERS.map(x=><button key={x.id} type="button" aria-pressed={layer===x.id} onClick={()=>{setLayer(x.id);setScienceChoice(null)}}>{x.label.toUpperCase()}</button>)}
    </div>
    <div className="earthScienceMeta"><span>DATA: {scienceStatus==='ready'?'AVAILABLE':scienceStatus.toUpperCase()}</span><span>WEATHER SAMPLES: {science?.weatherSamples?.length||0}</span><span>NASA EVENTS: {science?.events?.length||0}</span><span>FETCHED: {science?.fetchedAt?new Date(science.fetchedAt).toLocaleString():'—'}</span></div>
    {scienceError&&<p role="alert" className="earthScienceWarning">{scienceError}</p>}
    {!!science?.errors?.length&&<p role="status" className="earthScienceWarning">Data provider warning: {science.errors.join(' | ')}. Source timestamps are retained; data may be older than refresh time.</p>}
    {science&&layer!=='none'&&<div className="earthScienceResults">
      {layer==='events'?<div className="earthScienceEvents">
        {science.events.length?science.events.slice(0,12).map(e=><button key={e.id} type="button" className={scienceChoice?.id===e.id?'active':''} onClick={()=>setScienceChoice({kind:'event',...e})}><strong>{e.title}</strong><span>{e.category||'Natural event'} · {new Date(e.date).toLocaleDateString()}</span></button>):<p>No recent open EONET events available.</p>}
      </div>:<div className="earthScienceSamples">{science.weatherSamples.map(p=><button key={p.name} type="button" className={scienceChoice?.name===p.name?'active':''} onClick={()=>setScienceChoice({kind:'weather',...p})}><strong>{p.name}</strong><span>{layerValue(layer,p)}</span><small>{new Date(p.observedAt).toLocaleString()} · {ageHours(p.observedAt).toFixed(1)}h old</small></button>)}</div>}
      {scienceChoice&&<div className="earthScienceSelection"><strong>{scienceChoice.kind==='event'?scienceChoice.title:scienceChoice.name}</strong><span>{scienceChoice.kind==='event'?scienceChoice.category:layerValue(layer,scienceChoice)}</span><span>LAT {scienceChoice.lat.toFixed(2)}° · LON {scienceChoice.lon.toFixed(2)}°</span><span>DATA TIME: {new Date(scienceChoice.kind==='event'?scienceChoice.date:scienceChoice.observedAt).toLocaleString()}</span></div>}
    </div>}
    <p className="earthScienceAttribution">Weather: <a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Open-Meteo Forecast API</a> (forecast model, sparse point samples). Events: <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA EONET</a> (curated event reports, not a real-time disaster alert). Color-coded dots mark sampled locations; dots do not cover regions between sample coordinates.</p>
  </section>
  <p className="earthMissionDisclaimer">NASA-inspired visualization, not affiliated with or endorsed by NASA. Uses bundled Earth imagery and recent public satellite orbital elements. Positions are computed estimates, not a live spacecraft GPS stream. Only a curated sample of the catalog is rendered at once to limit GPU load. Weather model samples and NASA EONET event markers are provided with source dates in the Earth Data Layers panel. These are not continuously observed global satellite imagery.</p>
 </section>;
}
