const GEO_URL='https://geocoding-api.open-meteo.com/v1/search';
const WX_URL='https://api.open-meteo.com/v1/forecast';
export function validCoordinates(lat,lon){return Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lon)&&lon>=-180&&lon<=180}
export function parseCoordinates(lat,lon){const a=Number(String(lat).trim()),b=Number(String(lon).trim());return String(lat).trim()&&String(lon).trim()&&validCoordinates(a,b)?{lat:a,lon:b}:null}
export function normalizePlace(item){
 if(!item||!validCoordinates(item.latitude,item.longitude)||!item.name||!item.country)return null;
 return {id:String(item.id||item.name).slice(0,80),name:String(item.name).slice(0,90),country:String(item.country).slice(0,90),admin:String(item.admin1||'').slice(0,90),lat:item.latitude,lon:item.longitude};
}
export function weatherSummary(row){
 if(!row||!validCoordinates(row.latitude,row.longitude)||!row.current||typeof row.current.time!=='string')return null;
 const days=row.daily||{},daily=Array.isArray(days.time)?days.time.map((date,i)=>({date,maxC:days.temperature_2m_max?.[i],minC:days.temperature_2m_min?.[i],rainMm:days.precipitation_sum?.[i]})).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&[d.maxC,d.minC,d.rainMm].every(Number.isFinite)): [];
 return {time:row.current.time,temperatureC:row.current.temperature_2m,cloudPercent:row.current.cloud_cover,precipitationMm:row.current.precipitation,windKmh:row.current.wind_speed_10m,history:daily.slice(-8)};
}
export async function searchWorldPlaces(text,signal){
 const q=String(text||'').trim();if(q.length<2)return [];
 const url=GEO_URL+'?'+new URLSearchParams({name:q,count:'10',language:'en',format:'json'});
 const response=await fetch(url,{signal});if(!response.ok)throw Error('Global city search unavailable (HTTP '+response.status+')');
 const json=await response.json();return (Array.isArray(json.results)?json.results:[]).map(normalizePlace).filter(Boolean);
}
export async function loadWorldWeather(place,signal){
 if(!validCoordinates(place?.lat,place?.lon))throw Error('Valid coordinates required');
 const p=new URLSearchParams({latitude:String(place.lat),longitude:String(place.lon),current:'temperature_2m,cloud_cover,precipitation,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum',past_days:'7',forecast_days:'1',timezone:'UTC'});
 const response=await fetch(WX_URL+'?'+p,{signal});if(!response.ok)throw Error('Weather service unavailable (HTTP '+response.status+')');
 const parsed=weatherSummary(await response.json());if(!parsed)throw Error('Weather response incomplete');return parsed;
}
