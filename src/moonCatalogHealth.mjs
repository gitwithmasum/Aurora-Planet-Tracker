import {MOONS,MOON_PLANETS,moonValid} from './moonCatalog.mjs';

/** Read-only consistency audit; it never modifies curated science data. */
export function auditMoonCatalog(moons=MOONS, planets=MOON_PLANETS){
 const issues=[];const ids=new Set();
 for(const [index,moon] of moons.entries()){
  const label=moon?.id||moon?.name||('row-'+(index+1));
  if(!moon||typeof moon!=='object'){issues.push({code:'invalid-record',id:label,message:'Record is not an object'});continue;}
  if(typeof moon.id!=='string'||!moon.id.trim())issues.push({code:'missing-id',id:label,message:'Missing stable moon id'});
  else if(ids.has(moon.id))issues.push({code:'duplicate-id',id:moon.id,message:'Duplicate moon id'});else ids.add(moon.id);
  if(!moonValid(moon))issues.push({code:'invalid-physical-data',id:label,message:'Physical values or parent planet failed validation'});
  if(!Array.isArray(moon.missions)||moon.missions.some(m=>typeof m!=='string'||!m.trim()))issues.push({code:'invalid-missions',id:label,message:'Mission list must contain non-empty strings'});
  if(typeof moon.source!=='string'||!moon.source.startsWith('https://'))issues.push({code:'missing-source',id:label,message:'NASA source URL is missing or not HTTPS'});
  if(typeof moon.dataSource!=='string'||!moon.dataSource.startsWith('https://'))issues.push({code:'missing-physical-source',id:label,message:'Physical-parameter source URL is missing or not HTTPS'});
  if(typeof moon.orbitSource!=='string'||!moon.orbitSource.startsWith('https://'))issues.push({code:'missing-orbit-source',id:label,message:'Orbital-parameter source URL is missing or not HTTPS'});
  if(!planets.some(p=>p.name===moon.planet))issues.push({code:'unknown-parent',id:label,message:'Parent planet is not in supported systems list'});
 }
 const invalidIds=new Set(issues.map(issue=>issue.id));
 return Object.freeze({total:moons.length,valid:Math.max(0,moons.length-invalidIds.size),invalid:invalidIds.size,issues:Object.freeze(issues)});
}
