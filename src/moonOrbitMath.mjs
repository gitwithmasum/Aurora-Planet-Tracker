// v5.0 deterministic, EDUCATIONAL two-body orbital ellipse.
// Orbital elements do not have reference epoch, node, argument of periapsis,
// planetary obliquity or perturbations; do NOT use as observational ephemeris.
import {moonValid,moonsForPlanet} from './moonCatalog.mjs';
const TAU=2*Math.PI;
export const MOON_ORBIT_EPOCH='2026-10-20T00:00:00.000Z';
const epochMs=Date.parse(MOON_ORBIT_EPOCH);
export function normalizeAngle(value){return ((value%TAU)+TAU)%TAU}
export function orbitalScale(orbitKm){return Math.max(2,Math.min(9,1.8+Math.log10(Math.max(orbitKm,1000)/2000)*1.85))}
export function moonDrawRadius(radiusKm){return Math.max(.065,Math.min(.36,.055+Math.sqrt(Math.max(0,radiusKm)/2600)*.31))}
export function orbitalPhase(moon,dayOffset=0){
 if(!moonValid(moon)||!Number.isFinite(dayOffset))return null;
 const period=Math.abs(moon.periodDays);
 const sign=moon.periodDays<0?-1:1;
 const phase=normalizeAngle(dayOffset/period*TAU*sign);
 return phase;
}
export function solveEccentricAnomaly(meanAnomaly,e){
 if(!Number.isFinite(meanAnomaly)||!Number.isFinite(e)||e<0||e>=1)return null;
 const m=normalizeAngle(meanAnomaly);
 let result=e>.8?Math.PI:m;
 for(let i=0;i<15;i++){
  const numerator=result-e*Math.sin(result)-m;
  const denominator=1-e*Math.cos(result);
  const step=numerator/denominator;
  result-=step;
  if(Math.abs(step)<1e-11)break;
 }
 return result;
}
export function moonOrbitPosition(moon,dayOffset=0,{stylized=true}={}){
 const phase=orbitalPhase(moon,dayOffset);
 if(phase===null)return null;
 const eccentricAnomaly=solveEccentricAnomaly(phase,moon.eccentricity);
 const a=stylized?orbitalScale(moon.orbitKm):moon.orbitKm;
 const e=moon.eccentricity;
 const x=a*(Math.cos(eccentricAnomaly)-e);
 const z=a*Math.sqrt(1-e*e)*Math.sin(eccentricAnomaly);
 // v5.0 all orbits are drawn in one plane, not true orbital inclinations.
 return {x,y:0,z,distance:Math.hypot(x,z),phase,radialKm:moon.orbitKm*(1-e*Math.cos(eccentricAnomaly))};
}
export function moonOrbitPath(moon,count=160){
 if(!moonValid(moon)||!Number.isInteger(count)||count<16||count>500)return [];
 const points=[];
 for(let i=0;i<=count;i++){
  const e=TAU*i/count,a=orbitalScale(moon.orbitKm),v=moon.eccentricity;
  points.push([a*(Math.cos(e)-v),0,a*Math.sqrt(1-v*v)*Math.sin(e)]);
 }
 return points;
}
export function validateMoonCatalog(list){
 if(!Array.isArray(list))return {valid:false,errors:['Catalog is not an array']};
 const errors=[],ids=new Set();
 for(const row of list){
  if(!moonValid(row))errors.push('Invalid scientific parameters: '+String(row?.name||'unknown'));
  if(ids.has(row.id))errors.push('Duplicate moon id: '+row.id);
  ids.add(row.id);
 }
 return {valid:errors.length===0,errors,count:list.length};
}
export function sceneMoonList(planet,limit=12){
 return moonsForPlanet(planet).sort((a,b)=>a.orbitKm-b.orbitKm).slice(0,limit);
}
export function moonRelativeEpoch(date){
 const ms=date instanceof Date?date.getTime():Date.parse(date);
 return Number.isFinite(ms)?(ms-epochMs)/86400000:null;
}
