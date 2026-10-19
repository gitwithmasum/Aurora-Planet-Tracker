import * as satellite from 'satellite.js';
import {safeObserver} from './spaceScienceMath.mjs';
const RAD=Math.PI/180;
export function satelliteLook(satrec,date,location){
 const observer=safeObserver(location);
 if(!observer||!satrec||!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
 try{
  const propagated=satellite.propagate(satrec,date);
  if(!propagated?.position||typeof propagated.position==='boolean')return null;
  const gmst=satellite.gstime(date);
  const ecef=satellite.eciToEcf(propagated.position,gmst);
  const look=satellite.ecfToLookAngles({latitude:observer.lat*RAD,longitude:observer.lon*RAD,height:0},ecef);
  const elevation=look.elevation/RAD;
  const azimuth=((look.azimuth/RAD)%360+360)%360;
  const rangeKm=look.rangeSat;
  if(![elevation,azimuth,rangeKm].every(Number.isFinite)||rangeKm<0)return null;
  return {elevation,azimuth,rangeKm,above:elevation>0};
 }catch{return null}
}
