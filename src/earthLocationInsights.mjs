export function validCity(row){
 if(!row||typeof row.name!=='string'||typeof row.country!=='string'||!Number.isFinite(row.lat)||Math.abs(row.lat)>90||!Number.isFinite(row.lon)||Math.abs(row.lon)>180)return false;
 if(!Number.isFinite(row.temperatureC)||row.temperatureC<-100||row.temperatureC>65||!Number.isFinite(row.cloudPercent)||row.cloudPercent<0||row.cloudPercent>100||!Number.isFinite(Date.parse(row.observedAt)))return false;
 return Array.isArray(row.history)&&row.history.length>=2&&row.history.every(h=>/^\d{4}-\d{2}-\d{2}$/.test(h.date)&&Number.isFinite(h.maxC)&&Number.isFinite(h.minC)&&Number.isFinite(h.rainMm)&&h.rainMm>=0);
}
export function searchCities(locations,query='',country='All'){
 const q=query.trim().toLowerCase();
 return locations.filter(row=>(country==='All'||row.country===country)&&(!q||(row.name+' '+row.country).toLowerCase().includes(q)));
}
export function locationCountries(locations){return ['All',...new Set(locations.map(x=>x.country))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b))}
export function cityInsights(row){
 if(!row)return null;
 const history=row.history.slice(-7);
 const avg=history.reduce((sum,x)=>sum+(x.maxC+x.minC)/2,0)/history.length;
 const rainfall=history.reduce((sum,x)=>sum+x.rainMm,0);
 const max=Math.max(...history.map(x=>x.maxC));
 const min=Math.min(...history.map(x=>x.minC));
 const tempDelta=row.temperatureC-avg;
 return {averageC:avg,totalRainMm:rainfall,highestC:max,lowestC:min,temperatureDeviationC:tempDelta,
  cloudLabel:row.cloudPercent>=75?'Mostly cloudy':row.cloudPercent>=30?'Partly cloudy':'Mostly clear',
  rainLabel:row.precipitationMm>0?'Precipitation estimated':'No current precipitation reported',
  history};
}
export async function loadLocationInsights(){
 const base=import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/';
 const response=await fetch(base+'earth-data/locations.json',{cache:'no-store'});
 if(!response.ok)throw Error('Location weather data HTTP '+response.status);
 const json=await response.json();
 const locations=Array.isArray(json.locations)?json.locations.filter(validCity).slice(0,100):[];
 if(!locations.length)throw Error('No validated location weather history available');
 return {locations,fetchedAt:json.fetchedAt,sourceUrl:'https://open-meteo.com/en/docs'};
}
