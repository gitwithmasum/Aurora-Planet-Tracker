import React,{useEffect,useState} from 'react';
import {andromedaHero} from './andromedaHero.mjs';
import {Orbit,Satellite,Globe2,ScanLine,ArrowUpRight,ChevronRight,Search,Clock3,MapPin,Compass,Stars,Layers3,Activity,BookOpen,Play} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import './AuroraDashboard.css';

const LINKS=[
 {name:'Planet Intelligence',icon:Orbit,detail:'Explore eight planets and their calculated positions.',asset:'jupiter.jpg',eyebrow:'PLANETARY DATA'},
 {name:'Satellite Tracker',icon:Satellite,detail:'Explore orbital paths, pass predictions and AR guidance.',asset:'earth.jpg',eyebrow:'ORBITAL MISSIONS'},
 {name:'Earth Observation',icon:Globe2,detail:'Explore NASA imagery, Earth events and global locations.',asset:'earth.jpg',eyebrow:'EARTH SCIENCE'},
 {name:'AR Scanner',icon:ScanLine,detail:'Camera-assisted sky exploration on compatible devices.',asset:'saturn.jpg',eyebrow:'AUGMENTED SKY'}
];
const MORE=[{name:'Sky Tonight',icon:Stars,subtitle:'Your night-sky outlook'},{name:'Solar System',icon:Orbit,subtitle:'Interactive solar system'},{name:'Galaxy Observatory',icon:Compass,subtitle:'Deep-sky exploration'},{name:'Command Center',icon:Activity,subtitle:'Live orbital visualization'},{name:'Space Intelligence',icon:Activity,subtitle:'Scientific orbital and sky data'},{name:'Observation Planner',icon:Clock3,subtitle:'Night-sky targets and viewing windows'},{name:'Satellite Weather',icon:Satellite,subtitle:'Pass conditions, sunlight and cloud forecasts'},{name:'Field Journal',icon:BookOpen,subtitle:'Personal observing sessions and reports'}];
const tex=asset=>import.meta.env.BASE_URL+'planet-textures/'+asset;
export default function AuroraDashboard({onNavigate,onOpenSearch,sky,observer,now}){
 const [catalogCount,setCatalogCount]=useState(null);
 useEffect(()=>{let active=true;loadSatelliteCatalog().then(d=>{if(active)setCatalogCount(d.rows.length)}).catch(()=>{});return()=>{active=false}},[]);
 const visible=sky.filter(p=>p.visible&&Number.isFinite(p.alt)).sort((a,b)=>b.alt-a.alt);
 return <div className="auroraDashboard" aria-label="Aurora Planet Tracker Dashboard">
  <div className="auroraDashSearchBar"><button type="button" className="auroraDashSearchLauncher" onClick={onOpenSearch} aria-label="Open universal space search"><Search size={20}/><span>Search planets, satellites, galaxies, missions…</span><kbd>Ctrl K</kbd></button><span className="auroraDashLocation"><MapPin size={16}/> {observer.label||'Manual observer'}</span></div>
  <section className="auroraDashHero auroraDashHero--andromeda" style={{'--hero-art':`url("${andromedaHero}")`}} aria-label="Aurora Planet Tracker Andromeda galaxy hero"><div className="auroraDashHeroCopy">
   <span className="auroraDashOverline">EXPLORE &nbsp; · &nbsp; TRACK &nbsp; · &nbsp; DISCOVER</span>
   <h2><span>AURORA</span><strong>PLANET TRACKER</strong></h2>
   <p className="auroraDashTagline">A CLEARER UNIVERSE,<br/><em>A BRIGHTER TOMORROW.</em></p>
   <button type="button" className="auroraDashExplore" onClick={()=>onNavigate('Solar System')}>START EXPLORING <ArrowUpRight size={19}/></button>
  </div>
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
