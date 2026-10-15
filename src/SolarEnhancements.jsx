import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
export function AtmosphereGlow({radius,color='#66c9ff',strength=.52}){
 const material=useMemo(()=>new THREE.ShaderMaterial({
  uniforms:{glowColor:{value:new THREE.Color(color)},strength:{value:strength}},
  vertexShader:`varying vec3 vNormal;varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 glowColor;uniform float strength;varying vec3 vNormal;varying vec3 vView;void main(){float fresnel=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.1);gl_FragColor=vec4(glowColor,clamp(fresnel*strength,0.0,0.85));}`,
  transparent:true,side:THREE.FrontSide,depthWrite:false,blending:THREE.AdditiveBlending
 }),[color,strength]);
 React.useEffect(()=>()=>material.dispose(),[material]);
 return <mesh material={material} renderOrder={3}><sphereGeometry args={[radius*1.085,48,32]}/></mesh>;
}
export function EarthMoon({radius,speed=1}){
 const pivot=useRef();
 useFrame((_,dt)=>{if(pivot.current)pivot.current.rotation.y+=dt*.14*speed});
 return <group ref={pivot}><mesh position={[radius*2.15,0,0]} castShadow><sphereGeometry args={[Math.max(.10,radius*.235),20,16]}/><meshStandardMaterial color="#adaaa4" roughness={1}/></mesh></group>;
}
export function AsteroidBelt({radius=8.6,quality='high',speed=1}){
 const ref=useRef();
 const count=quality==='low'?280:1150;
 const matrices=useMemo(()=>{
  const dummy=new THREE.Object3D(),output=[];
  for(let i=0;i<count;i++){const theta=(i*.61803398875%1)*Math.PI*2;const r=radius+(Math.sin(i*13.713)*.65);dummy.position.set(Math.cos(theta)*r,Math.sin(i*5.17)*.18,Math.sin(theta)*r);const size=.02+(i%17)/17*.065;dummy.scale.setScalar(size);dummy.rotation.set(i*1.19,i*.56,i*.87);dummy.updateMatrix();output.push(dummy.matrix.clone())}
  return output;
 },[count,radius]);
 React.useEffect(()=>{if(!ref.current)return;matrices.forEach((matrix,i)=>ref.current.setMatrixAt(i,matrix));ref.current.instanceMatrix.needsUpdate=true},[matrices]);
 useFrame((_,dt)=>{if(ref.current)ref.current.rotation.y+=dt*.004*speed});
 return <instancedMesh ref={ref} args={[null,null,count]} frustumCulled={false}><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color="#8c8790" roughness={1}/></instancedMesh>;
}
export function SunCorona({quality='high'}){
 return <group>
  <mesh><sphereGeometry args={[1.78,48,32]}/><meshBasicMaterial color="#ffe5a0" toneMapped={false}/></mesh>
  {[2.0,2.35,2.85].map((r,i)=><mesh key={r}><sphereGeometry args={[r,40,24]}/><meshBasicMaterial color={i===0?'#ffb957':'#fa8e36'} transparent opacity={[.16,.06,.025][i]} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending}/></mesh>)}
  {quality!=='low'&&<pointLight position={[0,0,0]} color="#ffd4a2" intensity={18} distance={24}/>}
 </group>;
}
