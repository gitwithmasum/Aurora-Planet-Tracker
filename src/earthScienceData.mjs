export const EARTH_LAYERS=[
 {id:'cloud',label:'Cloud coverage',unit:'%',source:'Open-Meteo'},
 {id:'temperature',label:'2m temperature',unit:'°C',source:'Open-Meteo'},
 {id:'precipitation',label:'Precipitation',unit:'mm',source:'Open-Meteo'},
 {id:'events',label:'NASA Earth events',unit:'events',source:'NASA EONET'}
];
export function validWeatherPoint(p){
 return p&&typeof p.name==='string'&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180&&
 Number.isFinite(p.temperatureC)&&p.temperatureC>=-100&&p.temperatureC<=65&&Number.isFinite(p.cloudPercent)&&p.cloudPercent>=0&&p.cloudPercent<=100&&
 Number.isFinite(p.precipitationMm)&&p.precipitationMm>=0&&Number.isFinite(Date.parse(p.observedAt));
}
export function validEarthEvent(e){
 return e&&typeof e.id==='string'&&typeof e.title==='string'&&Number.isFinite(e.lat)&&Math.abs(e.lat)<=90&&Number.isFinite(e.lon)&&Math.abs(e.lon)<=180&&Number.isFinite(Date.parse(e.date));
}
export function markerColor(layer,p){
 if(layer==='cloud'){const c=Math.round(55+Math.min(100,Math.max(0,p.cloudPercent))*2);return 'rgb('+c+','+c+',255)'}
 if(layer==='temperature')return p.temperatureC>=30?'#ff694f':p.temperatureC>=15?'#ffc16a':p.temperatureC>=0?'#9be5fb':'#4f8dff';
 if(layer==='precipitation')return p.precipitationMm>=5?'#eb7cff':p.precipitationMm>=1?'#688cff':'#65d2df';
 return '#ffd07a';
}
export function layerValue(layer,p){
 if(layer==='cloud')return p.cloudPercent+'% cloud';
 if(layer==='temperature')return p.temperatureC.toFixed(1)+'°C';
 if(layer==='precipitation')return p.precipitationMm.toFixed(1)+' mm';
 return '';
}
export function ageHours(time,now=Date.now()){
 const date=Date.parse(time);return Number.isFinite(date)?Math.max(0,(now-date)/3600000):Infinity;
}
export async function loadEarthScienceData(){
 const url=(import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/')+'earth-data/summary.json';
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error('Earth science data HTTP '+response.status);
 const json=await response.json();
 const weatherSamples=Array.isArray(json.weatherSamples)?json.weatherSamples.filter(validWeatherPoint).slice(0,60):[];
 const events=Array.isArray(json.events)?json.events.filter(validEarthEvent).slice(0,30):[];
 if(!weatherSamples.length&&!events.length)throw Error('Earth science dataset is empty or invalid');
 return {weatherSamples,events,fetchedAt:json.fetchedAt,errors:Array.isArray(json.errors)?json.errors:[]};
}
