import * as satellite from 'satellite.js';
export const SATELLITE_CATEGORIES=['All','ISS','Tiangong','Hubble','Starlink','NOAA'];
export const DEFAULT_SATELLITES=[
 {id:'iss',name:'International Space Station',category:'ISS',noradId:25544},
 {id:'tiangong',name:'Tiangong — Tianhe',category:'Tiangong',noradId:48274},
 {id:'hubble',name:'Hubble Space Telescope',category:'Hubble',noradId:20580},
 {id:'noaa19',name:'NOAA 19',category:'NOAA',noradId:33591},
 {id:'noaa20',name:'NOAA 20 / JPSS-1',category:'NOAA',noradId:43013}
];
export function validatedSatellite(row,now=Date.now()){
 if(!row||!Number.isInteger(row.noradId)||row.noradId<1||typeof row.line1!=='string'||typeof row.line2!=='string')return null;
 if(row.line1.slice(2,7)!==String(row.noradId).padStart(5,'0')||row.line2.slice(2,7)!==String(row.noradId).padStart(5,'0'))return null;
 const epoch=Date.parse(row.epoch);
 if(!Number.isFinite(epoch)||(now-epoch)/86400000>5||(epoch-now)/86400000>.5)return null;
 try{
  const satrec=satellite.twoline2satrec(row.line1,row.line2);
  if(satrec.error)return null;
  return {...row,satrec};
 }catch{return null}
}
export function satelliteSearch(rows,query='',category='All'){
 const q=query.trim().toLowerCase();
 return rows.filter(r=>(category==='All'||r.category===category)&&(!q||[r.name,r.category,String(r.noradId)].some(s=>s.toLowerCase().includes(q))));
}
export async function loadSatelliteCatalog(){
 const path=(import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/')+'orbital-data/satellites.json';
 const response=await fetch(path,{cache:'no-store'});
 if(!response.ok)throw Error('Satellite catalog HTTP '+response.status);
 const json=await response.json();
 if(!Array.isArray(json.satellites))throw Error('Invalid satellite catalog format');
 const rows=json.satellites.map(row=>validatedSatellite(row)).filter(Boolean);
 if(!rows.length)throw Error('No recent valid orbit records. Update orbital catalog.');
 return {rows,fetchedAt:json.fetchedAt,source:json.source};
}
