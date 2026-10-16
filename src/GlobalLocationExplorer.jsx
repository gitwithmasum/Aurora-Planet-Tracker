import React,{useEffect,useState} from 'react';
import {Globe2,Search,MapPin,LocateFixed} from 'lucide-react';
import {searchWorldPlaces,loadWorldWeather,parseCoordinates} from './globalEarthLocation.mjs';
import './GlobalLocationExplorer.css';
const fmt=(x,n=1)=>Number.isFinite(x)?x.toFixed(n):'—';
export default function GlobalLocationExplorer({onFocus,onClearFocus,focusedName}){
 const [query,setQuery]=useState(''),[suggestions,setSuggestions]=useState([]),[searching,setSearching]=useState(false),[error,setError]=useState('');
 const [latitude,setLatitude]=useState(''),[longitude,setLongitude]=useState(''),[place,setPlace]=useState(null);
 const [weather,setWeather]=useState(null),[weatherError,setWeatherError]=useState(''),[weatherLoading,setWeatherLoading]=useState(false);
 useEffect(()=>{
  const q=query.trim();if(q.length<2){setSuggestions([]);setSearching(false);return}
  const ctrl=new AbortController();
  const timeout=setTimeout(async()=>{
   setSearching(true);setError('');
   try{const results=await searchWorldPlaces(q,ctrl.signal);if(!ctrl.signal.aborted)setSuggestions(results)}
   catch(e){if(!ctrl.signal.aborted)setError('Global search currently unavailable. Manual coordinates still work. '+e.message)}
   finally{if(!ctrl.signal.aborted)setSearching(false)}
  },400);
  return()=>{clearTimeout(timeout);ctrl.abort()};
 },[query]);
 useEffect(()=>{
  if(!place){setWeather(null);setWeatherError('');return}
  const ctrl=new AbortController();setWeatherLoading(true);setWeatherError('');setWeather(null);
  loadWorldWeather(place,ctrl.signal).then(x=>{if(!ctrl.signal.aborted)setWeather(x)}).catch(e=>{if(!ctrl.signal.aborted)setWeatherError('Weather is unavailable for this location: '+e.message)}).finally(()=>{if(!ctrl.signal.aborted)setWeatherLoading(false)});
  return()=>ctrl.abort();
 },[place]);
 function select(p){setPlace(p);setLatitude(String(p.lat));setLongitude(String(p.lon));onFocus(p)}
 function manual(e){
  e.preventDefault();const coords=parseCoordinates(latitude,longitude);
  if(!coords){setError('Enter valid latitude (−90 to 90) and longitude (−180 to 180).');return}
  setError('');const p={...coords,name:'Custom coordinates',country:'World',id:'custom'};setPlace(p);onFocus(p);
 }
 const history=weather?.history||[];
 return <section className="globalEarth" aria-label="Global Location Explorer">
  <header><div><span className="eyebrow">AURORA / v3.6 / GLOBAL EARTH</span><h4><Globe2 size={22}/> Global Location Explorer</h4><p>Search worldwide cities, states and countries, or enter exact geographic coordinates. Choose a result to focus the Earth globe.</p></div><span className="globalEarthTag">ON-DEMAND WORLD SEARCH</span></header>
  <div className="globalEarthSearch"><label><Search size={15}/> WORLDWIDE PLACE SEARCH<input aria-label="Search worldwide cities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g., Kyoto, Brazil, Chittagong, Nairobi…" autoComplete="off"/></label><span>{searching?'SEARCHING WORLD INDEX…':query.trim().length>=2?suggestions.length+' MATCHES':'TYPE AT LEAST 2 CHARACTERS'}</span></div>
  {suggestions.length>0&&<div className="globalEarthResults" aria-label="Worldwide place results">{suggestions.map((p,i)=><button type="button" key={p.id+'-'+i} onClick={()=>select(p)}><MapPin size={15}/><span><strong>{p.name}</strong><small>{[p.admin,p.country].filter(Boolean).join(', ')}</small></span><small>{fmt(p.lat,2)}°, {fmt(p.lon,2)}°</small></button>)}</div>}
  {query.trim().length>=2&&!searching&&!suggestions.length&&!error&&<p className="globalEarthEmpty">No matching places returned. Try another spelling or use coordinates.</p>}
  <form className="globalEarthCoordinates" onSubmit={manual}><label>LATITUDE<input aria-label="Global Earth latitude" type="number" min="-90" max="90" step="any" value={latitude} onChange={e=>setLatitude(e.target.value)} placeholder="23.8103" required/></label><label>LONGITUDE<input aria-label="Global Earth longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={e=>setLongitude(e.target.value)} placeholder="90.4125" required/></label><button type="submit"><LocateFixed size={15}/> FOCUS COORDINATES</button></form>
  {error&&<p className="globalEarthWarning" role="alert">{error}</p>}
  {place&&<div className="globalEarthDetails"><div className="globalEarthChosen"><div><span>WORLD OBSERVATION LOCATION</span><strong>{place.name}{place.country&&place.country!=='World'?', '+place.country:''}</strong><small>{fmt(place.lat,4)}° latitude · {fmt(place.lon,4)}° longitude</small></div><div className="globalEarthActions"><button type="button" onClick={()=>onFocus(place)}>FOCUS EARTH</button>{focusedName===place.name&&<button type="button" onClick={onClearFocus}>EXIT FOCUS</button>}</div></div>
   {weatherLoading&&<p role="status">Loading model-based weather at selected coordinates…</p>}
   {weatherError&&<p className="globalEarthWarning" role="alert">{weatherError}</p>}
   {weather&&<><div className="globalEarthMetrics"><div><small>TEMPERATURE</small><strong>{fmt(weather.temperatureC)}°C</strong></div><div><small>CLOUD COVER</small><strong>{fmt(weather.cloudPercent,0)}%</strong></div><div><small>PRECIPITATION</small><strong>{fmt(weather.precipitationMm)} mm</strong></div><div><small>WIND</small><strong>{fmt(weather.windKmh)} km/h</strong></div></div><p>Source time (UTC): {weather.time} · Model estimates, not station measurements.</p>
    <div className="globalEarthHistory"><h5>Daily weather history — temperature & precipitation</h5><div className="globalEarthBars" aria-label="Daily high temperature history">{history.map(d=><div key={d.date} className="globalEarthBar"><strong>{fmt(d.maxC,0)}°</strong><div style={{height:Math.max(8,Math.min(100,(d.maxC+20)/.8))+'%'}} title={d.date+' high '+fmt(d.maxC)+'°C'}></div><small>{d.date.slice(5)}</small></div>)}</div><div className="globalEarthHistoryTable"><table><thead><tr><th>DAY</th><th>MIN</th><th>MAX</th><th>RAIN</th></tr></thead><tbody>{history.map(d=><tr key={d.date}><td>{d.date}</td><td>{fmt(d.minC)}°C</td><td>{fmt(d.maxC)}°C</td><td>{fmt(d.rainMm)} mm</td></tr>)}</tbody></table></div></div>
   </>}
  </div>}
  <p className="globalEarthSource">Geocoding & weather source: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. Search calls a third-party public geocoding service when you type; names typed and coordinates selected are sent to that service to provide search and weather estimates. No GPS permission is requested. Weather may fail independently without affecting the 3D Earth focus.</p>
 </section>;
}
