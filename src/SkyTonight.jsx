import React,{useEffect,useMemo,useState} from 'react';
import {Satellite,Sun,Moon,LocateFixed,Compass,Clock3,RefreshCcw,Eye} from 'lucide-react';
import {useLanguage} from './i18n.jsx';
import {skySummary,upcomingSunEvents,predictIssPasses,direction,bodyPosition} from './skyTonightMath.mjs';
import {fetchIssOrbit} from './issOrbitSource.mjs';
import './SkyTonight.css';
import SatellitePassAlert from './SatellitePassAlert.jsx';
import {assessIssPass,cloudLabel,analyzeFullIssPass,cloudForecastAt} from './issVisibility.mjs';
const ENDPOINT='https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const fixed=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const clock=(date)=>date?date.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const twilightLabel=(name,evening)=>evening?name+' begins':name+' ends';
export default function SkyTonight({location,onLocation,onOpenSky,passAlert}){
 const {language}=useLanguage(),bn=language==='bn';
 const [now,setNow]=useState(()=>new Date());
 const [tle,setTle]=useState(null),[issState,setIssState]=useState('idle'),[issError,setIssError]=useState('');
 const [gpsError,setGpsError]=useState(''),[onlyAbove,setOnlyAbove]=useState(true);
 const [weather,setWeather]=useState(null),[weatherState,setWeatherState]=useState('idle'),[weatherError,setWeatherError]=useState('');
 const [expandedPass,setExpandedPass]=useState(null);
 useEffect(()=>{const id=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(id)},[]);
 async function refreshISS(){
  setIssState('loading');setIssError('');
  try{
   const parsed=await fetchIssOrbit();
   setTle({satrec:parsed.satrec,epoch:parsed.epoch,fetched:new Date()});setIssState('ready');
  }catch(e){setTle(null);setIssState('error');setIssError(e.message||'Live orbital data unavailable.')}
 }
 useEffect(()=>{refreshISS();const id=setInterval(refreshISS,3*3600000);return()=>clearInterval(id)},[]);
 const summary=useMemo(()=>skySummary(now,location.lat,location.lon),[now,location.lat,location.lon]);
 const events=useMemo(()=>upcomingSunEvents(now,location.lat,location.lon,24),[now,location.lat,location.lon]);
 const passes=useMemo(()=>tle?predictIssPasses(tle.satrec,now,location.lat,location.lon,24,10):[],[tle,now,location.lat,location.lon]);
 const annotatedPasses=useMemo(()=>passes.map(p=>({...p,visibility:assessIssPass(p,tle.satrec,location.lat,location.lon,cloudForecastAt(weather?.forecast,p.peak)),full:analyzeFullIssPass(p,tle.satrec,location.lat,location.lon,weather?.forecast)})),[passes,tle,location.lat,location.lon,weather]);
 useEffect(()=>{setWeather(null);setWeatherState('idle')},[location.lat,location.lon]);
 async function loadWeather(){
  setWeatherState('loading');setWeatherError('');
  try{
   const url=new URL('https://api.open-meteo.com/v1/forecast');
   url.searchParams.set('latitude',String(location.lat));url.searchParams.set('longitude',String(location.lon));
   url.searchParams.set('current','cloud_cover,precipitation,weather_code');
   url.searchParams.set('hourly','cloud_cover,precipitation_probability,precipitation');
   url.searchParams.set('forecast_days','3');url.searchParams.set('timezone','UTC');
   const res=await fetch(url.toString(),{cache:'no-store'});
   if(!res.ok)throw Error('Weather service HTTP '+res.status);
   const json=await res.json(),cloud=json.current?.cloud_cover;
   if(!Number.isFinite(cloud))throw Error('Cloud coverage is not available from the weather service.');
   const hourly=json.hourly;
   if(!Array.isArray(hourly?.time)||!Array.isArray(hourly?.cloud_cover)||hourly.time.length!==hourly.cloud_cover.length)throw Error('Hourly cloud forecast is unavailable.');
   const times=hourly.time.map(t=>t+'Z'); // Requested UTC from Open-Meteo; timestamps have no offset.
   setWeather({cloudCover:cloud,precipitation:json.current.precipitation,fetched:new Date(),forecast:{times,clouds:hourly.cloud_cover,precipitation:hourly.precipitation,probability:hourly.precipitation_probability},lat:location.lat,lon:location.lon});setWeatherState('ready');
  }catch(e){setWeather(null);setWeatherState('error');setWeatherError(e.message||'Weather unavailable')}
 }
 const selected=summary.planets.filter(p=>!onlyAbove||p.above);
 const nextEvening=events.filter(e=>e.event==='Evening').slice(0,4);
 const nextMorning=events.filter(e=>e.event==='Morning').slice(0,4);
 const moonDescription=summary.phase===null?'Phase unavailable':summary.phase<3?'Near new moon':summary.phase>97?'Near full moon':summary.phase+'% illuminated';
 function gps(){setGpsError('');if(!navigator.geolocation){setGpsError('Geolocation unavailable; use manual latitude and longitude.');return}
  navigator.geolocation.getCurrentPosition(p=>onLocation({lat:p.coords.latitude,lon:p.coords.longitude,label:'GPS • Current observer'}),()=>setGpsError('Location permission denied or unavailable.'),{enableHighAccuracy:true,timeout:12000});
 }
 return <section className="skyTonight">
  <div className="stHero"><div><span className="eyebrow">AURORA / SKY TONIGHT / LIVE OBSERVATION</span><h3>{bn?'আজ রাতের আকাশ':'Sky Tonight'}</h3><p>{bn?'তোমার অবস্থান থেকে সূর্য, চাঁদ, গ্রহ ও ISS-এর আকাশে অবস্থান এবং আগামী সময়ের পরিবর্তন দেখো।':'Explore the Moon, planets, twilight and estimated ISS passes from your chosen observer location.'}</p></div><div className="stHeroIcon"><Moon size={37}/><span>OBSERVATION</span></div></div>
  <div className="stLocation"><Compass size={17}/><span>{location.label}</span><button onClick={gps}><LocateFixed size={16}/> USE GPS</button><label>LAT <input aria-label="Sky Tonight latitude" type="number" min="-90" max="90" step=".0001" value={location.lat} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=-90&&n<=90)onLocation({...location,lat:n,label:'Manual observer coordinates'})}}/></label><label>LON <input aria-label="Sky Tonight longitude" type="number" min="-180" max="180" step=".0001" value={location.lon} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=-180&&n<=180)onLocation({...location,lon:n,label:'Manual observer coordinates'})}}/></label></div>
  {gpsError&&<p className="stAlert" role="alert">{gpsError}</p>}
  <div className="stStats">
   <div><Sun size={22}/><span>SKY CONDITIONS</span><strong>{summary.darkness}</strong><small>Sun: {fixed(summary.sun.alt)}° altitude</small></div>
   <div><Moon size={22}/><span>MOON PHASE</span><strong>{summary.phase===null?'—':summary.phase+'%'}</strong><small>{moonDescription} · {summary.moon.above?'Above horizon':'Below horizon'}</small></div>
   <div><Eye size={22}/><span>PLANETS ABOVE HORIZON</span><strong>{summary.planets.filter(p=>p.above).length} / 7</strong><small>Geometric altitude, not naked-eye confirmation</small></div>
   <div><Clock3 size={22}/><span>OBSERVATION TIME</span><strong>{now.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</strong><small>Browser local timezone</small></div>
  </div>
  <div className="stPanel stWeather"><div className="stPanelHeading"><h4>☁ Cloud Cover & Pass-Time Forecast</h4><button onClick={loadWeather} disabled={weatherState==='loading'}>{weatherState==='loading'?'LOADING':'LOAD LIVE WEATHER'}</button></div><p className="stIntro">Cloud data is optional. Press LOAD LIVE WEATHER to send the currently selected latitude/longitude to Open-Meteo. No location is sent to Open-Meteo until you press this button. Hourly cloud forecast is matched to the predicted ISS pass time; it is not a guarantee of clear skies.</p><div className="stWeatherStatus">{weatherState==='ready'?<>Cloud cover: <strong>{weather.cloudCover}% — {cloudLabel(weather.cloudCover)}</strong> · Precipitation: {Number.isFinite(weather.precipitation)?weather.precipitation+' mm':'—'} · Updated {weather.fetched.toLocaleTimeString()} · <small>Current conditions + hourly UTC forecast available for pass-time analysis</small></>:weatherState==='error'?weatherError:'Weather not requested; sky predictions use astronomy only.'}</div></div>
  <div className="stGrid">
   <div className="stPanel"><div className="stPanelHeading"><h4><Moon size={18}/> Tonight's Sky</h4><button onClick={onOpenSky}>OPEN 360° SKY MAP ↗</button></div><p className="stIntro">Planet altitude and direction are calculated at the selected coordinates. Actual visibility also depends on twilight, weather and light pollution.</p>
    <label className="stCheck"><input type="checkbox" checked={onlyAbove} onChange={e=>setOnlyAbove(e.target.checked)}/> ABOVE HORIZON ONLY</label>
    <div className="stPlanets">{selected.length===0&&<p>No planets are geometrically above the horizon at this time.</p>}{selected.map(p=><div key={p.name} className="stPlanet"><div className="stPlanetMark">{p.name.slice(0,2).toUpperCase()}</div><strong>{p.name}</strong><span>{fixed(p.alt)}° ALT</span><span>{direction(p.az)} · {fixed(p.az)}° AZ</span><b>{p.above?'ABOVE':'BELOW'}</b></div>)}</div>
   </div>
   <div className="stPanel"><div className="stPanelHeading"><h4><Sun size={18}/> Sunset & Twilight</h4></div><p className="stIntro">Upcoming approximate Sun altitude crossings (including dusk and dawn).</p>
    <div className="stTwilight"><div><strong>EVENING</strong>{nextEvening.length?nextEvening.map((e,i)=><div key={i}><span>{twilightLabel(e.kind,true)}</span><b>{clock(e.time)}</b></div>):<p>No evening crossing in the next 24 hours.</p>}</div><div><strong>MORNING</strong>{nextMorning.length?nextMorning.map((e,i)=><div key={i}><span>{twilightLabel(e.kind,false)}</span><b>{clock(e.time)}</b></div>):<p>No morning crossing in the next 24 hours.</p>}</div></div>
   </div>
  </div>
  {passAlert&&<SatellitePassAlert alert={passAlert}/>}
  <div className="stPanel stISS"><div className="stPanelHeading"><h4><Satellite size={19}/> ISS Pass Predictor</h4><button onClick={refreshISS} disabled={issState==='loading'}><RefreshCcw size={15}/> {issState==='loading'?'LOADING':'REFRESH ORBIT'}</button></div>
   <p className="stIntro">Live two-line orbital elements from CelesTrak (ISS NORAD 25544) are propagated with SGP4. Passes shown below reach at least 10° altitude. These are <strong>geometric passes</strong>. Each pass is sampled throughout its predicted duration for estimated Earth shadow, sky darkness and optional pass-time cloud forecast. Actual visual visibility remains unconfirmed.</p>
   <div className="stIssStatus">{issState==='loading'?'Retrieving current ISS orbit...':issState==='ready'?<>Orbital elements epoch: {clock(tle.epoch)} · refreshed {tle.fetched.toLocaleTimeString()}</>:issState==='error'?issError:'Waiting for orbital data'}</div>
   {issState==='ready'&&(annotatedPasses.length?<div className="stPasses">{annotatedPasses.slice(0,6).map((p,i)=><div className="stPass" key={i}><span className="stPassIndex">PASS {i+1}<em className="stPassVisibility">{p.full.classification}</em></span><div><small>RISE ABOVE 10°</small><strong>{clock(p.start)}</strong><em>{direction(p.azStart)} · {fixed(p.azStart)}°</em></div><div><small>MAX ELEVATION</small><strong>{fixed(p.maxAltitude)}°</strong><em>{clock(p.peak)}</em></div><div><small>END BELOW 10°</small><strong>{clock(p.end)}</strong><em>{direction(p.azEnd)} · {fixed(p.azEnd)}°</em></div><div><small>SUN ALTITUDE AT PEAK</small><strong>{fixed(bodyPosition('Sun',p.peak,location.lat,location.lon).alt)}°</strong><em>{p.visibility.sunlit===null?'Sunlight unknown':p.visibility.sunlit?'Sunlit (estimated)':'Earth shadow (estimated)'}</em></div><p className="stPassReason">{p.full.reason}. <strong>{p.full.favorableSamples}/{p.full.totalSamples} samples</strong> favourable. {p.full.bestWindow?`Best estimated interval: ${clock(p.full.bestWindow.start)} – ${clock(p.full.bestWindow.end)}.`:"No favourable interval estimated."} {weather?.forecast?`Forecast cloud at peak: ${cloudForecastAt(weather.forecast,p.peak)===null?"not available":cloudForecastAt(weather.forecast,p.peak)+"%"}.`:"Load weather for pass-time cloud estimates."}</p><button className="stTimelineToggle" aria-expanded={expandedPass===p.start.getTime()} onClick={()=>setExpandedPass(previous=>previous===p.start.getTime()?null:p.start.getTime())}>{expandedPass===p.start.getTime()?"HIDE FULL-PASS ANALYSIS":"VIEW FULL-PASS ANALYSIS"}</button>{expandedPass===p.start.getTime()&&<div className="stTimeline"><div className="stTimelineTrack">{p.full.samples.map((sample,j)=><span key={j} title={`${clock(sample.time)} · ${sample.classification} · ${sample.cloudCover===null?"weather unavailable":sample.cloudCover+"% cloud"}`} style={{background:sample.classification==="Potentially visible"?"#49d5b1":sample.classification==="Cloud limited"?"#d6a65e":sample.classification==="Unlikely"?"#8f546e":"#63728b"}}/>)}</div><p>Timeline sampled approximately every 20 seconds. Green = estimated sunlit/dark interval; amber = cloudy; red = unfavourable; grey = uncertain.</p></div>}</div>)}</div>:<p>No ISS passes above 10° found in the next 24 hours using the current orbital elements.</p>)}
   {issState!=='ready'&&<div className="stEmpty">ISS times unavailable. Check network access and orbital data freshness; no pass times will be invented.</div>}
   <p className="stNote">ISS rise/end times mark crossing the 10° minimum elevation threshold, not the geometric horizon. Predictions are approximate, may shift as the orbit changes, and require ISS solar illumination and clear/dark skies for actual viewing. The shadow estimate uses an approximate cylindrical Earth umbra at pass peak; it does not model penumbra, varying brightness or true visibility along the entire pass. Hourly cloud forecast, when enabled, is matched to the pass time. Estimates still do not account for street-level obstructions, optical brightness, or fully accurate penumbra geometry. Source: <a href={ENDPOINT} target="_blank" rel="noopener noreferrer">CelesTrak live TLE</a>.</p>
  </div>
  <p className="stFoot">Educational observing guide · no live telescope imagery · all directions measured clockwise from true north · time shown in your browser timezone.</p>
 </section>;
}
