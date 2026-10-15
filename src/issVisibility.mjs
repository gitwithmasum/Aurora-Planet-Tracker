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
