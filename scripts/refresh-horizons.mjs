// Server-side only. JPL SSD policy prohibits embedding Horizons API in a
// website; one request at a time. This generator runs in GitHub Pages CI.
// Avoid committing fabricated ephemerides. Keep previous valid snapshot on
// transient errors only if it remains current; otherwise publish empty state.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {HORIZONS_BODIES,HORIZONS_FORMAT,HORIZONS_SOURCE,parseHorizonsVectorText,validateHorizonsSnapshot} from '../src/horizonsCore.mjs';
const dest='public/orbital-data/horizons-v5.2.json';
const makeEmpty=()=>({format:HORIZONS_FORMAT,schema:1,createdAt:null,frame:'ICRF',timeScale:'UTC',units:'km',stepMinutes:60,source:HORIZONS_SOURCE,
 disclaimer:'No actual JPL Horizons ephemeris has been fetched; Moonverse will use educational model.',targets:{}});
const previous=(()=>{try{return JSON.parse(readFileSync(dest,'utf8'))}catch{return makeEmpty()}})();
const iso=stamp=>new Date(stamp).toISOString().slice(0,16).replace('T',' ');
const quoted=value=>"'"+value+"'";
function query(body,start,stop){
 const p=new URLSearchParams({
  format:'json',COMMAND:quoted(body.naif),OBJ_DATA:quoted('NO'),MAKE_EPHEM:quoted('YES'),
  EPHEM_TYPE:quoted('VECTORS'),CENTER:quoted('500@'+body.center),
  START_TIME:quoted(iso(start)),STOP_TIME:quoted(iso(stop)),STEP_SIZE:quoted('60 min'),
  OUT_UNITS:quoted('KM-S'),REF_SYSTEM:quoted('ICRF'),REF_PLANE:quoted('FRAME'),
  TIME_TYPE:quoted('UT'),VEC_CORR:quoted('NONE'),VEC_TABLE:quoted('2'),
  VEC_LABELS:quoted('NO'),CSV_FORMAT:quoted('YES')
 });
 return HORIZONS_SOURCE+'?'+p;
}
async function get(body,start,stop){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(query(body,start,stop),{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'Aurora-Planet-Tracker-Horizons-Snapshot/5.2 (public educational application)'}});
  if(!response.ok)throw Error('Horizons HTTP '+response.status);
  const json=await response.json();
  if(json.error)throw Error('Horizons returned error');
  if(typeof json.signature?.version!=='string'||!json.signature.version.startsWith('1.')||!String(json.signature?.source||'').includes('Horizons'))throw Error('Unrecognized Horizons API signature/version');
  const rows=parseHorizonsVectorText(json.result);
  return {naif:body.naif,center:body.center,frame:'ICRF',rows};
 }finally{clearTimeout(timeout)}
}
async function main(){
 const now=Date.now();
 const start=Math.floor((now-4*3600000)/3600000)*3600000;
 const stop=start+52*3600000;
 const targets={};let errors=[];
 // Serial only. Do not use Promise.all or run this in parallel workflows.
 for(const body of HORIZONS_BODIES){
  try{
   targets[body.id]=await get(body,start,stop);
   console.log('JPL verified '+body.id+' '+targets[body.id].rows.length+' vector rows');
  }catch(error){
   errors.push(body.id+': '+String(error?.message||error));
   console.warn('Unavailable Horizons target '+body.id+'; will not synthesize vectors');
  }
  await new Promise(resolve=>setTimeout(resolve,1250));
 }
 let snapshot={...makeEmpty(),createdAt:new Date().toISOString(),targets};
 let result=validateHorizonsSnapshot(snapshot);
 if(!result.valid){
  const previousOk=validateHorizonsSnapshot(previous);
  if(previousOk.valid){snapshot=previous;result=previousOk}
  else{snapshot=makeEmpty();result={valid:false,count:0}}
 }
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,JSON.stringify(snapshot)+'\n');
 console.log('Horizons refresh: '+Object.keys(snapshot.targets).length+' verified targets; '+errors.length+' errors');
 if(errors.length)console.warn(errors.join('; '));
 console.log('Valid fresh snapshot: '+!!result.valid);
}
await main();
