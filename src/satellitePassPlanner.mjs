import {predictIssPasses,direction} from './skyTonightMath.mjs';
import {assessIssPass} from './issVisibility.mjs';

export const ALERT_LEAD_MINUTES=[5,10,15,30];
export const DEFAULT_ALERT_SETTINGS={enabled:false,leadMinutes:10,sound:true};
export function visibilityEstimate(pass,satrec,lat,lon){
 if(!pass||!satrec)return {label:'Unavailable',score:null,reason:'No validated orbital elements'};
 const atPeak=assessIssPass(pass,satrec,lat,lon);
 const elevation=Number(pass.maxAltitude);
 if(!Number.isFinite(elevation))return {label:'Unavailable',score:null,reason:'Peak altitude unavailable'};
 const elevationPoints=Math.min(50,Math.max(0,(elevation-10)/80*50));
 const sunlight=atPeak.sunlit,night=atPeak.dark;
 // Qualitative *potential*, not probability of sighting and not calculated apparent magnitude.
 const score=Math.round(elevationPoints+(sunlight===true?25:0)+(night===true?25:0));
 const label=sunlight===false||night===false?'Unlikely':sunlight===null||night===null?'Uncertain':elevation>=45?'Favorable geometry':'Possible';
 return {label,score,reason:atPeak.reason,sunlit:sunlight,dark:night,sunAltitude:atPeak.sunAltitude};
}
export function predictSatelliteCalendar(satrec,start,lat,lon,days=3,minAltitude=10){
 if(!satrec||!(start instanceof Date)||!Number.isFinite(start.getTime()))return [];
 const bounded=Math.min(7,Math.max(1,Number(days)||3));
 // Preserve the shared SGP4 predictor and its 30s resolution. Predictions remain approximate.
 return predictIssPasses(satrec,start,lat,lon,bounded*24,minAltitude)
  .filter(p=>p.end>start).map(pass=>({...pass,visibility:visibilityEstimate(pass,satrec,lat,lon)}));
}
export function alertShouldFire(pass,now,leadMinutes,seen=false){
 if(!pass||seen||!ALERT_LEAD_MINUTES.includes(leadMinutes))return false;
 const delta=new Date(pass.start).getTime()-now;
 return delta>=0&&delta<=leadMinutes*60000;
}
export function uniquePassKey(noradId,pass){
 return String(noradId)+':'+new Date(pass.start).getTime();
}
export function alertDirection(pass){
 return pass&&Number.isFinite(pass.azStart)?direction(pass.azStart)+' · '+Math.round(pass.azStart)+'° from true north':'Direction unavailable';
}
