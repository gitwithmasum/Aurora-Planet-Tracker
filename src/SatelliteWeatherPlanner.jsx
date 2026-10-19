import React,{useEffect,useMemo,useState} from 'react';
import {Satellite,Cloud,Sun,Compass,Clock3,RefreshCw,ArrowUpRight,ShieldAlert,CloudRain,MapPin,BookOpen} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import {predictSatelliteCalendar,alertDirection} from './satellitePassPlanner.mjs';
import {assessIssPass} from './issVisibility.mjs';
import {assessTle} from './spaceScienceMath.mjs';
import {normalizeWeatherResponse,weatherAtPeak,weatherMatchesObserver,evaluatePassConditions,forecastAgeStatus} from './satelliteWeatherMath.mjs';
import {useLanguage} from './i18n.jsx';
import './SatelliteWeatherPlanner.css';

const localTime=date=>new Date(date).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const compact=(n,d=0)=>finite(n)?n.toFixed(d):'—';

export default function SatelliteWeatherPlanner({location,now,onSatellite,onSky,onLogPass}){
 const {language}=useLanguage(),bn=language==='bn';
 const label=(en,translated)=>bn?translated:en;
 const [catalog,setCatalog]=useState([]),[catalogState,setCatalogState]=useState('loading'),[catalogError,setCatalogError]=useState('');
 const [source,setSource]=useState(null),[reload,setReload]=useState(0);
 const [selectedId,setSelectedId]=useState('iss'),[minElevation,setMinElevation]=useState(15);
 const [forecast,setForecast]=useState(null),[weatherState,setWeatherState]=useState('idle'),[weatherError,setWeatherError]=useState('');
 const [forecastReload,setForecastReload]=useState(0),[showOnlyCandidates,setShowOnlyCandidates]=useState(false);
 const minute=Math.floor(now.getTime()/60000),at=minute*60000;
 const latitude=location?.lat,longitude=location?.lon;
 const validLocation=finite(latitude)&&finite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180;
 useEffect(()=>{
  let alive=true;
  setCatalogState('loading');setCatalogError('');
  loadSatelliteCatalog().then(data=>{
   if(!alive)return;
   setCatalog(data.rows);setCatalogState('ready');
   setSource({name:String(data.source||'Public TLE catalog'),fetchedAt:data.fetchedAt});
   setSelectedId(old=>data.rows.some(s=>s.id===old)?old:data.rows[0].id);
  }).catch(error=>{
   if(!alive)return;
   setCatalog([]);setSource(null);setCatalogState('error');
   setCatalogError(error?.message||'Validated orbital data is unavailable');
  });
  return()=>{alive=false};
 },[reload]);
 // Weather is requested only by clicking a button. Changing observer coordinates
 // cancels the old request and invalidates the old forecast.
 const [weatherRequest,setWeatherRequest]=useState(null);
 useEffect(()=>{
  setForecast(null);setWeatherError('');
  setWeatherState('idle');setWeatherRequest(null);
 },[latitude,longitude]);
 useEffect(()=>{
  if(!weatherRequest)return;
  const controller=new AbortController();
  let alive=true;
  setWeatherState('loading');setWeatherError('');
  const {lat,lon}=weatherRequest;
  const params=new URLSearchParams({
   latitude:String(lat),longitude:String(lon),
   hourly:'cloud_cover,precipitation,precipitation_probability',
   forecast_days:'3',timezone:'UTC'
  });
  fetch('https://api.open-meteo.com/v1/forecast?'+params,{cache:'no-store',signal:controller.signal})
   .then(response=>{if(!response.ok)throw Error('Weather service HTTP '+response.status);return response.json()})
   .then(json=>{
    if(!alive)return;
    setForecast(normalizeWeatherResponse(json,{requestedAt:Date.now(),latitude:lat,longitude:lon}));
    setWeatherState('ready');
   }).catch(error=>{
    if(!alive||controller.signal.aborted)return;
    setForecast(null);setWeatherState('error');
    setWeatherError(error?.message||'Weather forecast unavailable');
   });
  return()=>{alive=false;controller.abort()};
 },[weatherRequest,forecastReload]);
 const activeWeather=weatherMatchesObserver(forecast,location)?forecast:null;
 const weatherAge=forecastAgeStatus(activeWeather,now.getTime());
 const hasForecast=weatherAge==='recent';
 const selected=catalog.find(s=>s.id===selectedId)||null;
 const tle=useMemo(()=>assessTle(selected,at),[selected,at]);
 const passes=useMemo(()=>selected?.satrec&&validLocation?
  predictSatelliteCalendar(selected.satrec,new Date(at),latitude,longitude,1,minElevation).slice(0,16):[],
  [selected,at,latitude,longitude,validLocation,minElevation]);
 const assessed=useMemo(()=>passes.map(pass=>{
  const illumination=assessIssPass(pass,selected.satrec,latitude,longitude);
  const matched=hasForecast?weatherAtPeak(activeWeather,pass.peak):null;
  const conditions=evaluatePassConditions({pass,illumination,weather:matched,forecastStatus:weatherState});
  return {...pass,illumination,weather:matched,conditions};
 }),[passes,selected,latitude,longitude,activeWeather,hasForecast,weatherState]);
 const shown=showOnlyCandidates?assessed.filter(p=>p.conditions.level==='potential'||p.conditions.level==='mixed'):assessed;
 const count=assessed.filter(p=>p.conditions.level==='potential').length;
 const dateStatus=source?.fetchedAt&&Number.isFinite(Date.parse(source.fetchedAt))?localTime(source.fetchedAt):'—';
 return <section className="satWeather" aria-label="Satellite Observation and Weather Intelligence">
  <div className="satWeatherHero">
   <div><span className="satWeatherEyebrow">AURORA / OBSERVATION / v4.2</span>
    <h3><Satellite size={28}/>{label('Satellite & Weather Planner','স্যাটেলাইট ও আবহাওয়া পর্যবেক্ষণ')}</h3>
    <p>{label('Explore estimated satellite passes, spacecraft illumination and optional hourly cloud forecasts for your observer.','নির্বাচিত অবস্থান থেকে স্যাটেলাইটের সম্ভাব্য পাস, সূর্যের আলো এবং ঘণ্টাভিত্তিক মেঘ-বৃষ্টির পূর্বাভাস দেখুন।')}</p>
   </div><button onClick={onSky} type="button"><Sun size={16}/>{label('SKY TONIGHT','আজ রাতের আকাশ')} <ArrowUpRight size={15}/></button>
  </div>
  <div className="satWeatherStats">
   <div><small>{label('OBSERVER','পর্যবেক্ষক')}</small><strong>{location?.label||'Manual observer'}</strong><span>{validLocation?compact(latitude,3)+'°, '+compact(longitude,3)+'°':'Invalid coordinates'}</span></div>
   <div><small>{label('VALID ORBIT RECORDS','বৈধ কক্ষপথ তথ্য')}</small><strong>{catalogState==='ready'?catalog.length:'—'}</strong><span>{label('Curated satellite sample','নির্বাচিত স্যাটেলাইটের তালিকা')}</span></div>
   <div><small>{label('PREDICTED PASSES','পূর্বাভাসকৃত পাস')}</small><strong>{catalogState==='ready'?passes.length:'—'}</strong><span>{label('Next 24 hours','আগামী ২৪ ঘণ্টা')}</span></div>
   <div><small>{label('POTENTIAL WINDOWS','সম্ভাব্য ভালো সময়')}</small><strong>{hasForecast?count:'—'}</strong><span>{label('Model conditions only','শুধু মডেলভিত্তিক পরিস্থিতি')}</span></div>
  </div>
  <div className="satWeatherControls">
   <label>{label('SPACECRAFT','স্যাটেলাইট')}<select aria-label="Select satellite for weather planner" value={selected?.id||''} onChange={e=>setSelectedId(e.target.value)} disabled={!catalog.length}>{catalog.map(s=><option key={s.id} value={s.id}>{s.name} · {s.noradId}</option>)}</select></label>
   <label>{label('MINIMUM ELEVATION','সর্বনিম্ন উচ্চতা')}<select aria-label="Minimum satellite pass elevation" value={minElevation} onChange={e=>setMinElevation(Number(e.target.value))}><option value={10}>10°</option><option value={15}>15°</option><option value={20}>20°</option><option value={30}>30°</option></select></label>
   <button type="button" onClick={()=>setReload(v=>v+1)} disabled={catalogState==='loading'}><RefreshCw size={15}/>{label('REFRESH ORBITS','কক্ষপথ রিফ্রেশ')}</button>
  </div>
  {catalogState==='error'&&<p className="satWeatherWarning" role="alert">{catalogError} · {label('No synthetic passes are shown.','কৃত্রিম পাস দেখানো হচ্ছে না।')}</p>}
  {catalogState==='loading'&&<p className="satWeatherNotice" role="status">{label('Checking validated TLE catalog…','বৈধ TLE তথ্য যাচাই করা হচ্ছে…')}</p>}
  <div className="satWeatherProvenance">
   <span><ShieldAlert size={15}/>{label('TLE DATA','TLE তথ্য')}: {tle.epoch?label('Age','বয়স')+' '+compact(tle.ageHours,1)+' h · '+tle.status:'Unavailable'}</span>
   <span>{label('SOURCE','উৎস')}: {source?.name||'—'} · {label('UPDATED','আপডেট')}: {dateStatus}</span>
  </div>
  <section className="satWeatherForecast">
   <div><h4><Cloud size={19}/>{label('OPTIONAL WEATHER INTELLIGENCE','ঐচ্ছিক আবহাওয়া বিশ্লেষণ')}</h4>
    <p>{label('Cloud cover and precipitation are model forecasts from Open-Meteo, not direct observations. Load explicitly to send selected coordinates to Open-Meteo.','মেঘ ও বৃষ্টি Open-Meteo-এর মডেলভিত্তিক পূর্বাভাস। নিচের বাটন চাপলে নির্বাচিত স্থানাঙ্ক Open-Meteo-তে পাঠানো হবে।')}</p>
    {weatherState==='ready'&&hasForecast&&<p className="satWeatherFresh">{label('Hourly weather loaded','ঘণ্টাভিত্তিক পূর্বাভাস পাওয়া গেছে')} · {localTime(activeWeather.requestedAt)}</p>}
    {weatherAge==='old'&&<p className="satWeatherWarning">{label('Weather data has aged; refresh for current comparisons.','আবহাওয়ার তথ্য পুরোনো হয়েছে; নতুন করে লোড করুন।')}</p>}
    {weatherState==='error'&&<p className="satWeatherWarning" role="alert">{weatherError}</p>}
   </div>
   <button type="button" disabled={!validLocation||weatherState==='loading'} onClick={()=>{setWeatherRequest({lat:latitude,lon:longitude});setForecastReload(v=>v+1)}}><CloudRain size={17}/>{weatherState==='loading'?label('LOADING…','লোড হচ্ছে…'):label(hasForecast?'REFRESH WEATHER':'LOAD WEATHER','আবহাওয়া লোড করুন')}</button>
  </section>
  <div className="satWeatherResultsTitle"><div><h4>{label('SATELLITE PASS WINDOWS','স্যাটেলাইট পাসের সময়')}</h4><p>{label('Estimated peak geometry; actual viewability depends on local sky and equipment. All clock times use your device timezone.','সর্বোচ্চ উচ্চতার সময়ে গণনাভিত্তিক অবস্থা; বাস্তবে দেখা যাওয়া স্থানীয় পরিবেশের ওপর নির্ভর করে।')}</p></div>
   <label><input type="checkbox" checked={showOnlyCandidates} onChange={e=>setShowOnlyCandidates(e.target.checked)}/>{label('Promising only','সম্ভাবনাময় পাস শুধু')}</label>
  </div>
  <div className="satWeatherCards">
   {shown.length?shown.map(pass=><article className="satWeatherCard" key={pass.start.getTime()}>
    <div className="satWeatherCardTop"><span className="satWeatherClass" data-level={pass.conditions.level}>{pass.conditions.label}</span><span>{compact(pass.maxAltitude,1)}° {label('peak','সর্বোচ্চ')}</span></div>
    <h5>{selected?.name||label('Satellite','স্যাটেলাইট')}</h5>
    <strong>{localTime(pass.start)}</strong><small>{label('ENDS','শেষ')} {localTime(pass.end)}</small>
    <div className="satWeatherMetrics"><span><Compass size={14}/>{alertDirection(pass)}</span><span><Sun size={14}/>{label('SUNLIT AT PEAK','সর্বোচ্চ সময়ে আলো')}: {pass.illumination.sunlit===null?'—':pass.illumination.sunlit?label('Yes','হ্যাঁ'):label('No','না')}</span>
    <span>{label('SUN ALTITUDE','সূর্যের উচ্চতা')}: {compact(pass.illumination.sunAltitude,1)}°</span>
    <span><Cloud size={14}/>{label('PEAK CLOUD','মেঘ')}: {pass.weather?compact(pass.weather.cloudCover)+'%':'—'}</span>
    <span><CloudRain size={14}/>{label('RAIN','বৃষ্টি')}: {pass.weather?.precipitationMm===null||!pass.weather?'—':compact(pass.weather.precipitationMm,1)+' mm'}</span></div>
    <p>{pass.conditions.reason}</p>
    <button type="button" onClick={()=>onLogPass(selected,pass)}><BookOpen size={14}/>{label('LOG THIS PASS','এই পাসের সেশন')}</button><button type="button" onClick={()=>onSatellite(selected.id)}>{label('OPEN SATELLITE TRACKER','স্যাটেলাইট ট্র্যাকার খুলুন')} <ArrowUpRight size={14}/></button>
   </article>):<p className="satWeatherEmpty">{catalogState==='loading'?label('Loading passes…','পাস লোড হচ্ছে…'):!validLocation?label('Choose valid observer coordinates.','বৈধ পর্যবেক্ষকের স্থানাঙ্ক দিন।'):showOnlyCandidates?label('No passes match the current promising conditions. Try showing all passes.','এই শর্তে উপযুক্ত পাস পাওয়া যায়নি; সব পাস দেখুন।'):label('No predicted pass meets the altitude threshold within 24 hours.','২৪ ঘণ্টায় নির্ধারিত উচ্চতার কোনো পাস নেই।')}</p>}
  </div>
  <p className="satWeatherMethod"><ShieldAlert size={18}/>{label('Method and limits: orbital passes use recent public TLEs propagated by SGP4; sunlight uses an approximate Earth-shadow model at pass peak. Clouds and rain are UTC-hourly model forecasts matched only within 70 minutes of peak, never extrapolated. “Potential window” is not a probability or guarantee, and terrain, aircraft, brightness, light pollution and local clouds can change visibility. Weather fetching is optional; no continuous background tracking or notifications are added.','পদ্ধতি ও সীমাবদ্ধতা: TLE/SGP4 থেকে পাস এবং পৃথিবীর আনুমানিক ছায়া থেকে সূর্যালোক গণনা করা হয়। আবহাওয়ার পূর্বাভাস শুধুমাত্র পাসের কাছাকাছি ঘণ্টার সঙ্গে মেলানো হয়, অনুমান করে নতুন সময় তৈরি করা হয় না। সম্ভাব্য সময় মানে দেখার নিশ্চয়তা নয়। অনুমতি ছাড়া background tracking বা notification যুক্ত করা হয়নি।')}</p>
 </section>;
}
