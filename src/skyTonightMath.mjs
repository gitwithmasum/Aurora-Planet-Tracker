import * as Astronomy from 'astronomy-engine';
import * as satellite from 'satellite.js';
const RAD=Math.PI/180;
const EARTH_AU_KM=149597870.7;
export const BODIES=['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
export function direction(az){return ['N','NE','E','SE','S','SW','W','NW'][Math.round(((az%360)+360)%360/45)%8]}
export function bodyPosition(name,date,lat,lon){
 try{
  const observer=new Astronomy.Observer(Number(lat),Number(lon),0);
  const eq=Astronomy.Equator(name,date,observer,true,true);
  const h=Astronomy.Horizon(date,observer,eq.ra,eq.dec,'normal');
  return {name,alt:h.altitude,az:h.azimuth,above:h.altitude>0,distanceKm:eq.dist*EARTH_AU_KM};
 }catch{return {name,alt:NaN,az:NaN,above:false,distanceKm:NaN}}
}
export function moonPhase(date){
 try{const light=Astronomy.Illumination('Moon',date);return Math.round(light.phase_fraction*100)}
 catch{return null}
}
export function skySummary(date,lat,lon){
 const sun=bodyPosition('Sun',date,lat,lon);
 const moon=bodyPosition('Moon',date,lat,lon);
 const planets=BODIES.map(name=>bodyPosition(name,date,lat,lon));
 const darkness=Number.isFinite(sun.alt)?sun.alt<=-18?'Astronomical night':sun.alt<=-12?'Nautical twilight':sun.alt<=-6?'Civil twilight':sun.alt<0?'After sunset':'Daylight':'Unavailable';
 return {sun,moon,planets,darkness,phase:moonPhase(date)};
}
export function upcomingSunEvents(start,lat,lon,hours=36){
 const thresholds=[{label:'Sunset / sunrise',alt:0},{label:'Civil twilight',alt:-6},{label:'Nautical twilight',alt:-12},{label:'Astronomical twilight',alt:-18}];
 const result=[];let previous=start,prevAlt=bodyPosition('Sun',start,lat,lon).alt;
 for(let min=5;min<=hours*60;min+=5){
  const time=new Date(start.getTime()+min*60000);
  const alt=bodyPosition('Sun',time,lat,lon).alt;
  for(const item of thresholds)if(Number.isFinite(alt)&&Number.isFinite(prevAlt)&&((prevAlt>item.alt&&alt<=item.alt)||(prevAlt<item.alt&&alt>=item.alt))){
   const portion=(item.alt-prevAlt)/(alt-prevAlt);
   result.push({kind:item.label,event:prevAlt>alt?'Evening':'Morning',time:new Date(previous.getTime()+Math.max(0,Math.min(1,portion))*(time-previous))});
  }
  previous=time;prevAlt=alt;
 }
 return result;
}
export function parseIssTle(text){
 const lines=String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const idx=lines.findIndex((line,i)=>line.startsWith('1 25544')&&lines[i+1]?.startsWith('2 25544'));
 if(idx<0)throw Error('Valid ISS orbital elements were not returned.');
 const line1=lines[idx],line2=lines[idx+1];
 const satrec=satellite.twoline2satrec(line1,line2);
 if(satrec.error)throw Error('Satellite orbital data could not be parsed.');
 return {satrec,line1,line2,epoch:satellite.jdayToDate?null:null};
}
export function issLook(satrec,date,lat,lon){
 const state=satellite.propagate(satrec,date);
 if(!state?.position||typeof state.position==='boolean')return null;
 const gmst=satellite.gstime(date);
 const ecef=satellite.eciToEcf(state.position,gmst);
 const look=satellite.ecfToLookAngles({latitude:Number(lat)*RAD,longitude:Number(lon)*RAD,height:0},ecef);
 const altitude=look.elevation/RAD,azimuth=((look.azimuth/RAD)%360+360)%360;
 if(!Number.isFinite(altitude)||!Number.isFinite(azimuth))return null;
 return {alt:altitude,az:azimuth,rangeKm:look.rangeSat};
}
export function predictIssPasses(satrec,start,lat,lon,hours=24,minElevation=10){
 const result=[];let current=null;
 const interval=30000;
 for(let time=start.getTime();time<=start.getTime()+hours*3600000;time+=interval){
  const d=new Date(time),v=issLook(satrec,d,lat,lon);
  if(!v)continue;
  if(v.alt>=minElevation){
   if(!current)current={start:d,peak:d,maxAltitude:v.alt,azStart:v.az,azEnd:v.az};
   if(v.alt>current.maxAltitude){current.maxAltitude=v.alt;current.peak=d}
   current.azEnd=v.az;
  }else if(current){current.end=d;result.push(current);current=null}
 }
 if(current){current.end=new Date(start.getTime()+hours*3600000);result.push(current)}
 return result;
}
