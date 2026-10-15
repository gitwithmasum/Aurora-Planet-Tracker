import React from 'react';
import {Satellite,Compass,Clock3,MapPin,ArrowUpRight} from 'lucide-react';
import SatellitePassAlert from './SatellitePassAlert.jsx';
import SatelliteGlobe from './SatelliteGlobe.jsx';
import './SatelliteTracker.css';
export default function SatelliteTracker({alert,location,onLocation,onOpenSky}){
 const pass=alert.activePass||alert.upcoming;
 const change=(key,value,min,max)=>{
  if(value==='')return;
  const n=Number(value);
  if(Number.isFinite(n)&&n>=min&&n<=max)onLocation({...location,[key]:n,label:'Manual observer coordinates'});
 };
 return <section className="satTracker">
  <div className="satTrackerIntro"><div><span className="eyebrow">AURORA / OBSERVATION / v2.5</span><h3>Satellite Tracker</h3><p>ISS pass alerts, countdown, sci-fi audio and real-time direction guidance, based on your observer location.</p></div><Satellite size={42}/></div>
  <div className="satTrackerLocation"><MapPin size={17}/><span>{location.label}</span><label>LAT <input aria-label="Satellite observer latitude" type="number" min="-90" max="90" step=".0001" value={location.lat} onChange={e=>change('lat',e.target.value,-90,90)}/></label><label>LON <input aria-label="Satellite observer longitude" type="number" min="-180" max="180" step=".0001" value={location.lon} onChange={e=>change('lon',e.target.value,-180,180)}/></label></div>
  <SatelliteGlobe satrec={alert.satrec} now={alert.tick} loading={alert.status==='loading'} error={alert.error} onRefresh={alert.refresh}/>
  <SatellitePassAlert alert={alert}/>
  <div className="satTrackerDetails">
   <div><Compass size={20}/><span>PASS DIRECTION</span><strong>{pass?Math.round(pass.azStart)+'° from true north':'—'}</strong><small>The arrow indicates the ISS bearing, not your phone's heading.</small></div>
   <div><Clock3 size={20}/><span>PREDICTED PASS HEIGHT</span><strong>{pass?pass.maxAltitude.toFixed(1)+'°':'—'}</strong><small>Estimated peak altitude. Local obstructions and weather may affect visibility.</small></div>
  </div>
  <button className="satTrackerSkyLink" type="button" onClick={onOpenSky}>OPEN SKY TONIGHT FOR FULL PASS ANALYSIS <ArrowUpRight size={16}/></button>
  <p className="satTrackerCaution">This release tracks the International Space Station (ISS), not every orbiting satellite. Notifications are delivered only when the browser is running and permitted to show them; reliable alerts after closing the app require a separate push/notification backend.</p>
 </section>;
}
