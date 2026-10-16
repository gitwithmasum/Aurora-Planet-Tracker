import {satelliteTelemetry} from './satelliteOrbit.mjs';
export const HISTORY_KEY='aurora-orbital-observations-v1';
export const MAX_OBSERVATIONS=150;
export function comparisonRows(catalog,date,limit=3){
 if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return [];
 return catalog.slice(0,limit).map(item=>{
  const telemetry=satelliteTelemetry(item.satrec,date);
  return {id:item.id,noradId:item.noradId,name:item.name,category:item.category,telemetry};
 });
}
export function normalizeObservation(record){
 if(!record||!Number.isInteger(record.noradId)||!Number.isFinite(record.latitude)||!Number.isFinite(record.longitude)||!Number.isFinite(record.altitudeKm)||!Number.isFinite(Date.parse(record.observedAt)))return null;
 const note=String(record.note||'').trim().slice(0,240);
 return {id:String(record.id||record.noradId+'-'+Date.parse(record.observedAt)).slice(0,90),noradId:record.noradId,name:String(record.name||'Satellite').slice(0,100),observedAt:new Date(record.observedAt).toISOString(),latitude:record.latitude,longitude:record.longitude,altitudeKm:record.altitudeKm,note};
}
export function appendObservation(history,record){
 const clean=normalizeObservation(record);
 return clean?[clean,...history.filter(x=>x.id!==clean.id)].slice(0,MAX_OBSERVATIONS):history.slice(0,MAX_OBSERVATIONS);
}
export function createObservation(item,telemetry,now=Date.now(),note=''){
 if(!item||!telemetry||!Number.isFinite(telemetry.latitude)||!Number.isFinite(telemetry.altitudeKm))return null;
 return normalizeObservation({id:item.noradId+'-'+now,noradId:item.noradId,name:item.name,observedAt:new Date(now).toISOString(),latitude:telemetry.latitude,longitude:telemetry.longitude,altitudeKm:telemetry.altitudeKm,note});
}
export function catalogHealth(catalog,now=Date.now()){
 const ages=catalog.map(x=>Date.parse(x.epoch)).filter(Number.isFinite).map(x=>(now-x)/3600000);
 return {total:catalog.length,oldestHours:ages.length?Math.max(...ages):null,newestHours:ages.length?Math.min(...ages):null};
}
