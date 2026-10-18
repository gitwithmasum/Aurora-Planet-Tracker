import React,{Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Orbit,Satellite,Globe2,ScanLine,ArrowUpRight,ChevronRight,Search,Clock3,MapPin,Compass,Stars,Layers3,Activity,BookOpen,Play} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import './AuroraDashboard.css';

const LINKS=[
 {name:'Planet Intelligence',icon:Orbit,detail:'Explore eight planets and their calculated positions.',asset:'jupiter.jpg',eyebrow:'PLANETARY DATA'},
 {name:'Satellite Tracker',icon:Satellite,detail:'Explore orbital paths, pass predictions and AR guidance.',asset:'earth.jpg',eyebrow:'ORBITAL MISSIONS'},
 {name:'Earth Observation',icon:Globe2,detail:'Explore NASA imagery, Earth events and global locations.',asset:'earth.jpg',eyebrow:'EARTH SCIENCE'},
 {name:'AR Scanner',icon:ScanLine,detail:'Camera-assisted sky exploration on compatible devices.',asset:'saturn.jpg',eyebrow:'AUGMENTED SKY'}
];
const MORE=[{name:'Sky Tonight',icon:Stars,subtitle:'Your night-sky outlook'},{name:'Solar System',icon:Orbit,subtitle:'Interactive solar system'},{name:'Galaxy Observatory',icon:Compass,subtitle:'Deep-sky exploration'},{name:'Command Center',icon:Activity,subtitle:'Live orbital visualization'}];
const tex=asset=>import.meta.env.BASE_URL+'planet-textures/'+asset;
// True-color Earth (Three.js example imagery); retain the bundled JPL map as an offline fallback.
// The dashboard intentionally remains an interactive 3D scene, not a flattened screenshot.
const TRUE_COLOR_EARTH='https://raw.githubusercontent.com/mrdoob/three.js/r175/examples/textures/planets/earth_atmos_2048.jpg';
function SpinningEarth(){
 const mesh=useRef(),[map,setMap]=useState(null);
 useEffect(()=>{
  let active=true;
  const loader=new THREE.TextureLoader();
  const accept=value=>{
   if(!active){value.dispose();return}
   value.colorSpace=THREE.SRGBColorSpace;
   value.anisotropy=2;
   setMap(value);
  };
  // A failed network request must not leave a permanently blank globe.
  loader.load(TRUE_COLOR_EARTH,accept,undefined,()=>loader.load(tex('earth.jpg'),accept,undefined,()=>{}));
  return()=>{active=false};
 },[]);
 useEffect(()=>()=>map?.dispose(),[map]);
 useFrame((_,delta)=>{if(mesh.current)mesh.current.rotation.y+=Math.min(delta,.05)*.042});
 return <group rotation={[.12,0,.12]}>
  <mesh ref={mesh} rotation={[0,.36,0]}>
   <sphereGeometry args={[2.45,64,48]}/>
   <meshStandardMaterial map={map} color={map?'#ffffff':'#297fc2'} roughness={.91} metalness={0}/>
  </mesh>
  <mesh><sphereGeometry args={[2.52,48,32]}/><meshBasicMaterial color="#35b7ff" transparent opacity={.105} side={THREE.BackSide} depthWrite={false}/></mesh>
  {[0,.75,-.74].map((angle,i)=><mesh key={i} rotation={[.55+angle/3,angle,.19+i*.18]}>
   <torusGeometry args={[3.16,.008,4,120]}/>
   <meshBasicMaterial color={i===1?'#e74388':'#bf8636'} transparent opacity={i===1?.44:.53} depthWrite={false}/>
  </mesh>)}
 </group>;
}
function EarthPreview(){
 return <div className="auroraDashEarth" role="img" aria-label="Rotating true-color Earth preview with decorative orbital rings">
  <Canvas camera={{position:[0,.6,8.7],fov:43}} dpr={[1,1.4]} gl={{antialias:true,alpha:true,powerPreference:'low-power'}}>
   <ambientLight intensity={.72}/><directionalLight position={[5,6,7]} color="#fff0df" intensity={2.7}/>
   <directionalLight position={[-4,-2,-6]} color="#459bff" intensity={.46}/>
   <hemisphereLight args={['#f3fbff','#17385c',.38]}/>
   <Suspense fallback={null}><SpinningEarth/></Suspense>
  </Canvas>
  <span className="auroraDashEarthTag"><Globe2 size={14}/> EARTH / 3D PREVIEW</span>
 </div>;
}
export default function AuroraDashboard({onNavigate,sky,observer,now}){
 const [text,setText]=useState(''),[catalogCount,setCatalogCount]=useState(null);
 useEffect(()=>{let active=true;loadSatelliteCatalog().then(d=>{if(active)setCatalogCount(d.rows.length)}).catch(()=>{});return()=>{active=false}},[]);
 const matches=useMemo(()=>[...LINKS,...MORE].filter(x=>(x.name+' '+(x.detail||x.subtitle||'')).toLowerCase().includes(text.toLowerCase().trim())),[text]);
 const visible=sky.filter(p=>p.visible&&Number.isFinite(p.alt)).sort((a,b)=>b.alt-a.alt);
 return <div className="auroraDashboard" aria-label="Aurora Planet Tracker Dashboard">
  <div className="auroraDashSearchBar"><Search size={20}/><input aria-label="Search dashboard modules" placeholder="Search planets, satellites, Earth observation, sky…" value={text} onChange={e=>setText(e.target.value)}/><span className="auroraDashLocation"><MapPin size={16}/> {observer.label||'Manual observer'}</span></div>
  {text.trim()&&<div className="auroraDashMatches" role="region" aria-label="Dashboard search results">
   {matches.length?matches.map(x=><button key={x.name} type="button" onClick={()=>{onNavigate(x.name);setText('')}}>{x.name}<ArrowUpRight size={14}/></button>):<span>No matching module. Try “Earth” or “Satellite”.</span>}
  </div>}
  <section className="auroraDashHero"><div className="auroraDashHeroCopy">
   <span className="auroraDashOverline">EXPLORE &nbsp; · &nbsp; TRACK &nbsp; · &nbsp; DISCOVER</span>
   <h2><span>AURORA</span><strong>PLANET TRACKER</strong></h2>
   <p className="auroraDashTagline">A CLEARER UNIVERSE,<br/><em>A BRIGHTER TOMORROW.</em></p>
   <button type="button" className="auroraDashExplore" onClick={()=>onNavigate('Solar System')}>START EXPLORING <ArrowUpRight size={19}/></button>
  </div><EarthPreview/>
   <div className="auroraDashHeroStats">
    <div><Satellite size={19}/><strong>{catalogCount===null?'—':catalogCount}</strong><span>Catalogued satellites</span></div>
    <div><Orbit size={19}/><strong>8</strong><span>Solar system planets</span></div>
    <div><Globe2 size={19}/><strong>NASA</strong><span>Dated Earth imagery</span></div>
   </div>
  </section>
  <div className="auroraDashHeading"><span>MISSION MODULES</span><p>Explore connected scientific tools and simulations.</p></div>
  <div className="auroraDashFeatures">{LINKS.map((x,i)=>{const Icon=x.icon;return <button className="auroraDashFeature" type="button" key={x.name} onClick={()=>onNavigate(x.name)}>
    <div className="auroraDashFeatureHeader"><Icon size={23}/><span>{x.eyebrow}</span><ChevronRight size={19}/></div>
    <strong>{x.name}</strong><p>{x.detail}</p>
    <div className="auroraDashFeatureArt" style={{backgroundImage:`linear-gradient(0deg,rgba(255,255,255,.16),transparent),url("${tex(x.asset)}")`}}/>
    <span className="auroraDashFeatureFooter">{['8 PLANETS','LIVE ORBIT ESTIMATES','NASA SCIENCE SOURCES','EXPERIMENTAL AR'][i]} <ArrowUpRight size={14}/></span>
   </button>})}</div>
  <div className="auroraDashBottom">
   <section className="auroraDashPanel"><div className="auroraDashPanelTitle"><Stars size={18}/><strong>SKY TONIGHT</strong><button onClick={()=>onNavigate('Sky Tonight')}>OPEN <ChevronRight size={14}/></button></div>
    <p>Calculated positions for {observer.label||'your selected observer'}.</p>
    <div className="auroraDashSky">{visible.length?visible.slice(0,5).map(p=><div key={p.name}><span className="auroraDashPlanetMini" style={{backgroundImage:`url("${tex(p.name.toLowerCase()+'.jpg')}")`}}/><strong>{p.name}</strong><small>{p.alt.toFixed(0)}° altitude</small></div>):<span>No planets above the horizon in the current sample.</span>}</div>
   </section>
   <section className="auroraDashPanel"><div className="auroraDashPanelTitle"><Activity size={18}/><strong>MISSION CONTROL</strong><button onClick={()=>onNavigate('Satellite Tracker')}>OPEN <ChevronRight size={14}/></button></div>
    <p>Satellite predictions, imagery and interactive orbital tools.</p>
    <div className="auroraDashQuickList">{MORE.map(x=>{const Icon=x.icon;return <button key={x.name} onClick={()=>onNavigate(x.name)}><Icon size={17}/><span><strong>{x.name}</strong><small>{x.subtitle}</small></span><ChevronRight size={14}/></button>})}</div>
   </section>
   <section className="auroraDashPanel"><div className="auroraDashPanelTitle"><Globe2 size={18}/><strong>EARTH OBSERVATION</strong><button onClick={()=>onNavigate('Earth Observation')}>OPEN <ChevronRight size={14}/></button></div>
    <div className="auroraDashMiniEarth"><img src={tex('earth.jpg')} alt="Earth surface imagery texture preview"/></div><p>Browse NASA Earth imagery, cloud-cover estimates and documented natural events.</p>
    <div className="auroraDashSource">DATA SOURCES: NASA GIBS · EONET · OPEN-METEO</div>
   </section>
  </div>
  <div className="auroraDashCredits"><Clock3 size={13}/> Dashboard rendered {now.toLocaleString()} · Orbital estimates and dated datasets are not continuous live spacecraft feeds.</div>
 </div>;
}
