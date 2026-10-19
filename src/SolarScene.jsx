// v4.5: WebGL scene deferred until user navigates to Solar System.
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,Stars,Text} from '@react-three/drei';
import * as THREE from 'three';
import {AtmosphereGlow,EarthMoon,AsteroidBelt,SunCorona} from './SolarEnhancements.jsx';
import {EarthEffects,SaturnDetailedRings,SolarBloom} from './SolarRealism.jsx';
import {AXIAL_TILT,solarOrbitRadius,solarPlanetRadius,spinRate} from './solarPhysics.mjs';

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
 const mesh=useRef(),pivot=useRef(),group=useRef(),worldPosition=useRef(new THREE.Vector3());
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
  if(group.current&&selected?.name===planet.name){group.current.getWorldPosition(worldPosition.current);onTrack.current=worldPosition.current;}
 });
 return <group ref={pivot}>
 <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[orbitRadius,orbitRadius+.014,192]}/><meshBasicMaterial color={selected?.name===planet.name?'#5fdcf9':'#517291'} transparent opacity={selected?.name===planet.name?.33:.16} side={THREE.DoubleSide}/></mesh>
 <group ref={group} position={[orbitRadius,0,0]}>
 <group rotation={[0,0,AXIAL_TILT[planet.name]*Math.PI/180]}><mesh ref={mesh} castShadow receiveShadow onClick={e=>{e.stopPropagation();onSelect(planet)}}>
 <sphereGeometry args={[radius,quality==='low'?24:48,quality==='low'?16:32]}/><meshStandardMaterial map={photomap||procedural} roughness={.96} metalness={0} color="#ffffff"/></mesh></group>
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
 const delta=useRef(new THREE.Vector3()),direction=useRef(new THREE.Vector3()),goal=useRef(new THREE.Vector3());
 useFrame((state,dt)=>{
  if(!focusEnabled||!tracked.current||!controls)return;
  const desired=tracked.current;
  delta.current.subVectors(desired,controls.target);
  const rate=1-Math.exp(-dt*2.3);
  camera.position.addScaledVector(delta.current,rate);
  controls.target.lerp(desired,rate);
  if(inspection){
   direction.current.subVectors(camera.position,controls.target).normalize();
   goal.current.copy(desired).addScaledVector(direction.current,Math.max(3.3,selected.size*4.2));
   camera.position.lerp(goal.current,1-Math.exp(-dt*1.2));
  }
  controls.update();
 });
 return null;
}
function NebulaDust({quality}){
 const points=useMemo(()=>{const count=quality==='low'?360:1400;const positions=new Float32Array(count*3);for(let i=0;i<count;i++){const r=25+Math.random()*57,angle=Math.random()*Math.PI*2;positions[i*3]=Math.cos(angle)*r;positions[i*3+1]=(Math.random()-.5)*34;positions[i*3+2]=Math.sin(angle)*r;}return positions;},[quality]);
 return <points><bufferGeometry><bufferAttribute attach='attributes-position' args={[points,3]}/></bufferGeometry><pointsMaterial color='#6a65d7' size={quality==='low'?.12:.2} transparent opacity={.34} sizeAttenuation depthWrite={false}/></points>;
}
export default function SolarScene({planets,selected,onSelect,paused,focus,inspection,speed,quality,cosmic,scaleMode,active}){
 const tracked=useRef(null);
 return <Canvas frameloop={active?'always':'demand'} shadows={quality!=='low'} camera={{position:[0,22,31],fov:50}} gl={{antialias:quality!=='low',alpha:true,powerPreference:quality==='low'?'low-power':'high-performance'}} dpr={quality==='low'?[1,1]:[1,1.6]}>
 {!cosmic&&<color attach="background" args={['#050915']}/>}<fog attach="fog" args={[cosmic?'#0a1230':'#07112c',cosmic?54:30,cosmic?160:100]}/>
 <ambientLight intensity={cosmic?.2:.16}/><hemisphereLight args={['#4b84ff','#170d20',cosmic?.22:.16]}/>
 <pointLight position={[0,0,0]} color="#fff0d3" intensity={165} distance={100} castShadow={quality!=='low'} shadow-mapSize={[1024,1024]} shadow-bias={-.0002}/>
 <Stars radius={160} depth={100} count={quality==='low'?1300:4300} factor={5} saturation={.25} fade speed={paused?0:.35}/><NebulaDust quality={quality}/>
 <SunCorona quality={quality}/><AsteroidBelt radius={scaleMode==='distance'?7.42:8.6} quality={quality} speed={paused?0:speed}/>
 {planets.map((p,i)=><PlanetMesh key={p.name} planet={p} index={i} selected={selected} onSelect={onSelect} speed={paused?0:speed} onTrack={tracked} scaleMode={scaleMode} quality={quality}/>)}
 <SolarBloom quality={quality}/>
 <OrbitControls makeDefault enableDamping dampingFactor={.055} minDistance={7} maxDistance={scaleMode==='distance'?115:72} maxPolarAngle={Math.PI*.82}/>
 <CameraFocus tracked={tracked} focusEnabled={focus||inspection} inspection={inspection} selected={selected}/>
 </Canvas>
}
