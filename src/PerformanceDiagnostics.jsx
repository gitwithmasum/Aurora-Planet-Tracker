import React,{useEffect,useState} from 'react';
import {Activity,EyeOff,Monitor,ShieldCheck,X} from 'lucide-react';
import {formatBrowserFrameRate} from './performance.mjs';
import './PerformanceDiagnostics.css';
// Browser rAF is a lightweight scheduling signal, NOT a measured GPU draw FPS.
export default function PerformanceDiagnostics({active,quality,reducedMotion,visible,onClose}){
 const [rate,setRate]=useState(null);
 useEffect(()=>{
  if(!active){setRate(null);return}
  let raf=0,frames=0,started=0;
  function sample(time){
   if(!started)started=time;
   frames++;
   const elapsed=time-started;
   if(elapsed>=1400){
    setRate(formatBrowserFrameRate(frames,elapsed));
    frames=0;started=time;
   }
   raf=requestAnimationFrame(sample);
  }
  raf=requestAnimationFrame(sample);
  return()=>cancelAnimationFrame(raf);
 },[active]);
 return <aside className="auroraPerfDiagnostics" aria-label="Performance QA information">
  <div className="auroraPerfHead"><strong><Activity size={15}/> PERFORMANCE QA</strong><button type="button" onClick={onClose} aria-label="Close performance diagnostics"><X size={15}/></button></div>
  <dl>
   <div><dt><Monitor size={13}/> Graphics profile</dt><dd>{quality==='low'?'ECO':'HIGH'}</dd></div>
   <div><dt>Canvas animation</dt><dd>{active?'RUNNING':'PAUSED / ON DEMAND'}</dd></div>
   <div><dt><EyeOff size={13}/> Canvas in view</dt><dd>{visible?'YES':'NO'}</dd></div>
   <div><dt>Reduced-motion preference</dt><dd>{reducedMotion?'ON':'OFF'}</dd></div>
   <div><dt>Browser rAF cadence</dt><dd>{rate===null?'—':rate+' / sec'}</dd></div>
  </dl>
  <p><ShieldCheck size={14}/> Browser animation-frame cadence is indicative only. Actual WebGL render FPS, GPU memory, power and responsiveness require browser profiling tools.</p>
 </aside>;
}
