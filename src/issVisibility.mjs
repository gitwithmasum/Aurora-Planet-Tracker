import * as Astronomy from 'astronomy-engine';
import * as satellite from 'satellite.js';
import {bodyPosition} from './skyTonightMath.mjs';
const EARTH_RADIUS_KM=6378.137;
const AU_KM=149597870.7;
// Approximate cylindrical umbra. TEME satellite coordinates and astronomy-engine
// equatorial Sun direction differ slightly; this is an educational visibility aid,
// not a certified shadow/penumbra or photometric satellite brightness model.
export function estimateSunlit(satrec,date){
 const state=satellite.propagate(satrec,date);
 const pos=state?.position;
 if(!pos||typeof pos==='boolean')return null;
 const sun=Astronomy.GeoVector('Sun',date,true);
 const length=Math.hypot(sun.x,sun.y,sun.z);
 if(!Number.isFinite(length)||length===0)return null;
 const ux=sun.x/length,uy=sun.y/length,uz=sun.z/length;
 const along=pos.x*ux+pos.y*uy+pos.z*uz;
 const distanceSq=pos.x*pos.x+pos.y*pos.y+pos.z*pos.z-along*along;
 if(!Number.isFinite(distanceSq))return null;
 return !(along<0&&distanceSq<(EARTH_RADIUS_KM+45)**2);
}
export function assessIssPass(pass,satrec,lat,lon,cloudCover=null){
 if(!pass||!pass.peak)return {classification:'Unknown',sunlit:null,sunAltitude:null,reason:'No predicted peak'};
 const sunlit=estimateSunlit(satrec,pass.peak);
 const sunAltitude=bodyPosition('Sun',pass.peak,lat,lon).alt;
 const dark=Number.isFinite(sunAltitude)?sunAltitude<=-6:null;
 const clouds=Number.isFinite(cloudCover)?Math.max(0,Math.min(100,cloudCover)):null;
 let classification='Uncertain',reason='Orbital or Sun-angle data unavailable';
 if(sunlit===false){classification='Unlikely';reason='ISS is estimated inside Earth shadow at pass peak'}
 else if(dark===false){classification='Unlikely';reason='The observer sky is too bright at the pass peak'}
 else if(sunlit===true&&dark===true){
  if(clouds!==null&&clouds>=75){classification='Cloud limited';reason='Sunlit ISS and dark sky, but extensive cloud cover'}
  else{classification='Potentially visible';reason='Sunlit ISS and dark observer sky at peak; local horizon and weather still matter'}
 }
 return {classification,sunlit,sunAltitude,dark,cloudCover:clouds,reason};
}
export function cloudLabel(cloud){if(!Number.isFinite(cloud))return 'Unavailable';if(cloud<20)return 'Mostly clear';if(cloud<55)return 'Partly cloudy';if(cloud<80)return 'Mostly cloudy';return 'Overcast'}


/** Match pass time to an actual hourly forecast timestamp in UTC, no extrapolation. */
export function cloudForecastAt(forecast,date,maxMinutes=70){
 if(!forecast||!Array.isArray(forecast.times)||!Array.isArray(forecast.clouds)||!date)return null;
 const target=date.getTime();if(!Number.isFinite(target))return null;
 let closest=null,best=Infinity;
 for(let i=0;i<forecast.times.length;i++){
  const dt=Math.abs(Date.parse(forecast.times[i])-target),cloud=forecast.clouds[i];
  if(Number.isFinite(dt)&&Number.isFinite(cloud)&&dt<best){closest=Math.max(0,Math.min(100,cloud));best=dt}
 }
 return best<=maxMinutes*60000?closest:null;
}
/** Sample the full pass and describe the time spent with favourable illumination.
 * Sampling gives an estimate (not precise transition instants or naked-eye brightness).
 */
export function analyzeFullIssPass(pass,satrec,lat,lon,forecast=null,stepSeconds=20){
 if(!pass?.start||!pass?.end||!(pass.end>pass.start)||!satrec)return {classification:'Unknown',samples:[],bestWindow:null,reason:'No valid pass interval'};
 const samples=[],step=Math.max(10,Math.min(120,stepSeconds))*1000,start=pass.start.getTime(),end=pass.end.getTime();
 for(let t=start;t<=end+step;t+=step){
  const date=new Date(Math.min(t,end));
  const cloud=cloudForecastAt(forecast,date);
  const result=assessIssPass({peak:date},satrec,lat,lon,cloud);
  samples.push({time:date,classification:result.classification,sunlit:result.sunlit,dark:result.dark,cloudCover:cloud,reason:result.reason});
  if(date.getTime()===end)break;
 }
 const good=samples.filter(s=>s.classification==='Potentially visible');
 const cloudLimited=samples.filter(s=>s.classification==='Cloud limited');
 let current=null,longest=null;
 for(const s of samples){
  if(s.classification==='Potentially visible'){
   if(!current)current={start:s.time,end:s.time,count:0};current.end=s.time;current.count++;
  }else if(current){if(!longest||current.count>longest.count)longest=current;current=null}
 }
 if(current&&(!longest||current.count>longest.count))longest=current;
 const classification=good.length?'Potentially visible interval':cloudLimited.length?'Cloud limited':'Unlikely / uncertain';
 return {classification,samples,bestWindow:longest?{start:longest.start,end:longest.end}:null,
  favorableSamples:good.length,totalSamples:samples.length,
  reason:good.length?'Dark observer sky and estimated sunlit ISS overlap for part of this pass':cloudLimited.length?'Some dark and sunlit intervals appear cloud limited':'No interval meets both sunlight and darkness criteria, or data is incomplete'};
}
