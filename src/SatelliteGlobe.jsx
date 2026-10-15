import React,{Suspense,useMemo,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Stars} from '@react-three/drei';
import * as THREE from 'three';
import {EARTH_MODEL_RADIUS,orbitalSamples,satelliteTelemetry,segmentGroundTrack} from './satelliteOrbit.mjs';
import {Globe2,RotateCcw,Satellite,Map as MapIcon} from 'lucide-react';
import './SatelliteGlobe.css';

const EARTH_TEXTURE=import.meta.env.BASE_URL+'planet-textures/earth.jpg';
function Earth(){
 const [texture]=useState(()=>{const t=new THREE.TextureLoader().load(EARTH_TEXTURE,undefined,undefined,()=>{});t.colorSpace=THREE.SRGBColorSpace;return t});
 return <group><mesh rotation={[0,0,0]} receiveShadow>
  <sphereGeometry args={[EARTH_MODEL_RADIUS,64,48]}/>
  <meshStandardMaterial map={texture} color="#e0efff" roughness={.96} metalness={0}/>
 </mesh>
 <mesh><sphereGeometry args={[EARTH_MODEL_RADIUS*1.023,48,32]}/><meshBasicMaterial color="#4e9fff" transparent opacity={.055} depthWrite={false} side={THREE.BackSide}/></mesh>
 </group>;
}
function SatelliteMarker({position}){
 const ref=React.useRef(null);
 useFrame(({clock})=>{if(ref.current)ref.current.scale.setScalar(1+.18*Math.sin(clock.elapsedTime*3))});
 return <group position={position}>
  <mesh ref={ref}><octahedronGeometry args={[.088,0]}/><meshBasicMaterial color="#8df9ff" toneMapped={false}/></mesh>
  <mesh><sphereGeometry args={[.16,12,8]}/><meshBasicMaterial color="#49e5ff" transparent opacity={.2} depthWrite={false}/></mesh>
  <pointLight color="#5cdeff" intensity={2.3} distance={1.4}/>
 </group>;
}
function OrbitTrail({samples}){
 const points=useMemo(()=>samples.map(p=>new THREE.Vector3(...p.point)),[samples]);
 const geometry=useMemo(()=>{if(points.length<2)return null;return new THREE.BufferGeometry().setFromPoints(points)},[points]);
 React.useEffect(()=>()=>geometry?.dispose(),[geometry]);
 if(!geometry)return null;
 return <line geometry={geometry}><lineBasicMaterial color="#6ce6ff" transparent opacity={.74} depthWrite={false}/></line>;
}
class GlobeErrorBoundary extends React.Component {
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error){console.warn('ISS 3D canvas could not initialize; showing ground track instead',error)}
 render(){return this.state.error?<div className="satGlobeEmpty" role="status"><strong>3D globe unavailable</strong><span>The browser could not start WebGL. The ISS ground track is still available.</span><button type="button" onClick={this.props.onMap}>OPEN GROUND TRACK</button></div>:this.props.children}
}
function GlobeScene({telemetry,samples,lowQuality}){
 return <Canvas shadows={false} dpr={[1,lowQuality?1:1.65]} camera={{position:[0,2.2,7.7],fov:43}} gl={{antialias:!lowQuality,alpha:true,powerPreference:'low-power'}}>
  <color attach="background" args={['#050d23']}/>
  <ambientLight intensity={1.0}/>
  <directionalLight position={[7,4,7]} intensity={2.2}/>
  {!lowQuality&&<Stars radius={45} depth={20} count={1300} factor={2} saturation={0} fade speed={0.1}/>}
  <Suspense fallback={null}><Earth/></Suspense>
  <OrbitTrail samples={samples}/>
  {telemetry&&<SatelliteMarker position={telemetry.point}/>}
  <OrbitControls enablePan={false} minDistance={4.5} maxDistance={14} enableDamping dampingFactor={.08} autoRotate={false}/>
 </Canvas>;
}
const format=(number,d=2)=>Number.isFinite(number)?number.toFixed(d):'—';
export default function SatelliteGlobe({satrec,now,loading=false,error='',onRefresh,satelliteName='ISS',noradId=25544}){
 const [mode,setMode]=useState('3d');
 const [quality,setQuality]=useState('balanced');
 const [offset,setOffset]=useState(0);
 const epoch=useMemo(()=>new Date(now+offset*60000),[now,offset]);
 const telemetry=useMemo(()=>satelliteTelemetry(satrec,epoch),[satrec,epoch]);
 const trackMinute=Math.floor(epoch.getTime()/60000);
 const samples=useMemo(()=>orbitalSamples(satrec,trackMinute*60000,100,quality==='eco'?120:60),[satrec,trackMinute,quality]);
 const groundSegments=useMemo(()=>segmentGroundTrack(samples),[samples]);
 return <section className="satGlobe" aria-label="Calculated satellite Earth orbit">
  <div className="satGlobeHeader"><div><span className="eyebrow">AURORA / ORBITAL COMMAND</span><h4><Globe2 size={21}/> Interactive Earth Orbit</h4><p>Calculated orbital position from recent satellite elements; not a live GPS broadcast.</p></div><div className="satGlobeTabs"><button className={mode==='3d'?'active':''} onClick={()=>setMode('3d')}>3D GLOBE</button><button className={mode==='map'?'active':''} onClick={()=>setMode('map')}><MapIcon size={13}/> GROUND TRACK</button></div></div>
  <div className="satGlobeControls">
   <label>TIME WARP <strong>{offset>0?'+':''}{offset} min</strong><input aria-label="Satellite orbit time warp minutes" type="range" min="-90" max="90" step="5" value={offset} onChange={e=>setOffset(Number(e.target.value))}/></label>
   <button onClick={()=>setOffset(0)}><RotateCcw size={15}/> NOW</button>
   <label>GRAPHICS <select aria-label="Satellite globe graphics quality" value={quality} onChange={e=>setQuality(e.target.value)}><option value="balanced">BALANCED</option><option value="eco">ECO MOBILE</option></select></label>
  </div>
  <div className="satGlobeViewport">
   {!satrec?<div className="satGlobeEmpty"><Satellite size={39}/><strong>{loading?'Retrieving satellite orbital elements…':'Orbital data unavailable'}</strong><span>{error||'Waiting for fresh orbital elements. No substitute satellite coordinates are fabricated.'}</span>{onRefresh&&<button type="button" className="satOrbitRetry" onClick={onRefresh} disabled={loading}>{loading?'LOADING…':'RETRY ORBIT DATA'}</button>}</div>:
    mode==='3d'?<GlobeErrorBoundary onMap={()=>setMode('map')}><GlobeScene telemetry={telemetry} samples={samples} lowQuality={quality==='eco'}/></GlobeErrorBoundary>:
    <svg className="satGroundMap" viewBox="0 0 800 410" role="img" aria-label="ISS latitude longitude ground track. Map is simplified geographic coordinate grid.">
     <rect width="800" height="410" fill="#081a32"/>
     {Array.from({length:13},(_,i)=><line key={'lon'+i} x1={i*800/12} x2={i*800/12} y1="0" y2="410" stroke="#22506b" strokeDasharray="4 6"/>)}
     {Array.from({length:7},(_,i)=><line key={'lat'+i} y1={i*410/6} y2={i*410/6} x1="0" x2="800" stroke="#22506b" strokeDasharray="4 6"/>)}
     {groundSegments.map((segment,i)=><polyline key={i} points={segment.map(p=>((p.longitude+180)/360*800)+','+((90-p.latitude)/180*410)).join(' ')} fill="none" stroke="#69dbff" strokeWidth="2.5"/>)}
     {telemetry&&<><circle cx={(telemetry.longitude+180)/360*800} cy={(90-telemetry.latitude)/180*410} r="7" fill="#8dfaff" stroke="#ffffff" strokeWidth="2"/><text x={(telemetry.longitude+180)/360*800+12} y={(90-telemetry.latitude)/180*410-10} fill="#d7ffff" fontSize="15" fontWeight="bold">{satelliteName}</text></>}
     <text x="14" y="22" fill="#8fc8e0" fontSize="14">90°N</text><text x="14" y="397" fill="#8fc8e0" fontSize="14">90°S</text><text x="736" y="397" fill="#8fc8e0" fontSize="12">180°E</text>
    </svg>}
   <div className="satGlobeCorner">{satelliteName} • NORAD {noradId} · {offset===0?'CALCULATED NOW':'SIMULATED TIME OFFSET'}</div>
  </div>
  <div className="satTelemetry">
   {[
    ['LATITUDE',telemetry?format(telemetry.latitude,3)+'°':'—'],
    ['LONGITUDE',telemetry?format(telemetry.longitude,3)+'°':'—'],
    ['ALTITUDE',telemetry?format(telemetry.altitudeKm,1)+' km':'—'],
    ['VELOCITY',telemetry?format(telemetry.speedKmS,2)+' km/s':'—'],
    ['ORBIT PERIOD',telemetry?format(telemetry.orbitalPeriodMin,1)+' min':'—'],
    ['DATA TIME',epoch.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'})]
   ].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}
  </div>
  <p className="satGlobeFoot">Interactive globe uses NASA/JPL Earth surface imagery already bundled with Aurora; orbit distances are proportional to an Earth radius but marker size is enlarged for visibility. The ground-track map is a coordinate grid, not a geographic basemap. Predicted positions depend on recent TLE data; time warp is illustrative and grows less accurate far from the TLE epoch.</p>
 </section>;
}
