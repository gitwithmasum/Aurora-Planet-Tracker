// Uses existing Astronomy Engine positions and the Galaxy Observatory J2000 catalog.
import {BODIES,bodyPosition,moonPhase} from './skyTonightMath.mjs';
import {GALAXIES,galaxyHorizontal} from './galaxyCatalog.mjs';
import {planObservationWindows,PLANNER_STEP_MINUTES,validPlannerCoordinates} from './observationPlannerCore.mjs';

export const OBSERVATION_TARGETS=[
 ...BODIES.map(name=>({id:'planet:'+name,name,type:'planet',detail:'Solar System planet'})),
 ...GALAXIES.map(g=>({id:'galaxy:'+g.id,name:g.name,type:'galaxy',detail:g.other||g.constellation,galaxyId:g.id,magnitude:g.mag}))
];
const galaxyIndex=new Map(GALAXIES.map(g=>[g.id,g]));
export function observationForecast({
 location,now=Date.now(),minAltitude=20,sunLimit=-12,hours=24
}={}){
 if(!validPlannerCoordinates(location)||!Number.isFinite(now))return {error:'Invalid observer coordinates',targets:[],startMs:null,moonIllumination:null};
 // Start at the next sampling boundary so every returned time is in the future.
 const startMs=Math.ceil(now/(PLANNER_STEP_MINUTES*60000))*PLANNER_STEP_MINUTES*60000;
 const lat=location.lat,lon=location.lon;
 const result=planObservationWindows({
  targets:OBSERVATION_TARGETS,
  startMs,hours,stepMinutes:PLANNER_STEP_MINUTES,minAltitude,sunLimit,
  getSunAltitude:time=>bodyPosition('Sun',new Date(time),lat,lon).alt,
  getTargetPosition:(target,time)=>{
   const date=new Date(time);
   if(target.type==='planet')return bodyPosition(target.name,date,lat,lon);
   const galaxy=galaxyIndex.get(target.galaxyId);
   return galaxy?galaxyHorizontal(galaxy,date,lat,lon):null;
  }
 });
 return {error:null,targets:result,startMs,moonIllumination:moonPhase(new Date(startMs))};
}
