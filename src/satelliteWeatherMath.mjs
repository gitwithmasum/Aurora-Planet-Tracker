// v4.2 satellite observing conditions. Descriptive thresholds only: never
// present an observing recommendation as a probability or guaranteed sighting.
export const FORECAST_MAX_OFFSET_MS=70*60*1000;
export const WEATHER_MAX_AGE_MS=3*60*60*1000;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const clamp=value=>Math.max(0,Math.min(100,value));

export function normalizeWeatherResponse(raw,{requestedAt=Date.now(),latitude,longitude}={}){
 if(!raw||!Array.isArray(raw.hourly?.time)||!Array.isArray(raw.hourly?.cloud_cover))throw Error('Hourly weather forecast missing');
 const len=raw.hourly.time.length;
 if(!len||len!==raw.hourly.cloud_cover.length)throw Error('Incomplete hourly cloud forecast');
 if(!finite(requestedAt)||!finite(latitude)||!finite(longitude))throw Error('Invalid weather request metadata');
 const items=[];
 for(let i=0;i<len;i++){
  // Open-Meteo requested timezone UTC, timestamps have no explicit offset.
  const time=Date.parse(String(raw.hourly.time[i])+'Z');
  const cloud=raw.hourly.cloud_cover[i];
  if(!finite(time)||!finite(cloud)||cloud<0||cloud>100)continue;
  const rain=raw.hourly.precipitation?.[i];
  const chance=raw.hourly.precipitation_probability?.[i];
  items.push({time,cloudCover:cloud,
   precipitationMm:finite(rain)&&rain>=0?rain:null,
   precipitationProbability:finite(chance)&&chance>=0&&chance<=100?chance:null});
 }
 if(!items.length)throw Error('No usable hourly weather data');
 items.sort((a,b)=>a.time-b.time);
 return {items,requestedAt,latitude,longitude,source:'Open-Meteo model forecast'};
}

export function weatherAtPeak(forecast,time,maxOffset=FORECAST_MAX_OFFSET_MS){
 const ms=time instanceof Date?time.getTime():time;
 if(!finite(ms)||!Array.isArray(forecast?.items))return null;
 let closest=null,delta=Infinity;
 for(const item of forecast.items){
  const gap=Math.abs(ms-item.time);
  if(gap<delta){delta=gap;closest=item;}
 }
 return closest&&delta<=maxOffset?{...closest,offsetMinutes:Math.round(delta/60000)}:null;
}
export function weatherMatchesObserver(forecast,location){
 return !!forecast&&!!location&&
  finite(location.lat)&&finite(location.lon)&&
  Math.abs(forecast.latitude-location.lat)<1e-5&&Math.abs(forecast.longitude-location.lon)<1e-5;
}
export function evaluatePassConditions({pass,illumination,weather=null,forecastStatus='unavailable'}={}){
 const elevation=pass?.maxAltitude;
 const skyDark=illumination?.dark===true;
 const sunlight=illumination?.sunlit===true;
 const cloud=weather?.cloudCover;
 const rain=weather?.precipitationMm;
 const chance=weather?.precipitationProbability;
 if(!finite(elevation)||!illumination||illumination.dark===null||illumination.sunlit===null){
  return {label:'Unknown',level:'unknown',reason:'Orbital or solar geometry unavailable',weatherKnown:!!weather};
 }
 if(!skyDark)return {label:'Sky too bright',level:'limited',reason:'Sun remains above civil-twilight threshold at the pass peak',weatherKnown:!!weather};
 if(!sunlight)return {label:'Earth shadow',level:'limited',reason:'Spacecraft is estimated to be in Earth shadow at pass peak',weatherKnown:!!weather};
 if(elevation<15)return {label:'Low horizon',level:'limited',reason:'Pass peak is close to the horizon; obstacles and haze may interfere',weatherKnown:!!weather};
 if(!weather)return {label:'Geometry favorable',level:'unknown',reason:forecastStatus==='error'?'Weather service unavailable; no cloud assessment':'No time-matched hourly weather forecast; local conditions unknown',weatherKnown:false};
 if((finite(rain)&&rain>=0.3)||(finite(chance)&&chance>=65)){
  return {label:'Rain risk',level:'limited',reason:'Model estimates rain or a high precipitation probability around pass peak',weatherKnown:true};
 }
 if(finite(cloud)&&cloud>=75)return {label:'Cloud limited',level:'limited',reason:'Extensive predicted cloud cover around pass peak',weatherKnown:true};
 if(finite(cloud)&&cloud>=45)return {label:'Mixed conditions',level:'mixed',reason:'Moderate predicted cloud cover; gaps may permit observation',weatherKnown:true};
 if(finite(cloud)&&cloud<45)return {label:'Potential window',level:'potential',reason:'Sunlit geometry, dark observer sky and relatively low forecast cloud cover at pass peak',weatherKnown:true};
 return {label:'Geometry favorable',level:'unknown',reason:'Cloud coverage missing from forecast',weatherKnown:false};
}
export function forecastAgeStatus(forecast,now=Date.now()){
 if(!finite(forecast?.requestedAt)||!finite(now))return 'unavailable';
 if(now-forecast.requestedAt>WEATHER_MAX_AGE_MS)return 'old';
 if(forecast.requestedAt-now>60000)return 'invalid';
 return 'recent';
}
