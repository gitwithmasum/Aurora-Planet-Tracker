import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as Astronomy from 'astronomy-engine';
import {Camera,CameraOff,Compass,Crosshair,LocateFixed,RotateCcw,SlidersHorizontal,Info} from 'lucide-react';
import './ARScanner.css';
import {useLanguage} from './i18n.jsx';
import FieldTest from './FieldTest.jsx';
import {projectSkyPoint,wrapDegrees,validateCalibration,signedDegrees} from './arProjection.mjs';

const AU_KM=149597870.7;
const wrap=angle=>((angle%360)+360)%360;
const difference=(a,b)=>((a-b+540)%360)-180;
const number=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'—';
function calculate(name,location,instant){
 try{
  const observer=new Astronomy.Observer(location.lat,location.lon,0);
  const equatorial=Astronomy.Equator(name,instant,observer,true,true);
  const horizon=Astronomy.Horizon(instant,observer,equatorial.ra,equatorial.dec,'normal');
  return {az:horizon.azimuth,alt:horizon.altitude,km:equatorial.dist*AU_KM};
 }catch{return {az:NaN,alt:NaN,km:NaN}}
}
function compassDirection(az){return ['N','NE','E','SE','S','SW','W','NW'][Math.round(wrap(az)/45)%8]}
export default function ARScanner({planets,location,onLocation,onSelect,selected}){
 const {t}=useLanguage();
 const video=useRef(null),stream=useRef(null),lastEvent=useRef(0),listener=useRef(null);
 const [camera,setCamera]=useState(false),[cameraError,setCameraError]=useState('');
 const [orientation,setOrientation]=useState(null),[sensorEnabled,setSensorEnabled]=useState(false),[sensorError,setSensorError]=useState('');
 const [manualHeading,setManualHeading]=useState(180),[manualElevation,setManualElevation]=useState(35);
 const [correction,setCorrection]=useState(0),[autoHeading,setAutoHeading]=useState(false);
 const [locationError,setLocationError]=useState(''),[time,setTime]=useState(()=>new Date());
 const [fov,setFov]=useState(60),[roll,setRoll]=useState(0),[viewportSize,setViewportSize]=useState({width:640,height:480});
 const viewportRef=useRef(null);
 const [screenAngle,setScreenAngle]=useState(0),[sensorLastSeen,setSensorLastSeen]=useState(0),[deviceWidth,setDeviceWidth]=useState(null),[deviceHeight,setDeviceHeight]=useState(null);
 useEffect(()=>{const timer=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{try{const saved=validateCalibration(JSON.parse(localStorage.getItem('aurora-ar-calibration-v1')||'null'));if(saved){setFov(saved.hfov);setRoll(saved.roll)}}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('aurora-ar-calibration-v1',JSON.stringify({hfov:fov,roll}))}catch{}},[fov,roll]);
 useEffect(()=>{const target=viewportRef.current;if(!target)return;const update=()=>setViewportSize({width:Math.max(1,target.clientWidth),height:Math.max(1,target.clientHeight)});update();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)}const observer=new ResizeObserver(update);observer.observe(target);return()=>observer.disconnect()},[]);
 useEffect(()=>{const refresh=()=>setScreenAngle(Number.isFinite(window.screen?.orientation?.angle)?window.screen.orientation.angle:(Number.isFinite(window.orientation)?window.orientation:0));refresh();window.addEventListener('orientationchange',refresh);window.screen?.orientation?.addEventListener?.('change',refresh);return()=>{window.removeEventListener('orientationchange',refresh);window.screen?.orientation?.removeEventListener?.('change',refresh)}},[]);
 useEffect(()=>{if(!camera)return;const check=()=>{if(stream.current&&!stream.current.getVideoTracks().some(t=>t.readyState==='live')){setCamera(false);setCameraError('Camera stream ended. Restart camera to resume.')}};const timer=setInterval(check,1200);return()=>clearInterval(timer)},[camera]);
 useEffect(()=>{if(camera&&video.current&&stream.current){video.current.srcObject=stream.current;video.current.play().catch(()=>{})}},[camera]);
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop());if(listener.current){window.removeEventListener('deviceorientation',listener.current);window.removeEventListener('deviceorientationabsolute',listener.current)}},[]);
 async function startCamera(){
  setCameraError('');
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access requires HTTPS and a supported mobile browser.');
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
   stream.current?.getTracks().forEach(t=>t.stop());stream.current=media;const track=media.getVideoTracks()[0];setDeviceWidth(track?.getSettings()?.width||null);setDeviceHeight(track?.getSettings()?.height||null);setCamera(true);
  }catch(e){setCamera(false);setCameraError(e.message||'Camera permission or device unavailable.')}
 }
 function stopCamera(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(video.current)video.current.srcObject=null;setCamera(false);setDeviceWidth(null);setDeviceHeight(null)}
 async function enableSensor(){
  setSensorError('');
  try{
   if(typeof DeviceOrientationEvent==='undefined')throw new Error('Orientation sensor is not supported in this browser.');
   if(typeof DeviceOrientationEvent.requestPermission==='function'){
    const permission=await DeviceOrientationEvent.requestPermission();
    if(permission!=='granted')throw new Error('Device orientation permission not granted.');
   }
   if(listener.current){window.removeEventListener('deviceorientation',listener.current);window.removeEventListener('deviceorientationabsolute',listener.current)}
   const handler=event=>{
    const now=Date.now();if(now-lastEvent.current<100)return;lastEvent.current=now;
    const heading=Number.isFinite(event.webkitCompassHeading)?wrap(event.webkitCompassHeading):Number.isFinite(event.alpha)?wrap(360-event.alpha):null;
    const elevation=Number.isFinite(event.beta)?Math.max(-90,Math.min(90,90-Math.abs(event.beta))):null;
    setOrientation({heading,elevation,absolute:event.absolute===true||Number.isFinite(event.webkitCompassHeading)});
    setSensorLastSeen(now);
   };
   listener.current=handler;
   window.addEventListener('deviceorientation',handler);
   window.addEventListener('deviceorientationabsolute',handler);
   setSensorEnabled(true);
   // A heading derived from alpha is not necessarily aligned with the rear camera.
   setAutoHeading(false);
  }catch(e){setSensorError(e.message||'Sensor permission failed.')}
 }
 function useGPS(){
  setLocationError('');
  if(!navigator.geolocation){setLocationError('Geolocation unavailable; enter coordinates manually.');return}
  navigator.geolocation.getCurrentPosition(pos=>onLocation({lat:pos.coords.latitude,lon:pos.coords.longitude,label:'GPS • Current location'}),()=>setLocationError('GPS permission denied or timed out. Select observer coordinates manually.'),{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 }
 const recentSensor=sensorEnabled&&sensorLastSeen>0&&time.getTime()-sensorLastSeen<5000;
 const heading=autoHeading&&recentSensor&&orientation?.absolute&&Number.isFinite(orientation?.heading)?wrap(orientation.heading+correction):manualHeading;
 const elevation=manualElevation;
 const sensorFresh=sensorEnabled&&sensorLastSeen>0&&time.getTime()-sensorLastSeen<5000;
 const absoluteHeading=orientation?.absolute&&Number.isFinite(orientation.heading);
 const bodies=useMemo(()=>planets.map(p=>({...p,...calculate(p.name,location,time)})),[planets,location,time]);
 const aspect=viewportSize.width/viewportSize.height;
 const nearby=useMemo(()=>bodies.map(p=>{
  const projected=projectSkyPoint({azimuth:p.az,altitude:p.alt,heading,pitch:elevation,roll,hfov:fov,aspect});
  return {...p,x:projected?.x??NaN,y:projected?.y??NaN,onScreen:!!projected?.inFrame&&p.alt>=0&&projected.x>=7&&projected.x<=93&&projected.y>=7&&projected.y<=93};
 }),[bodies,heading,elevation,roll,fov,aspect]);
 const target=nearby.find(p=>p.name===selected.name)||nearby[0];
 return <div className="arModule">
 <div className="arLead"><div><span className="eyebrow">AURORA / AR NAVIGATION LAB</span><h3>{t('arTitle')}</h3><p>Explore calculated planet directions through a camera-assisted HUD. Use manual alignment to aim the overlay before relying on markers.</p></div><span className="arStatus">BETA · MANUAL ALIGNMENT</span></div>
 <div className="arLayout"><div className="arPrimary">
 <div className="arViewport" ref={viewportRef}>
  {camera?<video ref={video} autoPlay playsInline muted aria-label="Rear camera live preview"/>:<div className="arDemo"><div className="arDemoPlanet"/><span>CAMERA OFF · SIMULATED SKY BACKDROP</span></div>}
  <div className="arVignette"/><div className="arTargetLines"><span/><span/></div>
  <div className="arTopBar"><span>◉ SKY SCANNER</span><span>{camera?'CAMERA ACTIVE':'SIMULATED VIEW'}</span></div>
  {nearby.filter(p=>p.onScreen).map(p=><button type="button" key={p.name} style={{left:p.x+'%',top:p.y+'%','--bodyColor':p.color}} className={'arPlanet '+(p.name===selected.name?'highlight':'')} onClick={()=>onSelect(planets.find(q=>q.name===p.name))}><span className="arPlanetDot"/><span className="arPlanetLabel">{p.name}<small>{number(p.alt)}° ALT</small></span></button>)}
  <div className="arReticle"><Crosshair size={35}/></div>
  <div className="arBottomBar"><span>AZ {number(heading)}° {compassDirection(heading)}</span><span>ALT {number(elevation)}°</span><span>HFOV {fov}° · ROLL {roll}°</span></div>
 </div>
 <div className="arButtons"><button onClick={camera?stopCamera:startCamera} className="arAction">{camera?<CameraOff size={16}/>:<Camera size={16}/>} {camera?t('cameraStop'):t('cameraStart')}</button><button onClick={enableSensor} className="arAction arOutline"><Compass size={16}/> ENABLE SENSORS</button><button onClick={useGPS} className="arAction arOutline"><LocateFixed size={16}/> USE GPS</button></div>
 {(cameraError||sensorError||locationError)&&<div className="arErrors" role="alert">{[cameraError,sensorError,locationError].filter(Boolean).join(' • ')}</div>}
 <p className="arWarning"><Info size={15}/> Perspective-based marker positioning is still approximate and not verified optical AR. Heading and pitch are not a fully calibrated camera pose, even after detecting screen rotation ({screenAngle}°). Manually align with a known reference. Camera field-of-view and lens cropping are estimated; optical visibility depends on daylight, clouds and light pollution.</p>
 <div className="arDirections"><strong>PLANET DIRECTIONS / CURRENT TIME</strong><div>{nearby.map(p=><button key={p.name} className={selected.name===p.name?'chosen':''} onClick={()=>{onSelect(planets.find(q=>q.name===p.name));if(Number.isFinite(p.az))setManualHeading(Math.round(p.az));if(Number.isFinite(p.alt))setManualElevation(Math.max(-20,Math.min(90,Math.round(p.alt))));setAutoHeading(false)}}><span style={{background:p.color}}/>{p.name}<small>{number(p.az)}° / {number(p.alt)}°</small></button>)}</div></div>
 </div>
 <aside className="arSettings"><div className="arSectionTitle"><SlidersHorizontal size={17}/> MANUAL CALIBRATION</div>
 <p>Point your phone toward a known direction and adjust the overlay until it matches. Manual calibration remains available if sensors are blocked.</p>
 <label>VIEW DIRECTION <strong>{number(heading)}° {compassDirection(heading)}</strong><input type="range" aria-label="Camera heading" min="0" max="359" value={heading} onChange={e=>{setManualHeading(Number(e.target.value));setAutoHeading(false)}}/></label>
 <label>VIEW ELEVATION <strong>{number(elevation)}°</strong><input type="range" aria-label="Camera elevation" min="-20" max="90" value={manualElevation} onChange={e=>setManualElevation(Number(e.target.value))}/></label>
 <label>HORIZONTAL FIELD OF VIEW <strong>{fov}°</strong><input type="range" aria-label="Approximate horizontal camera field of view" min="35" max="90" step="5" value={fov} onChange={e=>setFov(Number(e.target.value))}/></label>
 <label>VIEW ROLL <strong>{roll}°</strong><input type="range" aria-label="Camera roll adjustment" min="-180" max="180" step="1" value={roll} onChange={e=>setRoll(Number(e.target.value))}/></label>
 <div className="arSensorBox"><div className="arSectionTitle">SENSOR TELEMETRY</div><p>{sensorFresh?'Orientation events detected':sensorEnabled?'No recent orientation updates; switch to manual alignment.':'Sensor currently inactive'}</p><div>Reported heading <b>{number(orientation?.heading)}°</b></div><div>Estimated elevation <b>{number(orientation?.elevation)}°</b></div><div>Absolute reference <b>{orientation?.absolute?'REPORTED (UNCALIBRATED)':'NOT VERIFIED'}</b></div><div>Screen rotation <b>{number(screenAngle,0)}°</b></div><div>Camera width <b>{deviceWidth?deviceWidth+' px':'—'}</b></div><div>Calibration <b>PERSPECTIVE / NOT OPTICALLY VERIFIED</b></div><button onClick={()=>{setManualHeading(heading);setAutoHeading(true);setCorrection(0)}} disabled={!sensorFresh||!absoluteHeading}>USE SENSOR HEADING (EXPERIMENTAL)</button><button onClick={()=>{if(!sensorFresh||!absoluteHeading||!Number.isFinite(target?.az))return;setCorrection(signedDegrees(target.az-orientation.heading));setManualHeading(wrap(target.az));setAutoHeading(true)}} disabled={!sensorFresh||!absoluteHeading||!Number.isFinite(target?.az)}>ALIGN SENSOR TO SELECTED PLANET (MANUAL REFERENCE)</button>{autoHeading&&<label>HEADING OFFSET <strong>{correction>0?'+':''}{correction}°</strong><input type="range" aria-label="Sensor heading offset" min="-180" max="180" value={correction} onChange={e=>setCorrection(Number(e.target.value))}/></label>}</div>
 <div className="arSectionTitle">CURRENT TARGET</div><div className="arTarget"><span className="arTargetOrb" style={{background:target?.color}}/><div><strong>{target?.name}</strong><small>{target?.type}</small></div></div>
 <div className="arTargetGrid"><div><small>AZIMUTH</small><strong>{number(target?.az)}°</strong></div><div><small>ALTITUDE</small><strong>{number(target?.alt)}°</strong></div><div><small>DISTANCE</small><strong>{number(target?.km/1e6,1)}M km</strong></div><div><small>HORIZON</small><strong>{target?.alt>0?'ABOVE':'BELOW'}</strong></div></div>
 <div className="arLocation"><strong>OBSERVER LOCATION</strong><p>{location.label}</p><div>Lat <input type="number" aria-label="AR observer latitude" step=".0001" min="-90" max="90" value={location.lat} onChange={e=>{const v=Number(e.target.value);if(v>=-90&&v<=90)onLocation({...location,lat:v,label:'Manual coordinates'})}}/></div><div>Lon <input type="number" aria-label="AR observer longitude" step=".0001" min="-180" max="180" value={location.lon} onChange={e=>{const v=Number(e.target.value);if(v>=-180&&v<=180)onLocation({...location,lon:v,label:'Manual coordinates'})}}/></div></div>
 <button className="arReset" onClick={()=>{setManualHeading(180);setManualElevation(35);setAutoHeading(false);setCorrection(0);setFov(60);setRoll(0)}}><RotateCcw size={15}/> RESET CALIBRATION</button>
 </aside></div>
 <FieldTest data={{camera,sensorFresh,sensorAbsolute:!!absoluteHeading,screenAngle,videoWidth:deviceWidth,videoHeight:deviceHeight,viewportWidth:viewportSize.width,viewportHeight:viewportSize.height,heading,elevation,roll,fov}}/>
 </div>
}
