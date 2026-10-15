import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Textures below are procedurally generated illustrative effects, NOT NASA satellite imagery.
const fract=value=>value-Math.floor(value);
function hash(x,y,seed=1){return fract(Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453)}
export function makeCloudTexture(width=512,height=256){
 const data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const nx=x/width*18,ny=y/height*10;
  const coarse=hash(Math.floor(nx),Math.floor(ny),1);
  const medium=hash(Math.floor(nx*3),Math.floor(ny*3),2);
  const fine=hash(Math.floor(nx*10),Math.floor(ny*10),3);
  const bands=.16*Math.sin(ny*3.3+Math.sin(nx*1.8)*2);
  const coverage=Math.max(0,Math.min(1,(coarse*.62+medium*.3+fine*.08+bands-.42)*2.2));
  const idx=(y*width+x)*4;
  data[idx]=255;data[idx+1]=255;data[idx+2]=255;data[idx+3]=Math.round(coverage*200);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.needsUpdate=true;return texture;
}
const CITIES=[[40.7,-74],[34,-118],[51.5,0],[48.8,2.3],[35.7,139.7],[31.2,121.5],[28.6,77.2],[19.1,72.9],[23.8,90.4],[30,31.2],[55.7,37.6],[37.5,127],[1.3,103.8],[-23.5,-46.6],[-34.6,-58.4],[-33.9,151.2],[41,29],[13.8,100.5],[6.5,3.4],[52.5,13.4],[45.5,-73.6],[24.7,46.7],[14.6,121],[-26.2,28.1]];
export function makeNightTexture(width=512,height=256){
 const data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const lat=90-180*y/height,lon=x/width*360-180;
  let brightness=0;
  for(const [cityLat,cityLon] of CITIES){
   const dLon=Math.abs(((lon-cityLon+540)%360)-180)*Math.cos(cityLat*Math.PI/180);
   const dist=(lat-cityLat)**2+dLon**2;
   brightness+=Math.exp(-dist/36)*.95;
  }
  brightness=Math.min(1,brightness)*(0.55+hash(x,y,7)*.45);
  const i=(y*width+x)*4;
  data[i]=Math.round(255*brightness);
  data[i+1]=Math.round(174*brightness);
  data[i+2]=Math.round(80*brightness);
  data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;texture.wrapS=THREE.RepeatWrapping;return texture;
}
export function EarthEffects({radius,quality='high',speed=1}){
 const clouds=useMemo(()=>makeCloudTexture(quality==='low'?256:512,quality==='low'?128:256),[quality]);
 const night=useMemo(()=>makeNightTexture(quality==='low'?256:512,quality==='low'?128:256),[quality]);
 const material=useMemo(()=>new THREE.ShaderMaterial({
  uniforms:{nightMap:{value:night},cityIntensity:{value:.95}},
  vertexShader:`varying vec2 vUv;varying vec3 vWorldNormal;varying vec3 vWorldPosition;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorldPosition=world.xyz;vWorldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`uniform sampler2D nightMap;uniform float cityIntensity;varying vec2 vUv;varying vec3 vWorldNormal;varying vec3 vWorldPosition;void main(){vec3 toSun=normalize(-vWorldPosition);float shade=1.0-smoothstep(-0.16,0.18,dot(normalize(vWorldNormal),toSun));vec3 city=texture2D(nightMap,vUv).rgb;gl_FragColor=vec4(city*shade*cityIntensity,shade*.95);}`,
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
 }),[night]);
 const globe=useRef(),cloudMesh=useRef();
 useFrame((_,dt)=>{if(globe.current)globe.current.rotation.y+=dt*.14*speed;if(cloudMesh.current)cloudMesh.current.rotation.y+=dt*.16*speed;});
 useEffect(()=>()=>{clouds.dispose();night.dispose();material.dispose()},[clouds,night,material]);
 return <group>
  <mesh ref={globe} material={material} renderOrder={2}><sphereGeometry args={[radius*1.002,48,32]}/></mesh>
  <mesh ref={cloudMesh} castShadow receiveShadow><sphereGeometry args={[radius*1.018,48,32]}/><meshStandardMaterial map={clouds} transparent opacity={.42} depthWrite={false} alphaTest={.04} roughness={1}/></mesh>
 </group>;
}
export function SaturnDetailedRings({radius,quality='high'}){
 const geometry=useMemo(()=>{
  const geo=new THREE.RingGeometry(radius*1.32,radius*2.25,quality==='low'?96:192,1);
  const uv=geo.attributes.uv,position=geo.attributes.position;
  for(let i=0;i<uv.count;i++){
   const x=position.getX(i),y=position.getY(i),r=Math.hypot(x,y);
   uv.setXY(i,(r-radius*1.32)/(radius*.93),.5);
  }
  uv.needsUpdate=true;return geo;
 },[radius,quality]);
 const map=useMemo(()=>{
  const data=new Uint8Array(512*4);
  for(let x=0;x<512;x++){
   const u=x/511;const gap=Math.abs(u-.55)<.028||Math.abs(u-.17)<.015;
   const band=.43+.23*Math.sin(u*63)+.12*Math.sin(u*203);
   const alpha=gap?0:Math.min(.92,Math.max(.10,band));
   const i=x*4;
   data[i]=210+Math.round(24*Math.sin(u*8));data[i+1]=185+Math.round(25*Math.sin(u*7));data[i+2]=146+Math.round(32*Math.sin(u*9));data[i+3]=Math.round(alpha*255);
  }
  const tex=new THREE.DataTexture(data,512,1,THREE.RGBAFormat);
  tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;return tex;
 },[]);
 useEffect(()=>()=>{geometry.dispose();map.dispose()},[geometry,map]);
 return <mesh geometry={geometry} rotation={[-Math.PI/2.55,0,0]} castShadow receiveShadow>
  <meshStandardMaterial map={map} transparent side={THREE.DoubleSide} alphaTest={.06} depthWrite={false} roughness={.95} metalness={0}/>
 </mesh>;
}
// Native Three.js postprocessing; quality LOW bypasses composer to save GPU.
export function SolarBloom({quality='high'}){
 const {gl,scene,camera,size}=useThree();
 const composer=useMemo(()=>{
  if(quality==='low')return null;
  const effect=new EffectComposer(gl);
  effect.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(size.width,size.height),.28,.34,1.05);
  effect.addPass(bloom);
  effect.addPass(new OutputPass());
  return effect;
 },[gl,scene,camera,quality]);
 useEffect(()=>{if(!composer)return;composer.setSize(size.width,size.height)},[composer,size.width,size.height]);
 useEffect(()=>()=>composer?.dispose(),[composer]);
 useFrame((_,dt)=>{if(composer)composer.render(dt)},quality==='low'?0:1);
 return null;
}
