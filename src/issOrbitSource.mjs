import {parseIssTle} from './skyTonightMath.mjs';
const REMOTE='https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const LOCAL=(import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/')+'orbital-data/iss.json';
export const ISS_ORBIT_SOURCES={local:LOCAL,remote:REMOTE};
export function orbitEpoch(line1){
 const yearShort=Number(line1.slice(18,20)),day=Number(line1.slice(20,32));
 if(!Number.isFinite(yearShort)||!Number.isFinite(day)||day<1||day>367)throw Error('Invalid TLE epoch');
 const year=(yearShort>=57?1900:2000)+yearShort;
 return new Date(Date.UTC(year,0,1)+(day-1)*86400000);
}
export function validateOrbitElements(line1,line2,now=Date.now()){
 const tle=parseIssTle([line1,line2].join('\n'));
 const epoch=orbitEpoch(tle.line1);
 const age=(now-epoch.getTime())/86400000;
 if(!Number.isFinite(age)||age>5||age<-.5)throw Error('ISS orbital elements are stale or have an invalid epoch.');
 return {...tle,epoch};
}
export async function fetchIssOrbit(){
 const problems=[];
 try{
  const res=await fetch(LOCAL,{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const json=await res.json();
  const orbit=validateOrbitElements(json.line1,json.line2);
  return {...orbit,source:'Aurora orbital-data cache',fetchedAt:json.fetchedAt};
 }catch(error){problems.push('First-party orbit: '+error.message)}
 try{
  const res=await fetch(REMOTE,{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const tle=parseIssTle(await res.text());
  const orbit=validateOrbitElements(tle.line1,tle.line2);
  return {...orbit,source:'CelesTrak direct',fetchedAt:new Date().toISOString()};
 }catch(error){problems.push('CelesTrak direct: '+error.message)}
 throw Error('ISS orbit unavailable. '+problems.join('; ')+'. Refresh later.');
}
