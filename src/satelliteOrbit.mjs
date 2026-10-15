import * as satellite from 'satellite.js';

const RADIUS_KM=6378.137;
const RAD=180/Math.PI;
export const EARTH_MODEL_RADIUS=2.65;

// Consistent geodetic -> scene coordinates. Longitude +90deg moves toward camera-right.
export function geoToScene(latitude,longitude,altitudeKm=0){
 const latitudeRad=latitude/RAD,longitudeRad=longitude/RAD;
 const r=EARTH_MODEL_RADIUS*(1+Math.max(0,altitudeKm)/RADIUS_KM);
 return [r*Math.cos(latitudeRad)*Math.sin(longitudeRad),r*Math.sin(latitudeRad),r*Math.cos(latitudeRad)*Math.cos(longitudeRad)];
}
export function satelliteTelemetry(satrec,date){
 if(!satrec||!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
 try{
  const state=satellite.propagate(satrec,date);
  if(!state?.position||typeof state.position==='boolean'||!state.velocity||typeof state.velocity==='boolean')return null;
  const gmst=satellite.gstime(date);
  const geodetic=satellite.eciToGeodetic(state.position,gmst);
  const latitude=satellite.degreesLat(geodetic.latitude),longitude=satellite.degreesLong(geodetic.longitude);
  const altitudeKm=geodetic.height;
  const speedKmS=Math.hypot(state.velocity.x,state.velocity.y,state.velocity.z);
  if(![latitude,longitude,altitudeKm,speedKmS].every(Number.isFinite))return null;
  return {latitude,longitude,altitudeKm,speedKmS,orbitalPeriodMin:Number.isFinite(satrec.no)&&satrec.no>0?2*Math.PI/satrec.no:null,point:geoToScene(latitude,longitude,altitudeKm),time:date};
 }catch{return null}
}
export function orbitalSamples(satrec,now,spanMinutes=100,stepSeconds=60){
 if(!satrec)return [];
 // Accept both Date and numeric Unix-millisecond timestamps; the 3D globe uses the latter.
 const milliseconds=now instanceof Date?now.getTime():Number(now);
 if(!Number.isFinite(milliseconds))return [];
 const samples=[];
 const start=milliseconds-spanMinutes*30000,stop=milliseconds+spanMinutes*30000;
 const step=stepSeconds*1000;
 for(let ts=start;ts<=stop;ts+=step){const sample=satelliteTelemetry(satrec,new Date(ts));if(sample)samples.push(sample)}
 return samples;
}
export function segmentGroundTrack(samples){
 const segments=[];let current=[];
 for(const p of samples){
  // The dateline is discontinuous on a flat projection.
  if(current.length&&Math.abs(p.longitude-current.at(-1).longitude)>180){
   if(current.length>1)segments.push(current);
   current=[];
  }
  current.push(p);
 }
 if(current.length>1)segments.push(current);
 return segments;
}
