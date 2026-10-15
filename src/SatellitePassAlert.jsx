import React from 'react';
import {Bell,BellOff,Volume2,VolumeX,Satellite,Compass,Clock3} from 'lucide-react';
import {direction} from './skyTonightMath.mjs';
import './SatellitePassAlert.css';
const clock=date=>date?date.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
export default function SatellitePassAlert({alert,onShowSky,compact=false}){
 const {armed,soundOn,setSoundOn,status,error,enable,disable,testSound,
  upcoming,activePass,look,withinCountdown,countdown,directionText}=alert;
 const pass=activePass||upcoming;
 const bearing=look?.az??pass?.azStart;
 return <section className={compact?'satAlert satAlert--compact':'satAlert'} aria-label="ISS pass alert controls">
  <div className="satAlertHead"><div><span className="satAlertTag"><Satellite size={16}/> AURORA SATELLITE ALERT</span><h4>{activePass?'ISS PASS IN PROGRESS':withinCountdown?'ISS APPROACHING':armed?'NEXT ISS PASS':'PASS ALERT SYSTEM'}</h4></div><span className={armed?'satAlertStatus satAlertStatus--on':'satAlertStatus'}>{armed?'ARMED':'OFF'}</span></div>
  <p className="satAlertDescription">Opt in for a 10-minute warning, live countdown, north-referenced direction arrow, and an optional sci-fi chime.</p>
  <div className="satAlertButtons">
   <button type="button" onClick={armed?disable:enable} className={armed?'satAlertDisable':'satAlertEnable'}>{armed?<><BellOff size={16}/> DISABLE ALERTS</>:<><Bell size={16}/> ENABLE PASS ALERTS</>}</button>
   <label className="satAlertSound"><input type="checkbox" checked={soundOn} onChange={e=>setSoundOn(e.target.checked)}/>{soundOn?<Volume2 size={15}/>:<VolumeX size={15}/>} SOUND</label>
   <button type="button" onClick={testSound}>TEST CHIME</button>
  </div>
  <div className="satAlertInfo" aria-live="polite">
   <div><small>NEXT PASS / THRESHOLD 10°</small><strong>{upcoming?clock(upcoming.start):activePass?'IN PROGRESS':status==='loading'?'FETCHING ORBIT…':'—'}</strong></div>
   <div><small>{activePass?'PASS ACTIVE':withinCountdown?'COUNTDOWN TO PASS':'TIME UNTIL PASS'}</small><strong className="satAlertCountdown">{activePass?'NOW':countdown}</strong></div>
   <div><small>START DIRECTION</small><strong>{pass?direction(pass.azStart)+' · '+Math.round(pass.azStart)+'°':'—'}</strong></div>
  </div>
  {pass&&<div className="satAlertDirection">
   <div className="satAlertCompass"><div className="satAlertCompassArrow" style={{transform:'rotate('+Number(bearing||0)+'deg)'}}><svg viewBox="0 0 64 64" role="img" aria-label="Direction arrow relative to north"><path d="M32 4 46 54 32 43 18 54Z" fill="#74f1ff" stroke="#d2fbff" strokeWidth="2"/></svg></div><span className="satNorth">N</span></div>
   <div><small>{activePass?'TRACKING NOW':'LOOK TOWARD THE RISING DIRECTION'}</small><strong>{directionText}</strong><p>{activePass&&look?'Current ISS altitude '+look.alt.toFixed(1)+'° · bearing '+look.az.toFixed(1)+'°':'Arrow is referenced to true north, not your phone orientation.'}</p></div>
  </div>}
  {error&&<p className="satAlertError" role="alert">{error}</p>}
  {armed&&status==='error'&&<p className="satAlertError">ISS pass times cannot be predicted until fresh orbital data is accessible.</p>}
  {armed&&status==='ready'&&!pass&&<p className="satAlertDescription">No predicted ISS pass above 10° in the next 24 hours.</p>}
  <div className="satAlertFoot"><span><Clock3 size={13}/> Live while page remains open</span>{onShowSky&&<button onClick={onShowSky}>OPEN SKY TONIGHT ↗</button>}</div>
  <p className="satAlertDisclaimer">Browser notifications need permission and HTTPS. Sound must be unlocked by a tap and may be muted in background. Alerts cannot reliably trigger after closing the browser, suspending the tab, or terminating an installed PWA. All directions are true-north bearings; computed ISS passes are not guaranteed visually observable.</p>
 </section>;
}
