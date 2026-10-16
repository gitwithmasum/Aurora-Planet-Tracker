import React,{useEffect,useMemo,useState} from 'react';
import {MapPin,Search,Cloud,CloudRain,Wind,RefreshCw} from 'lucide-react';
import {loadLocationInsights,searchCities,locationCountries,cityInsights} from './earthLocationInsights.mjs';
import './EarthLocationIntelligence.css';
const fmt=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'—';
function WeatherTrend({history}){
 const ranges=history.map(h=>({date:h.date,mid:(h.minC+h.maxC)/2,max:h.maxC,min:h.minC,rain:h.rainMm}));
 const low=Math.min(...ranges.map(x=>x.min))-2,high=Math.max(...ranges.map(x=>x.max))+2;
 const scale=v=>100-((v-low)/Math.max(1,high-low))*84-8;
 const points=ranges.map((d,i)=>[(i/(ranges.length-1))*100,scale(d.mid)]);
 return <div className="earthIntelligenceChart">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Historical daily mean temperature trend, calculated from daily minimum and maximum">
    <path d={'M '+points.map(p=>p.join(' ')).join(' L ')} fill="none" stroke="#8beaf7" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>
    {points.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill="#b4f6f8" vectorEffect="non-scaling-stroke"/>)}
  </svg>
  <div className="earthIntelligenceChartLabels"><span>{history[0]?.date}</span><span>DAILY MIDPOINT · °C</span><span>{history[history.length-1]?.date}</span></div>
 </div>;
}
export default function EarthLocationIntelligence({onFocus,onClearFocus,focusedName}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[country,setCountry]=useState('All'),[selected,setSelected]=useState('Dhaka');
 const [busy,setBusy]=useState(true),[compare,setCompare]=useState(false),[second,setSecond]=useState('Tokyo');
 async function reload(){setBusy(true);setError('');try{setData(await loadLocationInsights())}catch(e){setError(e.message||'Location data unavailable')}finally{setBusy(false)}}
 useEffect(()=>{reload()},[]);
 const rows=data?.locations||[];
 const countries=useMemo(()=>locationCountries(rows),[data]);
 const filtered=useMemo(()=>searchCities(rows,query,country),[data,query,country]);
 const target=rows.find(x=>x.name===selected)||null;
 const other=rows.find(x=>x.name===second)||null;
 const insight=cityInsights(target),alt=cityInsights(other);
 function choose(row){setSelected(row.name);onFocus(row)}
 return <section className="earthIntelligence" aria-label="Earth location intelligence">
  <header><div><span className="eyebrow">AURORA / v3.5 / EARTH INTELLIGENCE</span><h4><MapPin size={22}/> Location & Weather Intelligence</h4><p>Search curated locations, focus the 3D globe and compare timestamped weather estimates from Open-Meteo.</p></div><button type="button" onClick={reload} disabled={busy}><RefreshCw size={15}/> {busy?'LOADING':'REFRESH'}</button></header>
  <div className="earthIntelligenceSearch">
   <label><Search size={15}/> SEARCH CITY / COUNTRY <input aria-label="Search Earth cities" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Dhaka, Tokyo, Bangladesh…"/></label>
   <label>COUNTRY FILTER <select aria-label="Filter Earth country" value={country} onChange={e=>setCountry(e.target.value)}>{countries.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
   <span>{filtered.length} curated locations</span>
  </div>
  {error&&<div className="earthIntelligenceError" role="alert">{error}. Other Earth Observation features remain available.</div>}
  <div className="earthIntelligenceCities">{filtered.slice(0,50).map(row=><button key={row.name} className={selected===row.name?'active':''} type="button" onClick={()=>choose(row)}><strong>{row.name}</strong><small>{row.country}</small></button>)}{!filtered.length&&!busy&&<p>No city matched. Search among supported curated locations; worldwide geocoding is not enabled.</p>}</div>
  {target&&insight&&<div className="earthIntelligenceDetails">
   <div className="earthIntelligenceSelected"><div><span>SELECTED OBSERVATION POINT</span><strong>{target.name}, {target.country}</strong><small>{target.lat.toFixed(2)}° N/S · {target.lon.toFixed(2)}° E/W</small><small>Data time: {new Date(target.observedAt).toLocaleString()}</small></div><div className="earthIntelligenceFocus"><button type="button" onClick={()=>onFocus(target)}>FOCUS EARTH ON {target.name.toUpperCase()}</button>{focusedName===target.name&&<button type="button" onClick={onClearFocus}>EXIT CITY FOCUS</button>}</div></div>
   <div className="earthIntelligenceMetrics">
    <div><Cloud size={16}/><small>TEMPERATURE</small><strong>{fmt(target.temperatureC)}°C</strong></div>
    <div><Cloud size={16}/><small>CLOUD COVERAGE</small><strong>{fmt(target.cloudPercent,0)}%</strong></div>
    <div><CloudRain size={16}/><small>PRECIPITATION</small><strong>{fmt(target.precipitationMm)} mm</strong></div>
    <div><Wind size={16}/><small>WIND SPEED</small><strong>{fmt(target.windKmh)} km/h</strong></div>
   </div>
   <p className="earthIntelligenceInsight"><strong>WEATHER INSIGHT:</strong> {insight.cloudLabel}; {insight.rainLabel.toLowerCase()}. Recent daily-midpoint mean {fmt(insight.averageC)}°C, 7-day precipitation sum {fmt(insight.totalRainMm)} mm. Current temperature is {fmt(Math.abs(insight.temperatureDeviationC))}°C {insight.temperatureDeviationC>=0?'above':'below'} the recent daily-midpoint mean; this is a descriptive comparison, not a forecast.</p>
   <div className="earthIntelligenceHistory"><div><h5>RECENT WEATHER HISTORY</h5><p>Last seven available daily model-based estimates; ranges represent daily min/max air temperature.</p></div><WeatherTrend history={insight.history}/><div className="earthIntelligenceTable"><table><thead><tr><th>DAY (UTC)</th><th>MIN</th><th>MAX</th><th>RAIN</th></tr></thead><tbody>{insight.history.map(day=><tr key={day.date}><td>{day.date}</td><td>{fmt(day.minC)}°C</td><td>{fmt(day.maxC)}°C</td><td>{fmt(day.rainMm)} mm</td></tr>)}</tbody></table></div></div>
   <div className="earthIntelligenceCompare"><label><input type="checkbox" aria-label="Compare city weather history" checked={compare} onChange={e=>setCompare(e.target.checked)}/> COMPARE WITH ANOTHER CITY</label>{compare&&<><select aria-label="Comparison Earth city" value={second} onChange={e=>setSecond(e.target.value)}>{rows.map(x=><option key={x.name} value={x.name}>{x.name}, {x.country}</option>)}</select>{other&&alt&&<div className="earthIntelligenceTwoCities"><div><strong>{target.name}</strong><span>7-day avg {fmt(insight.averageC)}°C</span><span>Rain {fmt(insight.totalRainMm)} mm</span></div><div><strong>{other.name}</strong><span>7-day avg {fmt(alt.averageC)}°C</span><span>Rain {fmt(alt.totalRainMm)} mm</span></div></div>}</>}</div>
  </div>}
  <p className="earthIntelligenceSource">Source: <a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener noreferrer">Open-Meteo weather API</a>. Historical comparison covers recent model/analysis-derived daily values, not guaranteed station observations. Refresh job runs around every 4 hours, subject to upstream availability. No precise device location is requested or uploaded. Locations are curated and limited.</p>
 </section>;
}
