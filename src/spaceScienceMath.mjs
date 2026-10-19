// v4.0 — astronomy data-quality descriptors. These are metadata assessments,
// NOT probabilistic position errors and never imply real spacecraft telemetry.
const finitePositive=value=>Number.isFinite(value)&&value>0;
export function assessTle(row,at=Date.now()){
 const time=at instanceof Date?at.getTime():at;
 const epoch=Date.parse(row?.epoch??'');
 const satrec=row?.satrec;
 if(!Number.isFinite(time)||!Number.isFinite(epoch)||!satrec||!finitePositive(satrec.no)){
  return {status:'unavailable',ageHours:null,epoch:null,periodMinutes:null,meanMotionRevDay:null,inclinationDeg:null,eccentricity:null};
 }
 const ageHours=(time-epoch)/3600000;
 const periodMinutes=2*Math.PI/satrec.no;
 const inc=Number.isFinite(satrec.inclo)?satrec.inclo*180/Math.PI:null;
 const ecc=Number.isFinite(satrec.ecco)&&satrec.ecco>=0&&satrec.ecco<1?satrec.ecco:null;
 const status=ageHours < -1?'future':ageHours>72?'aging':ageHours>24?'monitor':'recent';
 return {status,ageHours,epoch:new Date(epoch).toISOString(),
  periodMinutes:finitePositive(periodMinutes)?periodMinutes:null,
  meanMotionRevDay:finitePositive(periodMinutes)?1440/periodMinutes:null,
  inclinationDeg:inc,eccentricity:ecc};
}
export function summarizeOrbitCatalog(rows,at=Date.now()){
 const list=Array.isArray(rows)?rows:[];
 const quality=list.map(item=>assessTle(item,at));
 const ages=quality.map(x=>x.ageHours).filter(Number.isFinite);
 return {
  count:list.length,
  recent:quality.filter(q=>q.status==='recent').length,
  monitor:quality.filter(q=>q.status==='monitor').length,
  aging:quality.filter(q=>q.status==='aging').length,
  oldestHours:ages.length?Math.max(...ages):null,
  newestHours:ages.length?Math.min(...ages):null
 };
}
export function safeObserver(location){
 const lat=Number(location?.lat),lon=Number(location?.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180||location?.lat===null||location?.lon===null)return null;
 return {lat,lon};
}
export function displayTleStatus(status){
 return {recent:'Recent elements',monitor:'Monitor freshness',aging:'Aging elements',future:'Future epoch — check source',unavailable:'Elements unavailable'}[status]||'Elements unavailable';
}
