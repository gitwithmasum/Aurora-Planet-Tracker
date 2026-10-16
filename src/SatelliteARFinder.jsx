import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Camera,CameraOff,Compass,LocateFixed,Crosshair,RotateCcw} from 'lucide-react';
import {issLook,direction} from './skyTonightMath.mjs';
import {guidingOffset,projectSatellite,wrapAzimuth} from './satelliteARMath.mjs';
import './SatelliteARFinder.css';
const KEY='aurora-satellite-ar-calibration-v1';
const number=v=>Number.isFinite(v)?v.toFixed(1):'—';
function readCalibration(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&Number.isFinite(x.heading)&&Number.isFinite(x.pitch)&&Number.isFinite(x.offset)?x:null}catch{return null}}
export default function SatelliteARFinder({satrec,now,location,name='Satellite',onLocation}){
 const video=useRef(null),media=useRef(null),container=useRef(null),lastSensor=useRef(0),cameraRequested=useRef(false),mounted=useRef(true);
 const [camera,setCamera]=useState(false),[cameraError,setCameraError]=useState('');
 const [sensor,setSensor]=useState(false),[sensorError,setSensorError]=useState(''),[sensorHeading,setSensorHeading]=useState(null),[sensorPitch,setSensorPitch]=useState(null),[sensorAbsolute,setSensorAbsolute]=useState(false);
 const [initial]=useState(readCalibration);
 const [heading,setHeading]=useState(initial?.heading??180),[pitch,setPitch]=useState(initial?.pitch??25),[offset,setOffset]=useState(initial?.offset??0);
 const [useSensor,setUseSensor]=useState(false),[useSensorPitch,setUseSensorPitch]=useState(false),[fov,setFov]=useState(65),[width,setWidth]=useState(640),[height,setHeight]=useState(360),[gpsError,setGpsError]=useState('');
 const [sensorFreshTime,setSensorFreshTime]=useState(0),[screenAngle,setScreenAngle]=useState(0);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify({heading,pitch,offset}))}catch{}},[heading,pitch,offset]);
 useEffect(()=>{if(!camera||!video.current||!media.current)return;video.current.srcObject=media.current;video.current.play().catch(()=>{})},[camera]);
 useEffect(()=>{
  const element=container.current;if(!element)return;
  const update=()=>{setWidth(element.clientWidth||640);setHeight(element.clientHeight||360)};
  update();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)}
  const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;cameraRequested.current=false;media.current?.getTracks().forEach(t=>t.stop());media.current=null}},[]);
 useEffect(()=>{const check=()=>{if(document.visibilityState==='hidden'){media.current?.getTracks().forEach(t=>t.stop());media.current=null;setCamera(false)}};document.addEventListener('visibilitychange',check);return()=>document.removeEventListener('visibilitychange',check)},[]);
 useEffect(()=>{const update=()=>setScreenAngle(Number.isFinite(screen.orientation?.angle)?screen.orientation.angle:0);update();screen.orientation?.addEventListener?.('change',update);return()=>screen.orientation?.removeEventListener?.('change',update)},[]);
 useEffect(()=>{
  if(!sensor)return;
  const receive=e=>{
   const time=Date.now();if(time-lastSensor.current<90)return;lastSensor.current=time;setSensorFreshTime(time);
   const absolute=Number.isFinite(e.webkitCompassHeading)||e.absolute===true;
   // Relative alpha does not give a verified north bearing. Require an absolute reference for guidance.
   const north=Number.isFinite(e.webkitCompassHeading)?wrapAzimuth(e.webkitCompassHeading):absolute&&Number.isFinite(e.alpha)?wrapAzimuth(360-e.alpha):null;
   setSensorAbsolute(Boolean(absolute&&Number.isFinite(north)));
   setSensorHeading(north);
   // Screen/camera pitch is device-dependent. Treat beta as approximate; manual pitch is the trusted fallback.
   setSensorPitch(Number.isFinite(e.beta)?Math.max(-20,Math.min(90,90-Math.abs(e.beta))):null);
  };
  window.addEventListener('deviceorientation',receive);
  return()=>window.removeEventListener('deviceorientation',receive);
 },[sensor]);
 async function startCamera(){
  setCameraError('');
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera requires HTTPS and a supported browser.');
   cameraRequested.current=true;
   const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
   if(!mounted.current||!cameraRequested.current){stream.getTracks().forEach(t=>t.stop());return}
   media.current?.getTracks().forEach(t=>t.stop());media.current=stream;setCamera(true);
  }catch(e){setCameraError(e.message||'Camera permission denied');setCamera(false)}
 }
 function stopCamera(){cameraRequested.current=false;media.current?.getTracks().forEach(t=>t.stop());media.current=null;if(video.current)video.current.srcObject=null;setCamera(false)}
 async function startSensors(){
  setSensorError('');
  try{
   if(typeof DeviceOrientationEvent==='undefined')throw Error('Orientation sensor not supported.');
   if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')throw Error('Sensor permission not granted.');
   setSensor(true);
  }catch(e){setSensorError(e.message||'Sensor unavailable')}
 }
 function gps(){
  setGpsError('');
  if(!navigator.geolocation){setGpsError('GPS unavailable');return}
  navigator.geolocation.getCurrentPosition(p=>onLocation({lat:p.coords.latitude,lon:p.coords.longitude,label:'GPS observer'}),()=>setGpsError('GPS denied; manual coordinates still work.'),{enableHighAccuracy:true,timeout:12000});
 }
 const look=useMemo(()=>satrec?issLook(satrec,new Date(now),location.lat,location.lon):null,[satrec,Math.floor(now/1000),location.lat,location.lon]);
 const freshSensor=sensor&&sensorFreshTime>0&&now-sensorFreshTime<5000;
 const trustedHeading=useSensor&&freshSensor&&sensorAbsolute&&Number.isFinite(sensorHeading);
 const liveHeading=trustedHeading?wrapAzimuth(sensorHeading+offset):heading;
 const livePitch=useSensor&&useSensorPitch&&freshSensor&&Number.isFinite(sensorPitch)?sensorPitch:pitch;
 const guidance=look?guidingOffset(look.az,look.alt,liveHeading,livePitch):null;
 const point=look?projectSatellite(look.az,look.alt,liveHeading,livePitch,fov,width/Math.max(height,1)):null;
 return <section className="satAR" aria-label="AR satellite finder">
  <div className="satARHeader"><div><span className="eyebrow">AURORA / v2.8.1 / CAMERA-ASSISTED FINDER</span><h4>AR Satellite Finder</h4><p>{name} · predicted look direction from your observer coordinates.</p></div><div className="satARStatus">{camera?'CAMERA ACTIVE':'CAMERA OFF'} · {trustedHeading?'SENSOR HEADING':useSensor?'MANUAL FALLBACK':'MANUAL ALIGNMENT'}</div></div>
  <div className="satARViewport" ref={container}>
   {camera?<video ref={video} muted playsInline autoPlay aria-label="Live rear camera preview"/>:<div className="satARDemo">CAMERA OFF · DIRECTION HUD PREVIEW</div>}
   <div className="satARReticle"><Crosshair size={34}/></div>
   {point?.inFrame&&<div className="satARTarget" style={{left:point.x+'%',top:point.y+'%'}}><span>⊕</span><b>{name}</b></div>}
   <div className="satAROverlayTop">HEADING {number(liveHeading)}° · ELEVATION {number(livePitch)}°</div>
   <div className="satAROverlayBottom">{look?.alt<0?'TARGET BELOW HORIZON':guidance?.aligned?'TARGET ALIGNED (ESTIMATE)':guidance?guidance.turn+' · '+guidance.tilt:'FRESH ORBITAL DATA REQUIRED'}</div>
  </div>
  <div className="satARActions"><button type="button" onClick={camera?stopCamera:startCamera}>{camera?<CameraOff size={16}/>:<Camera size={16}/>} {camera?'STOP CAMERA':'START CAMERA'}</button><button type="button" onClick={startSensors}><Compass size={16}/> ENABLE COMPASS</button><button type="button" onClick={gps}><LocateFixed size={16}/> USE GPS</button></div>
  {(cameraError||sensorError||gpsError)&&<p className="satARError" role="alert">{[cameraError,sensorError,gpsError].filter(Boolean).join(' · ')}</p>}
  <div className="satARReadout">
   <div><small>TARGET AZIMUTH</small><strong>{number(look?.az)}° {Number.isFinite(look?.az)?direction(look.az):''}</strong></div>
   <div><small>TARGET ELEVATION</small><strong>{number(look?.alt)}°</strong></div>
   <div><small>HORIZONTAL CORRECTION</small><strong>{guidance?number(Math.abs(guidance.horizontal))+'° '+guidance.turn:'—'}</strong></div>
   <div><small>VERTICAL CORRECTION</small><strong>{guidance?number(Math.abs(guidance.vertical))+'° '+guidance.tilt:'—'}</strong></div>
  </div>
  <div className="satARCalibrate">
   <h5>CALIBRATED DIRECTION GUIDANCE</h5>
   <p>Face a known compass direction to calibrate the camera overlay. Magnetic interference and device rotation can affect sensors; manual controls remain available.</p>
   <label>MANUAL HEADING <b>{heading}°</b><input aria-label="Satellite AR manual heading" type="range" min="0" max="359" value={heading} onChange={e=>{setHeading(Number(e.target.value));setUseSensor(false)}}/></label>
   <label>MANUAL ELEVATION <b>{pitch}°</b><input aria-label="Satellite AR manual elevation" type="range" min="-20" max="90" value={pitch} onChange={e=>{setPitch(Number(e.target.value));setUseSensor(false)}}/></label>
   <label>COMPASS OFFSET <b>{offset}°</b><input aria-label="Satellite AR compass calibration offset" type="range" min="-180" max="180" value={offset} onChange={e=>setOffset(Number(e.target.value))}/></label>
   <label>CAMERA HFOV <b>{fov}°</b><input aria-label="Satellite AR field of view" type="range" min="35" max="90" step="5" value={fov} onChange={e=>setFov(Number(e.target.value))}/></label>
   <div className="satARSensor"><span>SENSOR STATUS: {freshSensor?'FRESH':'STALE / UNAVAILABLE'}</span><span>COMPASS REFERENCE: {sensorAbsolute?'ABSOLUTE REPORTED':'NOT VERIFIED'}</span><span>SCREEN ROTATION: {screenAngle}°</span><span>SENSOR HEADING: {number(sensorHeading)}°</span><span>SENSOR ELEVATION: {number(sensorPitch)}° (APPROX.)</span></div>
   <label className="satARPitchOpt"><input type="checkbox" checked={useSensorPitch} disabled={!freshSensor} onChange={e=>setUseSensorPitch(e.target.checked)}/> EXPERIMENTAL SENSOR PITCH (device-dependent)</label>
   <div className="satARActions"><button type="button" disabled={!freshSensor||!sensorAbsolute||!Number.isFinite(sensorHeading)} onClick={()=>setUseSensor(true)}>USE SENSOR HEADING (EXPERIMENTAL)</button><button type="button" onClick={()=>{setUseSensor(false);setUseSensorPitch(false);setHeading(180);setPitch(25);setOffset(0);setFov(65)}}><RotateCcw size={15}/> RESET</button></div>
  </div>
  <p className="satARWarning">Camera-assisted astronomical pointing is an educational estimate, not an optically calibrated or safety-critical AR instrument. The camera field of view and device pitch are approximate. A target below the horizon cannot be seen. Actual satellite visibility requires darkness, solar illumination and clear sky. Permission prompts occur only when requested.</p>
 </section>;
}
