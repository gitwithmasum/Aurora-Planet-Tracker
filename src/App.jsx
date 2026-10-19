import React,{Suspense,lazy,useEffect,useMemo,useRef,useState} from 'react';
import packageInfo from '../package.json';
import * as Astronomy from 'astronomy-engine';
const SolarScene=lazy(()=>import('./SolarScene.jsx'));
const PerformanceDiagnostics=lazy(()=>import('./PerformanceDiagnostics.jsx'));
const SkyMap=lazy(()=>import('./SkyMap.jsx'));
const ARScanner=lazy(()=>import('./ARScanner.jsx'));
const GalaxyObservatory=lazy(()=>import('./GalaxyObservatory.jsx'));
const SkyTonight=lazy(()=>import('./SkyTonight.jsx'));
import SatellitePassAlert from './SatellitePassAlert.jsx';
import FeatureBoundary from './FeatureBoundary.jsx';
const SatelliteTracker=lazy(()=>import('./SatelliteTracker.jsx'));
const EarthObservation=lazy(()=>import('./EarthObservation.jsx'));
const AuroraDashboard=lazy(()=>import('./AuroraDashboard.jsx'));
const UniversalSearch=lazy(()=>import('./UniversalSearch.jsx'));
const SpaceIntelligence=lazy(()=>import('./SpaceIntelligence.jsx'));
const ObservationPlanner=lazy(()=>import('./ObservationPlanner.jsx'));
const SatelliteWeatherPlanner=lazy(()=>import('./SatelliteWeatherPlanner.jsx'));
const FieldJournal=lazy(()=>import('./FieldJournal.jsx'));
const ObservationAnalytics=lazy(()=>import('./ObservationAnalytics.jsx'));
import {useSatellitePassAlert} from './useSatellitePassAlert.js';
import Sidebar from './Sidebar.jsx';
import PlanetPortrait from './PlanetPortrait.jsx';
import {chooseGraphicsQuality,resolveGraphicsQuality,shouldAnimateScene,isSolarSceneTab} from './performance.mjs';
import {GALAXIES} from './galaxyCatalog.mjs';
import './UniversalSearch.css';
import PWAStatus from './PWAStatus.jsx';
import galaxyBackdrop from './assets/deep-galaxy.svg';
import fullGalaxyBackdrop from './assets/full-galaxy.svg';
// Raster wallpaper preserves the original halftone design without costly SVG repaint on scroll.
import halftoneArtwork from './assets/aurora-halftone.webp';
import './HalftoneTheme.css';
import {useLanguage} from './i18n.jsx';
import {Orbit,Compass,MapPin,Search,Clock3,ScanLine,Globe2,Layers3,Activity,CalendarDays,BookOpen,BarChart3,Info,ArrowUpRight,LocateFixed,ChevronRight,Menu,X,Pause,Play,Volume2,VolumeX,Maximize2,Satellite,Eye} from 'lucide-react';

const AU=149597870.7;
const PLANETS=[
{name:'Mercury',color:'#b5a99a',size:.37,orbit:2.8,period:88,description:'The swiftest planet, racing around the Sun in just 88 Earth days.',type:'Terrestrial',temp:'167°C avg',moons:0},
{name:'Venus',color:'#e8bc82',size:.69,orbit:4.1,period:225,description:'A brilliant world wrapped in dense clouds and extreme heat.',type:'Terrestrial',temp:'464°C avg',moons:0},
{name:'Earth',color:'#4a9ddc',size:.73,orbit:5.7,period:365,description:'Our blue home — the only known planet harboring life.',type:'Terrestrial',temp:'15°C avg',moons:1},
{name:'Mars',color:'#dc754e',size:.51,orbit:7.2,period:687,description:'The red planet of vast canyons, polar ice and exploration.',type:'Terrestrial',temp:'−65°C avg',moons:2},
{name:'Jupiter',color:'#ddb08b',size:1.55,orbit:10,period:4333,description:'Giant storms whirl across the largest planet in our Solar System.',type:'Gas giant',temp:'−110°C cloud tops',moons:'95+'},
{name:'Saturn',color:'#dec89e',size:1.28,orbit:13.3,period:10759,description:'A magnificent gas giant surrounded by shimmering icy rings.',type:'Gas giant',temp:'−140°C cloud tops',moons:'140+'},
{name:'Uranus',color:'#87d9df',size:.96,orbit:16.5,period:30687,description:'An icy, pale-cyan world tipped dramatically onto its side.',type:'Ice giant',temp:'−195°C avg',moons:28},
{name:'Neptune',color:'#487fee',size:.94,orbit:19.8,period:60190,description:'A distant, deep-blue world swept by supersonic winds.',type:'Ice giant',temp:'−200°C avg',moons:16}
];
const compassName=(az)=>['N','NE','E','SE','S','SW','W','NW'][Math.round(az/45)%8];
const fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
function readAutoQuality(){
 const nav=typeof navigator==='undefined'?{}:navigator;
 const win=typeof window==='undefined'?{}:window;
 const connection=nav.connection||nav.mozConnection||nav.webkitConnection;
 return chooseGraphicsQuality({
  viewportWidth:win.innerWidth??1280,
  devicePixelRatio:win.devicePixelRatio??1,
  hardwareConcurrency:nav.hardwareConcurrency,
  deviceMemory:nav.deviceMemory,
  coarsePointer:win.matchMedia?.('(pointer: coarse)').matches??false,
  reducedMotion:win.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,
  saveData:connection?.saveData===true,
 });
}
function computePlanet(p,loc,date){try{const obs=new Astronomy.Observer(loc.lat,loc.lon,0);const eq=Astronomy.Equator(p.name,date,obs,true,true);const hor=Astronomy.Horizon(date,obs,eq.ra,eq.dec,'normal');return {...p,alt:hor.altitude,az:hor.azimuth,km:eq.dist*AU,visible:hor.altitude>0}}catch{return {...p,alt:null,az:null,km:null,visible:false}}}

function App(){const [journalPrefill,setJournalPrefill]=useState(null);const {language,setLanguage,t}=useLanguage();const [theme,setTheme]=useState(()=>{try{return ['classic','cosmic','nebula','halftone'].includes(localStorage.getItem('aurora-galaxy-theme'))?localStorage.getItem('aurora-galaxy-theme'):'halftone'}catch{return 'halftone'}}),[entered,setEntered]=useState(false),[tab,setTab]=useState('Dashboard'),[selected,setSelected]=useState(PLANETS[4]),[loc,setLoc]=useState({lat:23.8103,lon:90.4125,label:'Dhaka • manual default'}),[now,setNow]=useState(new Date()),[paused,setPaused]=useState(false),[focus,setFocus]=useState(false),[inspection,setInspection]=useState(false),[speed,setSpeed]=useState(1),[quality,setQuality]=useState(()=>{try{const saved=localStorage.getItem('aurora-graphics-quality');return ['auto','high','low'].includes(saved)?saved:'auto'}catch{return 'auto'}}),[autoQuality,setAutoQuality]=useState(()=>readAutoQuality()),[pageVisible,setPageVisible]=useState(()=>document.visibilityState!=='hidden'),[scaleMode,setScaleMode]=useState('readable'),[search,setSearch]=useState(''),[searchOpen,setSearchOpen]=useState(false),[searchSatelliteId,setSearchSatelliteId]=useState('iss'),[searchGalaxyId,setSearchGalaxyId]=useState('m31'),[menu,setMenu]=useState(false),[sidebarCollapsed,setSidebarCollapsed]=useState(()=>{try{return localStorage.getItem('aurora-sidebar-collapsed')==='true'}catch{return false}}),[locationError,setLocationError]=useState(''),[sensor,setSensor]=useState(null),[camera,setCamera]=useState(false);const video=useRef(null),stream=useRef(null);
const sceneViewport=useRef(null);
const [sceneVisible,setSceneVisible]=useState(true);
const [reduceMotion,setReduceMotion]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true);
const [showPerf,setShowPerf]=useState(false);
useEffect(()=>{
 if(!pageVisible)return;
 setNow(new Date());
 const id=setInterval(()=>setNow(new Date()),30000);
 return()=>clearInterval(id);
},[pageVisible]);
useEffect(()=>{
 if(!isSolarSceneTab(tab))return;
 const node=sceneViewport.current;
 if(!node||typeof IntersectionObserver==='undefined'){setSceneVisible(true);return;}
 const observer=new IntersectionObserver(entries=>{
  const entry=entries[0];
  if(entry)setSceneVisible(entry.isIntersecting&&entry.intersectionRatio>.01);
 },{threshold:[0,.01,.15]});
 observer.observe(node);
 return()=>observer.disconnect();
},[tab]);
useEffect(()=>{
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!media)return;
 const change=()=>{setReduceMotion(media.matches);setAutoQuality(readAutoQuality())};
 media.addEventListener?.('change',change);
 return()=>media.removeEventListener?.('change',change);
},[]);
useEffect(()=>{try{localStorage.setItem('aurora-galaxy-theme',theme)}catch{}},[theme]);
useEffect(()=>{try{localStorage.setItem('aurora-sidebar-collapsed',String(sidebarCollapsed))}catch{}},[sidebarCollapsed]);
useEffect(()=>{try{localStorage.setItem('aurora-graphics-quality',quality)}catch{}},[quality]);
useEffect(()=>{
 const refresh=()=>setAutoQuality(readAutoQuality());
 const onVisibility=()=>setPageVisible(document.visibilityState!=='hidden');
 const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 window.addEventListener('resize',refresh,{passive:true});
 document.addEventListener('visibilitychange',onVisibility);
 connection?.addEventListener?.('change',refresh);
 return()=>{window.removeEventListener('resize',refresh);document.removeEventListener('visibilitychange',onVisibility);connection?.removeEventListener?.('change',refresh)};
},[]);
useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[]);
useEffect(()=>{
 const shortcut=event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
   event.preventDefault();
   setSearchOpen(value=>!value);
  }
 };
 document.addEventListener('keydown',shortcut);
 return()=>document.removeEventListener('keydown',shortcut);
},[]);
const passAlert=useSatellitePassAlert(loc);
const resolvedQuality=resolveGraphicsQuality(quality,autoQuality);
const sceneAnimated=shouldAnimateScene({pageVisible,sceneVisible,paused,reducedMotion:reduceMotion});
const sky=useMemo(()=>PLANETS.map(p=>computePlanet(p,loc,now)),[loc,now]);const current=sky.find(p=>p.name===selected.name)||sky[0];const filtered=sky.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
function openSearchResult(item){
 if(!item)return;
 setSearchOpen(false);
 setEntered(true);
 setMenu(false);
 if(item.type==='module'){setTab(item.target);return}
 if(item.type==='planet'){
  const found=PLANETS.find(p=>p.name===item.target);
  if(found){setSelected(found);setSearch('');setTab('Planet Intelligence')}
  return;
 }
 if(item.type==='satellite'){
  setSearchSatelliteId(item.target);
  setTab('Satellite Tracker');
  return;
 }
 if(item.type==='galaxy'){
  setSearchGalaxyId(item.target);
  setTab('Galaxy Observatory');
 }
}
function geo(){if(!navigator.geolocation){setLocationError('Geolocation is unavailable in this browser.');return}navigator.geolocation.getCurrentPosition(pos=>{setLoc({lat:pos.coords.latitude,lon:pos.coords.longitude,label:'Current location • GPS'});setLocationError('')},err=>setLocationError('Location blocked. Using Dhaka as example; change coordinates below.'),{enableHighAccuracy:true,timeout:12000})}
async function startCamera(){try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable: use HTTPS on a compatible mobile browser.');const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});stream.current=s;setCamera(true);setLocationError('');setTimeout(()=>{if(video.current)video.current.srcObject=s},0)}catch(e){setLocationError(e.message)}}
function stopCamera(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false)}
async function orientation(){try{if(typeof DeviceOrientationEvent==='undefined')throw Error('Orientation sensor unavailable.');if(typeof DeviceOrientationEvent.requestPermission==='function'){const ok=await DeviceOrientationEvent.requestPermission();if(ok!=='granted')throw Error('Sensor permission denied.')}window.addEventListener('deviceorientationabsolute',handleOrientation);window.addEventListener('deviceorientation',handleOrientation);setLocationError('')}catch(e){setLocationError(e.message)}}
function handleOrientation(e){const compass=Number.isFinite(e.webkitCompassHeading)?e.webkitCompassHeading:Number.isFinite(e.alpha)?(360-e.alpha)%360:null;setSensor({heading:compass,tilt:Number.isFinite(e.beta)?e.beta:null})}
const nav=[['Dashboard',Globe2],['Command Center',Globe2],['Solar System',Orbit],['Planet Intelligence',Layers3],['Sky Tonight',Clock3],['Satellite Tracker',ScanLine],['Earth Observation',Globe2],['Space Intelligence',Activity],['Observation Planner',CalendarDays],['Satellite Weather',Satellite],['Field Journal',BookOpen],['Observation Analytics',BarChart3],['Sky Tracker',Compass],['AR Scanner',ScanLine],['Galaxy Observatory',Orbit]];const navKey={'Dashboard':'dashboard','Command Center':'command','Solar System':'solar','Planet Intelligence':'intelligence','Sky Tonight':'tonight','Satellite Tracker':'satellite','Earth Observation':'earthObservation','Space Intelligence':'spaceIntelligence','Observation Planner':'observationPlanner','Satellite Weather':'satelliteWeather','Field Journal':'fieldJournal','Observation Analytics':'observationAnalytics','Sky Tracker':'sky','AR Scanner':'ar','Galaxy Observatory':'galaxies'};
return <div className={`app theme-${theme} ${resolvedQuality==='low'?'graphics-eco':''}`} style={{'--galaxy-art':`url("${galaxyBackdrop}")`,'--nebula-art':`url("${fullGalaxyBackdrop}")`,'--halftone-art':`url("${halftoneArtwork}")`}}><div className="noise"/>{searchOpen&&<Suspense fallback={null}><UniversalSearch planets={PLANETS} galaxies={GALAXIES} language={language} onSelect={openSearchResult} onClose={()=>setSearchOpen(false)}/></Suspense>}{!entered&&theme!=='halftone'&&<div className="portal"><div className="portal-stars"/><div className="portal-orbit one"/><div className="portal-orbit two"/><div className="portal-core"><div className="portal-planet"/></div><div className="portal-copy"><span className="eyebrow">AURORA // DEEP SPACE SYSTEMS</span><h1>BEYOND THE <em>HORIZON.</em></h1><p>{t('welcome')}</p><button className="primary enter" onClick={()=>setEntered(true)}>{t('enter')} <ArrowUpRight size={18}/></button><small>MISSION CONTROL • v{packageInfo.version} / ONLINE</small></div></div>}
<header><button className="brand" onClick={()=>setTab('Dashboard')}><span className="brandmark"><Orbit size={23}/></span><span>AURORA <strong>PLANET TRACKER</strong><small>GALACTIC INTELLIGENCE SYSTEM</small></span></button><button className="mobileMenu sidebarMobileToggle" onClick={()=>setMenu(!menu)} aria-label={menu?"Close sidebar":"Open sidebar"} aria-expanded={menu} aria-controls="auroraSidebar">{menu?<X/>:<Menu/>}</button><div className="headerTools"><button type="button" className="globalSearchButton" onClick={()=>setSearchOpen(true)} aria-label={language==='bn'?'মহাকাশ অনুসন্ধান খুলুন':'Open universal space search'} title="Search everything (Ctrl+K)"><Search size={16}/><span className="globalSearchLabel">{language==='bn'?'অনুসন্ধান':'SEARCH'}</span><kbd>Ctrl K</kbd></button><label className="galaxyThemeControl" aria-label="Galaxy appearance"><span>{language==='bn'?'থিম':'THEME'}</span><select aria-label="Galaxy theme" value={theme} onChange={e=>setTheme(e.target.value)}><option value="classic">Classic Cyber</option><option value="cosmic">Deep Galaxy</option><option value="nebula">Full Galaxy Nebula</option><option value="halftone">Halftone · Pink & Gold Text</option></select></label><label className="languageSwitch" aria-label={t('language')}><span>{t('language')}</span><select aria-label={t('language')} value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="bn">বাংলা</option></select></label><PWAStatus/><div className="status"><span className="dot"/> {t('online')}</div></div></header>
<div className={`auroraLayout ${sidebarCollapsed?'auroraLayout--collapsed':''} ${menu?'auroraLayout--mobileOpen':''}`}>
{menu&&<button type="button" className="sidebarBackdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
<Sidebar nav={nav} navKey={navKey} t={t} tab={tab} onSelect={name=>{setTab(name);setMenu(false)}} collapsed={sidebarCollapsed} onCollapse={()=>setSidebarCollapsed(v=>!v)} menu={menu} onClose={()=>setMenu(false)}/>
<main className="auroraMain">{tab!=='Dashboard'&&<div className="topline"><div><span className="eyebrow">MISSION / {tab.toUpperCase()}</span><h2>{tab==='Command Center'?t('explore'):tab==='Earth Observation'?'Earth Observation':t(navKey[tab])}</h2><p>{tab==='AR Scanner'?'Experimental camera-assisted planet direction finder':tab==='Sky Tracker'?'Astronomical positions calculated for your location and current time':tab==='Galaxy Observatory'?'Track deep-sky galaxies across the sky with time-warp and location-aware directions':'Navigate the cosmos through an immersive command interface'}</p></div><div className="timestamp"><Clock3 size={16}/>{now.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})} <span>LIVE</span></div></div>}
{tab==='Dashboard'&&<FeatureBoundary name="Dashboard"><Suspense fallback={<p role="status" className="eyebrow">Loading Dashboard…</p>}><AuroraDashboard onNavigate={name=>setTab(name)} onOpenSearch={()=>setSearchOpen(true)} sky={sky} observer={loc} now={now}/></Suspense></FeatureBoundary>}
{(tab==='Command Center'||tab==='Solar System')&&<div className="scene-layout"><section className="universe"><div className="viewport" ref={sceneViewport}>{showPerf&&<Suspense fallback={null}><PerformanceDiagnostics active={sceneAnimated} quality={resolvedQuality} reducedMotion={reduceMotion} visible={sceneVisible} onClose={()=>setShowPerf(false)}/></Suspense>}<div className="overlaytop"><span className="eyebrow">◉ SOLAR SYSTEM / LIVE EXPLORER</span><span className="coord">NASA/JPL TEXTURE MAPS · ARTISTIC ORBITS</span></div><Suspense fallback={<p className="eyebrow" role="status">Loading Solar System scene…</p>}><SolarScene planets={PLANETS} selected={selected} onSelect={setSelected} paused={!sceneAnimated} active={sceneAnimated} focus={focus} inspection={inspection} speed={speed} quality={resolvedQuality} cosmic={theme==='cosmic'||theme==='nebula'} scaleMode={scaleMode}/></Suspense><div className="scene-options"><label>SCALE <select aria-label="Solar System scale mode" value={scaleMode} onChange={e=>setScaleMode(e.target.value)}><option value="readable">READABLE</option><option value="distance">AU DISTANCE</option></select></label><label>ORBIT SPEED <select aria-label='Orbital animation speed' value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={0.25}>0.25×</option><option value={1}>1×</option><option value={3}>3×</option><option value={8}>8×</option></select></label><button type="button" className="auroraPerfToggle" aria-label="Toggle performance diagnostics" aria-pressed={showPerf} onClick={()=>setShowPerf(v=>!v)}>{showPerf?'CLOSE PERF QA':'PERF QA'}</button><label>GRAPHICS <select aria-label='Graphics quality' value={quality} onChange={e=>setQuality(e.target.value)}><option value='auto'>AUTO ({autoQuality==='low'?'ECO':'HIGH'})</option><option value='high'>HIGH</option><option value='low'>ECO</option></select></label></div><div className="viewport-bottom"><span>DRAG TO ROTATE · SCROLL TO ZOOM · SELECT PLANET</span><div className='scenecontrols'><button onClick={()=>{setInspection(false);setFocus(!focus)}}>{focus?t('free'):t('focus')}</button><button className={inspection?'selectedControl':''} onClick={()=>{setInspection(v=>!v);setFocus(true)}}>{inspection?t('exitInspect'):t('inspect')}</button><button onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>} {paused?t('resume'):t('pause')}</button></div></div></div></section><aside className="planetpanel"><div className="paneltitle"><span className="eyebrow">{t('selected')}</span><span className="lighttag">◉ TRACKING</span></div><div className="planetcircle" style={{'--planet':selected.color}}><span/></div><h3>{selected.name}</h3><span className="classification">{selected.type.toUpperCase()} · SOL SYSTEM</span><p>{selected.description}</p><p className="textureCredit">Planet surfaces: NASA/JPL map collection when installed. Gas giant maps and some images are representative or reconstructed, not live photographs.</p><div className="statgrid"><div><small>{t('distance')}</small><strong>{current.km? (current.km/1e6).toFixed(1)+'M km':'—'}</strong></div><div><small>{t('altitude')}</small><strong>{fmt(current.alt)}°</strong></div><div><small>{t('azimuth')}</small><strong>{fmt(current.az)}°</strong></div><div><small>{t('visibility')}*</small><strong>{current.visible?t('above'):t('below')}</strong></div></div><button className="outline" onClick={()=>setTab('Planet Intelligence')} >{t('details')} <ChevronRight size={17}/></button></aside></div>}
{tab==='Planet Intelligence'&&<div className="intelligence"><section className="glass"><span className="eyebrow">CELESTIAL DATABASE / 8 PLANETS</span><h3>Planet intelligence</h3><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for a planet..." /></div><div className="planetlist">{filtered.map(p=><button key={p.name} className={selected.name===p.name?'chosen':''} onClick={()=>setSelected(p)}><PlanetPortrait planet={p} compact/>{p.name}<span>{p.visible?'ABOVE HORIZON':'BELOW HORIZON'}</span><ChevronRight size={17}/></button>)}</div></section><section className="glass intelligenceDetail"><span className="eyebrow">SELECTED CELESTIAL BODY</span><PlanetPortrait planet={selected}/><h2>{selected.name}</h2><p>{selected.description}</p><div className="statgrid large"><div><small>EARTH DISTANCE</small><strong>{current.km?(current.km/1e6).toFixed(2)+' million km':'—'}</strong></div><div><small>ALTITUDE</small><strong>{fmt(current.alt,2)}°</strong></div><div><small>AZIMUTH / DIRECTION</small><strong>{fmt(current.az,2)}° {current.az!==null?compassName(current.az):''}</strong></div><div><small>ORBITAL PERIOD</small><strong>{selected.period} days</strong></div><div><small>CLASS</small><strong>{selected.type}</strong></div><div><small>MOONS (REFERENCE)</small><strong>{selected.moons}</strong></div></div><p className="disclaimer">Planet surface previews use NASA/JPL maps, some of which are reconstructed or false-color. Saturn, Uranus and Neptune are representative visualizations. Distance and angles are computed estimates; visual sizes are not to scale.</p></section></div>}
{tab==='Observation Analytics'&&<FeatureBoundary name="Observation Analytics"><Suspense fallback={<p role="status" className="eyebrow">Loading Observation Analytics…</p>}><ObservationAnalytics now={now} onNavigate={setTab}/></Suspense></FeatureBoundary>}
{tab==='Field Journal'&&<FeatureBoundary name="Field Journal"><Suspense fallback={<p role="status" className="eyebrow">Loading Field Journal…</p>}><FieldJournal location={loc} now={now} initialTarget={journalPrefill} onPrefillConsumed={()=>setJournalPrefill(null)} onNavigate={setTab} onPlanet={name=>{const found=PLANETS.find(p=>p.name===name);if(found){setSelected(found);setSearch('');setTab('Planet Intelligence')}}} onGalaxy={id=>{setSearchGalaxyId(id);setTab('Galaxy Observatory')}} onSatellite={id=>{setSearchSatelliteId(id);setTab('Satellite Tracker')}}/></Suspense></FeatureBoundary>}
{tab==='Satellite Weather'&&<FeatureBoundary name="Satellite Weather"><Suspense fallback={<p role="status" className="eyebrow">Loading Satellite Weather…</p>}><SatelliteWeatherPlanner location={loc} now={now} onLogPass={(satellite,pass)=>{setJournalPrefill({targetKey:'satellite:'+satellite.id,targetName:satellite.name,scheduledMs:pass.start.getTime()});setTab('Field Journal')}} onSky={()=>setTab('Sky Tonight')} onSatellite={id=>{setSearchSatelliteId(id);setTab('Satellite Tracker')}}/></Suspense></FeatureBoundary>}
{tab==='Observation Planner'&&<FeatureBoundary name="Observation Planner"><Suspense fallback={<p role="status" className="eyebrow">Loading Observation Planner…</p>}><ObservationPlanner location={loc} now={now} onLogTarget={item=>{setJournalPrefill({targetKey:item.id,targetName:item.name,scheduledMs:item.next.startMs});setTab('Field Journal')}} onNavigate={setTab} onPlanet={name=>{const found=PLANETS.find(p=>p.name===name);if(found){setSelected(found);setSearch('');setTab('Planet Intelligence')}}} onGalaxy={id=>{setSearchGalaxyId(id);setTab('Galaxy Observatory')}}/></Suspense></FeatureBoundary>}
{tab==='Space Intelligence'&&<FeatureBoundary name="Space Intelligence"><Suspense fallback={<p role="status" className="eyebrow">Loading Space Intelligence…</p>}><SpaceIntelligence location={loc} now={now} onNavigate={setTab} onSatellite={id=>{setSearchSatelliteId(id);setTab('Satellite Tracker')}} onGalaxy={id=>{setSearchGalaxyId(id);setTab('Galaxy Observatory')}}/></Suspense></FeatureBoundary>}
{tab==='Earth Observation'&&<FeatureBoundary name="Earth Observation"><Suspense fallback={<p role="status" className="eyebrow">Loading Earth Observation…</p>}><EarthObservation initialEco={resolvedQuality==='low'} foreground={pageVisible}/></Suspense></FeatureBoundary>}
{tab==='Satellite Tracker'&&<FeatureBoundary name="Satellite Tracker"><Suspense fallback={<p className="eyebrow" role="status">Loading Satellite Tracker…</p>}><SatelliteTracker alert={passAlert} initialSatelliteId={searchSatelliteId} location={loc} onLocation={setLoc} onOpenSky={()=>setTab('Sky Tonight')}/></Suspense></FeatureBoundary>}
{tab==='Sky Tonight'&&<FeatureBoundary name="Sky Tonight"><Suspense fallback={<p className="eyebrow" role="status">Loading Sky Tonight…</p>}><SkyTonight location={loc} onLocation={setLoc} onOpenSky={()=>setTab('Sky Tracker')} passAlert={passAlert}/></Suspense></FeatureBoundary>}
{tab==='Galaxy Observatory'&&<FeatureBoundary name="Galaxy Observatory"><Suspense fallback={<p className="eyebrow" role="status">Loading Galaxy Observatory…</p>}><GalaxyObservatory location={loc} onLocation={setLoc} initialGalaxyId={searchGalaxyId}/></Suspense></FeatureBoundary>}
{tab==='Sky Tracker'&&<><div className="skyLocationBar"><span><MapPin size={16}/> {loc.label}</span><button onClick={geo}><LocateFixed size={16}/> USE MY GPS</button><label>LAT <input aria-label="Sky map latitude" type="number" min="-90" max="90" step=".0001" value={loc.lat} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=-90&&v<=90)setLoc({...loc,lat:v,label:'Manual observer coordinates'})}}/></label><label>LON <input aria-label="Sky map longitude" type="number" min="-180" max="180" step=".0001" value={loc.lon} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=-180&&v<=180)setLoc({...loc,lon:v,label:'Manual observer coordinates'})}}/></label></div>{locationError&&<p className="error" role="alert">{locationError}</p>}<FeatureBoundary name="Sky Tracker"><Suspense fallback={<p className="eyebrow" role="status">Loading Sky Tracker…</p>}><SkyMap planets={PLANETS} location={loc} selected={selected} onSelect={setSelected} onOpenDetails={()=>setTab('Planet Intelligence')}/></Suspense></FeatureBoundary></>}
{tab==='AR Scanner'&&<FeatureBoundary name="AR Scanner"><Suspense fallback={<p className="eyebrow" role="status">Loading AR Scanner…</p>}><ARScanner planets={PLANETS} location={loc} onLocation={setLoc} selected={selected} onSelect={setSelected}/></Suspense></FeatureBoundary>}
<div className="footerline"><span>◈ AURORA DEEP SPACE • RELEASE {packageInfo.version}</span><span>ASTRONOMICAL DATA: ASTRONOMY ENGINE · OBSERVER-DEPENDENT</span><span>BUILT FOR EXPLORATION</span></div></main>{passAlert.armed&&(passAlert.withinCountdown||passAlert.activePass)&&tab!=='Sky Tonight'&&tab!=='Satellite Tracker'&&<SatellitePassAlert compact alert={passAlert} onShowSky={()=>setTab('Sky Tonight')}/>}</div></div>}
export default App;