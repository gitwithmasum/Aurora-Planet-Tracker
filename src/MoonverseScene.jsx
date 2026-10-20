import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Stars} from '@react-three/drei';
import * as THREE from 'three';
import {moonOrbitPath,moonOrbitPosition,moonDrawRadius} from './moonOrbitMath.mjs';
import {interpolateHorizons,horizonDisplayPosition,horizonTrail} from './horizonsCore.mjs';

// The astronomical moon motions are an educational orbit phase illustration,
// NOT an accurately oriented 3D JPL/Horizons ephemeris. Relative sizes and
// distance are intentionally compressed to keep each body selectable.
const palette={volcanic:'#f1b65d',icy:'#d7e7f4',ocean:'#c4e4fd','ocean candidate':'#b8d7f0',
 atmosphere:'#dba871',rocky:'#988d88',irregular:'#9a978d',retrograde:'#a5bfd4'};
function SelectedMoon({moon,epochDays,speed,active,onSelect,selected,mode='model',snapshot=null,atMs=null,quality='high'}){
 const mesh=useRef(null),position=useRef(null);
 const precise=useMemo(()=>mode==='horizons'?horizonDisplayPosition(interpolateHorizons(snapshot,moon.id,atMs)):null,[mode,snapshot,moon.id,atMs]);
 const start=useMemo(()=>moonOrbitPosition(moon,epochDays),[moon,epochDays]);
 const paths=useMemo(()=>mode==='horizons'?horizonTrail(snapshot?.targets?.[moon.id],{atMs}):moonOrbitPath(moon,moon.eccentricity>.5?180:120),[mode,snapshot,moon,atMs]);
 const points=useMemo(()=>paths.map(p=>new THREE.Vector3(...p)),[paths]);
 const line=useMemo(()=>new THREE.BufferGeometry().setFromPoints(points),[points]);
 useEffect(()=>()=>line.dispose(),[line]);
 useFrame((_,dt)=>{
  if(mode==='horizons'||!active||!position.current)return;
  const stamp=position.current.userData.elapsedDays=(position.current.userData.elapsedDays??0)+dt*speed/24;
  const current=moonOrbitPosition(moon,epochDays+stamp);
  if(current)position.current.position.set(current.x,current.y,current.z);
  if(mesh.current)mesh.current.rotation.y+=dt*.15;
 });
 useEffect(()=>{
  if(!position.current)return;
  position.current.userData.elapsedDays=0;
  if(mode==='horizons'&&precise)position.current.position.set(...precise);
  else if(start)position.current.position.set(start.x,start.y,start.z);
 },[start,moon,mode,precise]);
 return <group>
  {mode==='horizons'?<line geometry={line}><lineBasicMaterial color={selected?'#f6b4d9':'#6292ae'} transparent opacity={selected?.8:.26} depthWrite={false}/></line>:<lineLoop geometry={line}><lineBasicMaterial color={selected?'#f6b4d9':'#6292ae'} transparent opacity={selected?.8:.26} depthWrite={false}/></lineLoop>}
  <group ref={position} position={mode==='horizons'&&precise?precise:[start?.x||0,0,start?.z||0]}>
   <mesh ref={mesh} onClick={e=>{e.stopPropagation();onSelect(moon.id)}} castShadow={false}>
    <sphereGeometry args={[moonDrawRadius(moon.radiusKm),quality==='low'?12:16,quality==='low'?8:12]}/>
    <meshStandardMaterial color={palette[moon.category]||'#b6b6b6'} roughness={.9} emissive={selected?'#62314d':'#111521'} emissiveIntensity={selected?.3:.07}/>
   </mesh>
   {selected&&<mesh><sphereGeometry args={[moonDrawRadius(moon.radiusKm)*1.6,quality==='low'?12:16,quality==='low'?8:12]}/><meshBasicMaterial color="#f9b9db" wireframe transparent opacity={.22} depthWrite={false}/></mesh>}
  </group>
 </group>;
}
function PlanetSphere({planet,quality='high'}){
 const [texture,setTexture]=useState(null);
 const reference=useMemo(()=>({Mercury:.44,Venus:.8,Earth:1,Mars:.68,Jupiter:1.55,Saturn:1.45,Uranus:1.3,Neptune:1.3,Pluto:.56})[planet.name]||1,[planet.name]);
 useEffect(()=>{
  let active=true;
  if(planet.name==='Pluto')return undefined;
  const loader=new THREE.TextureLoader();
  loader.load(import.meta.env.BASE_URL+'planet-textures/'+planet.name.toLowerCase()+'.jpg',map=>{
   if(!active){map.dispose();return}
   map.colorSpace=THREE.SRGBColorSpace;setTexture(map);
  },undefined,()=>{if(active)setTexture(null)});
  return()=>{active=false};
 },[planet.name]);
 useEffect(()=>()=>texture?.dispose(),[texture]);
 return <group>
  <mesh rotation={[0,.35,0]}>
   <sphereGeometry args={[reference,quality==='low'?28:48,quality==='low'?20:32]}/>
   <meshStandardMaterial color={texture?'#ffffff':planet.color} map={texture} roughness={.92}/>
  </mesh>
  {planet.name==='Saturn'&&<mesh rotation={[-Math.PI/2,.28,0]}>
   <ringGeometry args={[reference*1.25,reference*1.9,quality==='low'?56:112]}/>
   <meshBasicMaterial color="#c8ac82" transparent opacity={.52} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>}
  {planet.name==='Uranus'&&<mesh rotation={[-Math.PI/2,.25,0]}>
   <ringGeometry args={[reference*1.35,reference*1.4,quality==='low'?48:96]}/>
   <meshBasicMaterial color="#a5dbe1" transparent opacity={.34} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>}
 </group>;
}
export default function MoonverseScene({planet,moons,selectedId,onSelect,epochDays,speed,active,quality='high',mode='model',snapshot=null,atMs=null}){
 const resources=useMemo(()=>moons.slice(0,12).filter(m=>mode!=='horizons'||!!interpolateHorizons(snapshot,m.id,atMs)),[moons,mode,snapshot,atMs]);
 return <Canvas
  aria-label={'Illustrative 3D '+planet.name+' moon system'}
  camera={{position:[0,10,17],fov:49}}
  dpr={quality==='low'?[1,1]:[1,1.5]}
  frameloop={mode!=='horizons'&&active&&speed>0?'always':'demand'}
  gl={{antialias:quality!=='low',alpha:true,powerPreference:quality==='low'?'low-power':'high-performance'}}>
  <color attach="background" args={['#050a19']}/>
  <ambientLight intensity={1.2}/><hemisphereLight args={['#b7d6fa','#171a2c',.6]}/>
  <pointLight position={[12,12,14]} intensity={95} decay={2} color="#fff5df"/>
  <Stars radius={125} depth={50} count={quality==='low'?300:950} factor={3} saturation={.25} fade speed={0}/>
  <PlanetSphere planet={planet} quality={quality}/>
  {resources.map(m=><SelectedMoon key={m.id} moon={m} epochDays={epochDays} speed={speed} active={active} selected={selectedId===m.id} onSelect={onSelect} mode={mode} snapshot={snapshot} atMs={atMs} quality={quality}/>)}
  <OrbitControls makeDefault enablePan enableDamping minDistance={3} maxDistance={33} maxPolarAngle={Math.PI*.85}/>
 </Canvas>;
}
