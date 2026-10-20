// Aurora Moonverse v5.2 — validated Horizons snapshots. No browser request to JPL.
// JPL SSD Fair Use: one serial server-side request at a time; never embed the API.
// UTC samples in ICRF, center at each named parent planet, geometric KM-S vectors.
export const HORIZONS_FORMAT='aurora-horizons-v1';
export const HORIZONS_PATH='orbital-data/horizons-v5.2.json';
export const HORIZONS_SOURCE='https://ssd.jpl.nasa.gov/api/horizons.api';
export const HORIZONS_STEP_MS=60*60*1000;
export const HORIZONS_MAX_INTERPOLATION_MS=HORIZONS_STEP_MS;
export const HORIZONS_BODIES=Object.freeze([
 {id:'moon',naif:301,center:399,planet:'Earth'},
 {id:'phobos',naif:401,center:499,planet:'Mars'},
 {id:'deimos',naif:402,center:499,planet:'Mars'},
 {id:'io',naif:501,center:599,planet:'Jupiter'},
 {id:'europa',naif:502,center:599,planet:'Jupiter'},
 {id:'ganymede',naif:503,center:599,planet:'Jupiter'},
 {id:'callisto',naif:504,center:599,planet:'Jupiter'},
 {id:'enceladus',naif:602,center:699,planet:'Saturn'},
 {id:'titan',naif:606,center:699,planet:'Saturn'},
 {id:'triton',naif:801,center:899,planet:'Neptune'},
 {id:'charon',naif:901,center:999,planet:'Pluto'}
]);
const MAX_R=8e7;
const validVector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<MAX_R);
export function parseHorizonsVectorText(text){
 if(typeof text!=='string'||text.length>4_000_000)throw Error('Unacceptable Horizons response length');
 const from=text.indexOf('$$SOE'),to=text.indexOf('$$EOE');
 if(from<0||to<=from)throw Error('Horizons ephemeris markers missing');
 const rows=[];
 for(const line of text.slice(from+5,to).split(/\r?\n/)){
  if(!line.trim()||!/^\s*\d/.test(line))continue;
  const parts=line.split(',').map(x=>x.trim()).filter(Boolean);
  if(parts.length<8)throw Error('Horizons vector row incomplete');
  const jd=Number(parts[0]),v=parts.slice(2,8).map(Number);
  if(!Number.isFinite(jd)||jd<2_400_000||jd>2_900_000||v.some(x=>!Number.isFinite(x)))throw Error('Horizons vector row invalid');
  const timeMs=Math.round((jd-2440587.5)*86400000);
  const pos=v.slice(0,3),velocity=v.slice(3,6);
  if(!validVector(pos)||!velocity.every(n=>Math.abs(n)<500))throw Error('Horizons state outside safe bounds');
  if(rows.length&&timeMs<=rows.at(-1)[0])throw Error('Horizons timestamps out of order');
  rows.push([timeMs,pos,velocity]);
 }
 if(rows.length<2||rows.length>300)throw Error('No usable vector time series');
 return rows;
}
export function validateHorizonsSnapshot(payload,{now=Date.now()}={}){
 if(!payload||payload.format!==HORIZONS_FORMAT||payload.schema!==1||payload.frame!=='ICRF'||payload.timeScale!=='UTC'||payload.units!=='km'||payload.stepMinutes!==60)return {valid:false,reason:'Unexpected snapshot metadata'};
 if(!payload.targets||typeof payload.targets!=='object'||Array.isArray(payload.targets))return {valid:false,reason:'Missing ephemeris data'};
 const created=Date.parse(payload.createdAt);
 if(!Number.isFinite(created)||created>now+600000||now-created>72*3600000)return {valid:false,reason:'Snapshot missing or stale (>72h)'};
 let count=0;
 for(const [id,obj] of Object.entries(payload.targets)){
  const canonical=HORIZONS_BODIES.find(x=>x.id===id);
  if(!canonical||!obj||obj.naif!==canonical.naif||obj.center!==canonical.center||obj.frame!=='ICRF'||!Array.isArray(obj.rows)||obj.rows.length<2||obj.rows.length>300)return {valid:false,reason:'Invalid ephemeris target '+id};
  if(obj.rows.some((r,i)=>!Array.isArray(r)||r.length!==3||!Number.isFinite(r[0])||!validVector(r[1])||!validVector(r[2])||r[2].some(v=>Math.abs(v)>500)||(i>0&&r[0]<=obj.rows[i-1][0])))return {valid:false,reason:'Corrupt ephemeris samples '+id};
  count++;
 }
 return count?{valid:true,count,createdAt:payload.createdAt,targets:count}:{valid:false,reason:'No verified Horizons samples available'};
}
export function interpolateHorizons(snapshot,id,atMs){
 if(!snapshot?.targets?.[id]||!Number.isFinite(atMs))return null;
 const record=snapshot.targets[id],rows=record.rows;
 if(!rows?.length||atMs<rows[0][0]||atMs>rows.at(-1)[0])return null;
 let low=0,high=rows.length-1;
 while(low<high){const mid=Math.floor((low+high)/2);if(rows[mid][0]<atMs)low=mid+1;else high=mid}
 if(rows[low][0]===atMs)return {timeMs:atMs,positionKm:rows[low][1],velocityKmS:rows[low][2],sampled:true,center:record.center,naif:record.naif};
 if(!low)return null;
 const a=rows[low-1],b=rows[low],dt=b[0]-a[0];
 if(dt<1||dt>HORIZONS_MAX_INTERPOLATION_MS+3000)return null;
 const ratio=(atMs-a[0])/dt;
 const blend=(x,y)=>x.map((v,i)=>v+(y[i]-v)*ratio);
 return {timeMs:atMs,positionKm:blend(a[1],b[1]),velocityKmS:blend(a[2],b[2]),sampled:false,interpolationMinutes:dt/60000,center:record.center,naif:record.naif};
}
export function horizonsDistanceKm(state){return state?Math.hypot(...state.positionKm):null}
export function horizonDisplayPosition(state){
 if(!state)return null;
 const r=horizonsDistanceKm(state);
 if(!Number.isFinite(r)||r<=0)return null;
 // Camera distance intentionally logarithmically compressed, direction remains ICRF.
 const displayR=Math.min(9,Math.max(2,1.8+Math.log10(Math.max(r,1000)/2000)*1.85));
 const scale=displayR/r;
 return [state.positionKm[0]*scale,state.positionKm[2]*scale,-state.positionKm[1]*scale];
}
export function horizonTrail(record,{atMs,points=80}={}){
 if(!record||!Array.isArray(record.rows)||!Number.isFinite(atMs))return [];
 const filtered=record.rows.filter(r=>Math.abs(r[0]-atMs)<=36*3600000).slice(-points);
 return filtered.map(r=>horizonDisplayPosition({positionKm:r[1]})).filter(Boolean);
}
