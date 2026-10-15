import React,{useEffect,useMemo,useRef,useState} from 'react';
import packageInfo from '../package.json';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Stars,Text} from '@react-three/drei';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import * as Astronomy from 'astronomy-engine';
import SkyMap from './SkyMap.jsx';
import ARScanner from './ARScanner.jsx';
import GalaxyObservatory from './GalaxyObservatory.jsx';
import Sidebar from './Sidebar.jsx';
import PlanetPortrait from './PlanetPortrait.jsx';
import {AtmosphereGlow,EarthMoon,AsteroidBelt,SunCorona} from './SolarEnhancements.jsx';
import {EarthEffects,SaturnDetailedRings,SolarBloom} from './SolarRealism.jsx';
import {AXIAL_TILT,solarOrbitRadius,solarPlanetRadius,spinRate} from './solarPhysics.mjs';
import PWAStatus from './PWAStatus.jsx';
import galaxyBackdrop from './assets/deep-galaxy.svg';
import fullGalaxyBackdrop from './assets/full-galaxy.svg';
import {useLanguage} from './i18n.jsx';
import {Orbit,Compass,MapPin,Search,Clock3,ScanLine,Globe2,Layers3,Info,ArrowUpRight,LocateFixed,ChevronRight,Menu,X,Pause,Play,Volume2,VolumeX,Maximize2,Satellite,Eye} from 'lucide-react';

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
function computePlanet(p,loc,date){try{const obs=new Astronomy.Observer(loc.lat,loc.lon,0);const eq=Astronomy.Equator(p.name,date,obs,true,true);const hor=Astronomy.Horizon(date,obs,eq.ra,eq.dec,'normal');return {...p,alt:hor.altitude,az:hor.azimuth,km:eq.dist*AU,visible:hor.altitude>0}}catch{return {...p,alt:null,az:null,km:null,visible:false}}}

function planetTexture(planet){
 const w=256,h=128,data=new Uint8Array(w*h*4),base=new THREE.Color(planet.color);
 const seed=planet.name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
 const gas=['Jupiter','Saturn','Uranus','Neptune','Venus'].includes(planet.name);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const latitude=y/h*Math.PI,longitude=x/w*Math.PI*2;
  const wave=Math.sin(y*(gas?.29:.52)+Math.sin(x*.11+seed)*2.6);
  const swirl=Math.sin(y*(gas?.83:.34)+Math.cos(x*.09+seed)*4);
  const strata=gas?.74+.16*wave+.09*swirl:.74+.17*Math.sin(x*.22+y*.31)+.13*Math.cos(x*.08-y*.24);
  const craters=gas?0:.18*Math.sin(x*.85+y*.42)*Math.cos(y*.9-x*.31);
  const polar=planet.name==='Earth'?Math.pow(Math.abs(Math.cos(latitude)),18)*.5:0;
  const cloud=planet.name==='Earth'?.17*Math.sin(longitude*14+Math.sin(latitude*11)*3):0;
  const band=THREE.MathUtils.clamp(strata+craters+polar+cloud,.28,1.35);
  const at=(y*w+x)*4;
  data[at]=Math.min(255,Math.round(base.r*255*band));
  data[at+1]=Math.min(255,Math.round(base.g*255*band));
  data[at+2]=Math.min(255,Math.round(base.b*255*band));
  data[at+3]=255;
 }
 const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.needsUpdate=true;return texture;
}
function PlanetMesh({planet,index,selected,onSelect,speed,onTrack,scaleMode,quality}){
 const mesh=useRef(),pivot=useRef(),group=useRef();
 const orbitRadius=solarOrbitRadius(planet.name,scaleMode,planet.orbit);
 const radius=solarPlanetRadius(planet.name,scaleMode,planet.size);
 const procedural=useMemo(()=>planetTexture(planet),[planet]);
 const [photomap,setPhotomap]=useState(null);
 useEffect(()=>{
  let active=true;const loader=new THREE.TextureLoader();
  const url=import.meta.env.BASE_URL+'planet-textures/'+planet.name.toLowerCase()+'.jpg';
  loader.load(url,map=>{
   if(!active){map.dispose();return;}
   map.colorSpace=THREE.SRGBColorSpace;
   map.anisotropy=4;
   setPhotomap(previous=>{previous?.dispose();return map});
  },undefined,()=>{if(active)setPhotomap(null)});
  return()=>{active=false};
 },[planet.name]);
 useEffect(()=>()=>procedural.dispose(),[procedural]);
 useEffect(()=>()=>photomap?.dispose(),[photomap]);
 useFrame((state,dt)=>{
  if(pivot.current)pivot.current.rotation.y+=dt*speed*(.035+2/(index+2));
  if(mesh.current)mesh.current.rotation.y+=dt*spinRate(planet.name)*speed;
  if(group.current&&selected?.name===planet.name){const v=new THREE.Vector3();group.current.getWorldPosition(v);onTrack.current=v;}
 });
 return <group ref={pivot}>
 <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[orbitRadius,orbitRadius+.014,192]}/><meshBasicMaterial color={selected?.name===planet.name?'#5fdcf9':'#517291'} transparent opacity={selected?.name===planet.name?.33:.16} side={THREE.DoubleSide}/></mesh>
 <group ref={group} position={[orbitRadius,0,0]}>
 <group rotation={[0,0,AXIAL_TILT[planet.name]*Math.PI/180]}><mesh ref={mesh} castShadow receiveShadow onClick={e=>{e.stopPropagation();onSelect(planet)}}>
 <sphereGeometry args={[radius,64,48]}/><meshStandardMaterial map={photomap||procedural} roughness={.96} metalness={0} color="#ffffff"/></mesh></group>
 {['Earth','Venus','Mars','Uranus','Neptune'].includes(planet.name)&&<AtmosphereGlow radius={radius} color={{Earth:'#3988ff',Venus:'#ffb76c',Mars:'#d36c49',Uranus:'#80eddf',Neptune:'#427bff'}[planet.name]} strength={planet.name==='Earth'?.8:.48}/>}
 {planet.name==='Earth'&&<><EarthMoon radius={radius} speed={speed}/><EarthEffects radius={radius} quality={quality} speed={speed}/></>} 
 {planet.name==='Saturn'&&<SaturnDetailedRings radius={radius} quality={quality}/>}
 {planet.name==='Uranus'&&<mesh rotation={[-Math.PI/2,0.3]}><ringGeometry args={[radius*1.43,radius*1.48,100]}/><meshBasicMaterial color="#8bcbd1" side={THREE.DoubleSide} transparent opacity={.39}/></mesh>}
 {selected?.name===planet.name&&<mesh><sphereGeometry args={[radius*1.19,36,24]}/><meshBasicMaterial color="#52dffc" transparent opacity={.07} wireframe depthWrite={false}/></mesh>}
 <Text position={[0,radius+0.58,0]} fontSize={.34} color={selected?.name===planet.name?'#94f4ff':'#8098b6'} anchorX="center">{planet.name.toUpperCase()}</Text>
 </group></group>
}
function CameraFocus({tracked,focusEnabled,inspection,selected}){
 const {camera,controls}=useThree();
 const last=useRef(null);
 useFrame((state,dt)=>{
  if(!focusEnabled||!tracked.current||!controls)return;
  const desired=tracked.current;
  if(!last.current){last.current=controls.target.clone()}
  const delta=desired.clone().sub(controls.target);
  const rate=1-Math.exp(-dt*2.3);
  camera.position.addScaledVector(delta,rate);
  controls.target.lerp(desired,rate);
  if(inspection){const direction=camera.position.clone().sub(controls.target).normalize();const goal=desired.clone().addScaledVector(direction,Math.max(3.3,selected.size*4.2));camera.position.lerp(goal,1-Math.exp(-dt*1.2));}
  controls.update();
 });
 return null;
}
function NebulaDust({quality}){
 const points=useMemo(()=>{const count=quality==='low'?360:1400;const positions=new Float32Array(count*3);for(let i=0;i<count;i++){const r=25+Math.random()*57,angle=Math.random()*Math.PI*2;positions[i*3]=Math.cos(angle)*r;positions[i*3+1]=(Math.random()-.5)*34;positions[i*3+2]=Math.sin(angle)*r;}return positions;},[quality]);
 return <points><bufferGeometry><bufferAttribute attach='attributes-position' args={[points,3]}/></bufferGeometry><pointsMaterial color='#6a65d7' size={quality==='low'?.12:.2} transparent opacity={.34} sizeAttenuation depthWrite={false}/></points>;
}
function Galaxy({selected,onSelect,paused,focus,inspection,speed,quality,cosmic,scaleMode}){
 const tracked=useRef(null);
 return <Canvas shadows={quality!=='low'} camera={{position:[0,22,31],fov:50}} gl={{antialias:true,alpha:true}} dpr={quality==='low'?[1,1]:[1,1.6]}>
 {!cosmic&&<color attach="background" args={['#050915']}/>}<fog attach="fog" args={[cosmic?'#0a1230':'#07112c',cosmic?54:30,cosmic?160:100]}/>
 <ambientLight intensity={cosmic?.2:.16}/><hemisphereLight args={['#4b84ff','#170d20',cosmic?.22:.16]}/>
 <pointLight position={[0,0,0]} color="#fff0d3" intensity={165} distance={100} castShadow={quality!=='low'} shadow-mapSize={[1024,1024]} shadow-bias={-.0002}/>
 <Stars radius={160} depth={100} count={quality==='low'?1300:4300} factor={5} saturation={.25} fade speed={paused?0:.35}/><NebulaDust quality={quality}/>
 <SunCorona quality={quality}/><AsteroidBelt radius={scaleMode==='distance'?7.42:8.6} quality={quality} speed={paused?0:speed}/>
 {PLANETS.map((p,i)=><PlanetMesh key={p.name} planet={p} index={i} selected={selected} onSelect={onSelect} speed={paused?0:speed} onTrack={tracked} scaleMode={scaleMode} quality={quality}/>)}
 <SolarBloom quality={quality}/>
 <OrbitControls makeDefault enableDamping dampingFactor={.055} minDistance={7} maxDistance={scaleMode==='distance'?115:72} maxPolarAngle={Math.PI*.82}/>
 <CameraFocus tracked={tracked} focusEnabled={focus||inspection} inspection={inspection} selected={selected}/>
 </Canvas>
}
function App(){const {language,setLanguage,t}=useLanguage();const [theme,setTheme]=useState(()=>{try{return ['classic','cosmic','nebula'].includes(localStorage.getItem('aurora-galaxy-theme'))?localStorage.getItem('aurora-galaxy-theme'):'classic'}catch{return 'classic'}}),[entered,setEntered]=useState(false),[tab,setTab]=useState('Command Center'),[selected,setSelected]=useState(PLANETS[4]),[loc,setLoc]=useState({lat:23.8103,lon:90.4125,label:'Dhaka • manual default'}),[now,setNow]=useState(new Date()),[paused,setPaused]=useState(false),[focus,setFocus]=useState(false),[inspection,setInspection]=useState(false),[speed,setSpeed]=useState(1),[quality,setQuality]=useState('high'),[scaleMode,setScaleMode]=useState('readable'),[search,setSearch]=useState(''),[menu,setMenu]=useState(false),[sidebarCollapsed,setSidebarCollapsed]=useState(()=>{try{return localStorage.getItem('aurora-sidebar-collapsed')==='true'}catch{return false}}),[locationError,setLocationError]=useState(''),[sensor,setSensor]=useState(null),[camera,setCamera]=useState(false);const video=useRef(null),stream=useRef(null);
useEffect(()=>{const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id)},[]);
useEffect(()=>{try{localStorage.setItem('aurora-galaxy-theme',theme)}catch{}},[theme]);
useEffect(()=>{try{localStorage.setItem('aurora-sidebar-collapsed',String(sidebarCollapsed))}catch{}},[sidebarCollapsed]);
useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[]);
const sky=useMemo(()=>PLANETS.map(p=>computePlanet(p,loc,now)),[loc,now]);const current=sky.find(p=>p.name===selected.name)||sky[0];const filtered=sky.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
function geo(){if(!navigator.geolocation){setLocationError('Geolocation is unavailable in this browser.');return}navigator.geolocation.getCurrentPosition(pos=>{setLoc({lat:pos.coords.latitude,lon:pos.coords.longitude,label:'Current location • GPS'});setLocationError('')},err=>setLocationError('Location blocked. Using Dhaka as example; change coordinates below.'),{enableHighAccuracy:true,timeout:12000})}
async function startCamera(){try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera unavailable: use HTTPS on a compatible mobile browser.');const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});stream.current=s;setCamera(true);setLocationError('');setTimeout(()=>{if(video.current)video.current.srcObject=s},0)}catch(e){setLocationError(e.message)}}
function stopCamera(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false)}
async function orientation(){try{if(typeof DeviceOrientationEvent==='undefined')throw Error('Orientation sensor unavailable.');if(typeof DeviceOrientationEvent.requestPermission==='function'){const ok=await DeviceOrientationEvent.requestPermission();if(ok!=='granted')throw Error('Sensor permission denied.')}window.addEventListener('deviceorientationabsolute',handleOrientation);window.addEventListener('deviceorientation',handleOrientation);setLocationError('')}catch(e){setLocationError(e.message)}}
function handleOrientation(e){const compass=Number.isFinite(e.webkitCompassHeading)?e.webkitCompassHeading:Number.isFinite(e.alpha)?(360-e.alpha)%360:null;setSensor({heading:compass,tilt:Number.isFinite(e.beta)?e.beta:null})}
const nav=[['Command Center',Globe2],['Solar System',Orbit],['Planet Intelligence',Layers3],['Sky Tracker',Compass],['AR Scanner',ScanLine],['Galaxy Observatory',Orbit]];const navKey={'Command Center':'dashboard','Solar System':'solar','Planet Intelligence':'intelligence','Sky Tracker':'sky','AR Scanner':'ar','Galaxy Observatory':'galaxies'};
return <div className={`app theme-${theme}`} style={{'--galaxy-art':`url("${galaxyBackdrop}")`,'--nebula-art':`url("${fullGalaxyBackdrop}")`}}><div className="noise"/>{!entered&&<div className="portal"><div className="portal-stars"/><div className="portal-orbit one"/><div className="portal-orbit two"/><div className="portal-core"><div className="portal-planet"/></div><div className="portal-copy"><span className="eyebrow">AURORA // DEEP SPACE SYSTEMS</span><h1>BEYOND THE <em>HORIZON.</em></h1><p>{t('welcome')}</p><button className="primary enter" onClick={()=>setEntered(true)}>{t('enter')} <ArrowUpRight size={18}/></button><small>MISSION CONTROL • v{packageInfo.version} / ONLINE</small></div></div>}
<header><button className="brand" onClick={()=>setTab('Command Center')}><span className="brandmark"><Orbit size={23}/></span><span>AURORA <strong>PLANET TRACKER</strong><small>GALACTIC INTELLIGENCE SYSTEM</small></span></button><button className="mobileMenu sidebarMobileToggle" onClick={()=>setMenu(!menu)} aria-label={menu?"Close sidebar":"Open sidebar"} aria-expanded={menu} aria-controls="auroraSidebar">{menu?<X/>:<Menu/>}</button><div className="headerTools"><label className="galaxyThemeControl" aria-label="Galaxy appearance"><span>{language==='bn'?'থিম':'THEME'}</span><select aria-label="Galaxy theme" value={theme} onChange={e=>setTheme(e.target.value)}><option value="classic">Classic Cyber</option><option value="cosmic">Deep Galaxy</option><option value="nebula">Full Galaxy Nebula</option></select></label><label className="languageSwitch" aria-label={t('language')}><span>{t('language')}</span><select aria-label={t('language')} value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="bn">বাংলা</option></select></label><PWAStatus/><div className="status"><span className="dot"/> {t('online')}</div></div></header>
<div className={`auroraLayout ${sidebarCollapsed?'auroraLayout--collapsed':''} ${menu?'auroraLayout--mobileOpen':''}`}>
{menu&&<button type="button" className="sidebarBackdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
<Sidebar nav={nav} navKey={navKey} t={t} tab={tab} onSelect={name=>{setTab(name);setMenu(false)}} collapsed={sidebarCollapsed} onCollapse={()=>setSidebarCollapsed(v=>!v)} menu={menu} onClose={()=>setMenu(false)}/>
<main className="auroraMain"><div className="topline"><div><span className="eyebrow">MISSION / {tab.toUpperCase()}</span><h2>{tab==='Command Center'?t('explore'):t(navKey[tab])}</h2><p>{tab==='AR Scanner'?'Experimental camera-assisted planet direction finder':tab==='Sky Tracker'?'Astronomical positions calculated for your location and current time':tab==='Galaxy Observatory'?'Track deep-sky galaxies across the sky with time-warp and location-aware directions':'Navigate the cosmos through an immersive command interface'}</p></div><div className="timestamp"><Clock3 size={16}/>{now.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})} <span>LIVE</span></div></div>
{(tab==='Command Center'||tab==='Solar System')&&<div className="scene-layout"><section className="universe"><div className="viewport"><div className="overlaytop"><span className="eyebrow">◉ SOLAR SYSTEM / LIVE EXPLORER</span><span className="coord">NASA/JPL TEXTURE MAPS · ARTISTIC ORBITS</span></div><Galaxy selected={selected} onSelect={setSelected} paused={paused} focus={focus} inspection={inspection} speed={speed} quality={quality} cosmic={theme!=='classic'} scaleMode={scaleMode}/><div className="scene-options"><label>SCALE <select aria-label="Solar System scale mode" value={scaleMode} onChange={e=>setScaleMode(e.target.value)}><option value="readable">READABLE</option><option value="distance">AU DISTANCE</option></select></label><label>ORBIT SPEED <select aria-label='Orbital animation speed' value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={0.25}>0.25×</option><option value={1}>1×</option><option value={3}>3×</option><option value={8}>8×</option></select></label><label>GRAPHICS <select aria-label='Graphics quality' value={quality} onChange={e=>setQuality(e.target.value)}><option value='high'>HIGH</option><option value='low'>ECO</option></select></label></div><div className="viewport-bottom"><span>DRAG TO ROTATE · SCROLL TO ZOOM · SELECT PLANET</span><div className='scenecontrols'><button onClick={()=>{setInspection(false);setFocus(!focus)}}>{focus?t('free'):t('focus')}</button><button className={inspection?'selectedControl':''} onClick={()=>{setInspection(v=>!v);setFocus(true)}}>{inspection?t('exitInspect'):t('inspect')}</button><button onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>} {paused?t('resume'):t('pause')}</button></div></div></div></section><aside className="planetpanel"><div className="paneltitle"><span className="eyebrow">{t('selected')}</span><span className="lighttag">◉ TRACKING</span></div><div className="planetcircle" style={{'--planet':selected.color}}><span/></div><h3>{selected.name}</h3><span className="classification">{selected.type.toUpperCase()} · SOL SYSTEM</span><p>{selected.description}</p><p className="textureCredit">Planet surfaces: NASA/JPL map collection when installed. Gas giant maps and some images are representative or reconstructed, not live photographs.</p><div className="statgrid"><div><small>{t('distance')}</small><strong>{current.km? (current.km/1e6).toFixed(1)+'M km':'—'}</strong></div><div><small>{t('altitude')}</small><strong>{fmt(current.alt)}°</strong></div><div><small>{t('azimuth')}</small><strong>{fmt(current.az)}°</strong></div><div><small>{t('visibility')}*</small><strong>{current.visible?t('above'):t('below')}</strong></div></div><button className="outline" onClick={()=>setTab('Planet Intelligence')} >{t('details')} <ChevronRight size={17}/></button></aside></div>}
{tab==='Planet Intelligence'&&<div className="intelligence"><section className="glass"><span className="eyebrow">CELESTIAL DATABASE / 8 PLANETS</span><h3>Planet intelligence</h3><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for a planet..." /></div><div className="planetlist">{filtered.map(p=><button key={p.name} className={selected.name===p.name?'chosen':''} onClick={()=>setSelected(p)}><PlanetPortrait planet={p} compact/>{p.name}<span>{p.visible?'ABOVE HORIZON':'BELOW HORIZON'}</span><ChevronRight size={17}/></button>)}</div></section><section className="glass intelligenceDetail"><span className="eyebrow">SELECTED CELESTIAL BODY</span><PlanetPortrait planet={selected}/><h2>{selected.name}</h2><p>{selected.description}</p><div className="statgrid large"><div><small>EARTH DISTANCE</small><strong>{current.km?(current.km/1e6).toFixed(2)+' million km':'—'}</strong></div><div><small>ALTITUDE</small><strong>{fmt(current.alt,2)}°</strong></div><div><small>AZIMUTH / DIRECTION</small><strong>{fmt(current.az,2)}° {current.az!==null?compassName(current.az):''}</strong></div><div><small>ORBITAL PERIOD</small><strong>{selected.period} days</strong></div><div><small>CLASS</small><strong>{selected.type}</strong></div><div><small>MOONS (REFERENCE)</small><strong>{selected.moons}</strong></div></div><p className="disclaimer">Planet surface previews use NASA/JPL maps, some of which are reconstructed or false-color. Saturn, Uranus and Neptune are representative visualizations. Distance and angles are computed estimates; visual sizes are not to scale.</p></section></div>}
{tab==='Galaxy Observatory'&&<GalaxyObservatory location={loc} onLocation={setLoc}/>}
{tab==='Sky Tracker'&&<><div className="skyLocationBar"><span><MapPin size={16}/> {loc.label}</span><button onClick={geo}><LocateFixed size={16}/> USE MY GPS</button><label>LAT <input aria-label="Sky map latitude" type="number" min="-90" max="90" step=".0001" value={loc.lat} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=-90&&v<=90)setLoc({...loc,lat:v,label:'Manual observer coordinates'})}}/></label><label>LON <input aria-label="Sky map longitude" type="number" min="-180" max="180" step=".0001" value={loc.lon} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=-180&&v<=180)setLoc({...loc,lon:v,label:'Manual observer coordinates'})}}/></label></div>{locationError&&<p className="error" role="alert">{locationError}</p>}<SkyMap planets={PLANETS} location={loc} selected={selected} onSelect={setSelected} onOpenDetails={()=>setTab('Planet Intelligence')}/></>}
{tab==='AR Scanner'&&<ARScanner planets={PLANETS} location={loc} onLocation={setLoc} selected={selected} onSelect={setSelected}/>}
<div className="footerline"><span>◈ AURORA DEEP SPACE • RELEASE {packageInfo.version}</span><span>ASTRONOMICAL DATA: ASTRONOMY ENGINE · OBSERVER-DEPENDENT</span><span>BUILT FOR EXPLORATION</span></div></main></div></div>}
export default App;