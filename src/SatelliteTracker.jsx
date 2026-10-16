import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Satellite,Compass,Clock3,MapPin,ArrowUpRight} from 'lucide-react';
import SatellitePassAlert from './SatellitePassAlert.jsx';
import SatelliteGlobe from './SatelliteGlobe.jsx';
import OrbitalMissionControl from './OrbitalMissionControl.jsx';
import SatelliteARFinder from './SatelliteARFinder.jsx';
import SatellitePassPlanner from './SatellitePassPlanner.jsx';
import './SatelliteTracker.css';
import {SATELLITE_CATEGORIES,DEFAULT_SATELLITES,satelliteSearch,loadSatelliteCatalog} from './satelliteCatalog.mjs';
export default function SatelliteTracker({alert,location,onLocation,onOpenSky}){
 const pass=alert.activePass||alert.upcoming;
 const [catalog,setCatalog]=useState([]),[catalogStatus,setCatalogStatus]=useState('loading'),[catalogError,setCatalogError]=useState('');
 const [selectedId,setSelectedId]=useState('iss'),[category,setCategory]=useState('All'),[query,setQuery]=useState('');
 const reloadCatalog=useCallback(async()=>{
  setCatalogStatus('loading');setCatalogError('');
  try{const result=await loadSatelliteCatalog();setCatalog(result.rows);setCatalogStatus('ready')}
  catch(error){setCatalogError(error.message||'Orbital catalog is unavailable');setCatalogStatus('error')}
 },[]);
 useEffect(()=>{reloadCatalog()},[reloadCatalog]);
 const selected=catalog.find(s=>s.id===selectedId)||null;
 const legacyIss=selectedId==='iss'&&alert.satrec&&!selected;
 const targetSatrec=selected?.satrec||(legacyIss?alert.satrec:null);
 const metadata=selected||DEFAULT_SATELLITES.find(s=>s.id===selectedId)||{name:'Satellite',noradId:0,category:'Other'};
 const filtered=useMemo(()=>satelliteSearch(catalog,query,category),[catalog,query,category]);
 const change=(key,value,min,max)=>{
  if(value==='')return;
  const n=Number(value);
  if(Number.isFinite(n)&&n>=min&&n<=max)onLocation({...location,[key]:n,label:'Manual observer coordinates'});
 };
 return <section className="satTracker">
  <div className="satTrackerIntro"><div><span className="eyebrow">AURORA / OBSERVATION / v2.9</span><h3>Satellite Tracker</h3><p>Search and visualize ISS, Tiangong, Hubble, NOAA and selected Starlink orbits. ISS pass alerts remain available.</p></div><Satellite size={42}/></div>
  <div className="satTrackerLocation"><MapPin size={17}/><span>{location.label}</span><label>LAT <input aria-label="Satellite observer latitude" type="number" min="-90" max="90" step=".0001" value={location.lat} onChange={e=>change('lat',e.target.value,-90,90)}/></label><label>LON <input aria-label="Satellite observer longitude" type="number" min="-180" max="180" step=".0001" value={location.lon} onChange={e=>change('lon',e.target.value,-180,180)}/></label></div>
  <div className="satCatalog">
    <div className="satCatalogHeading"><strong>MULTI-SATELLITE CATALOG</strong><span>{catalogStatus==='ready'?catalog.length+' recent orbital records':catalogStatus==='loading'?'Fetching catalog…':'Orbital catalog unavailable'}</span><button type="button" onClick={reloadCatalog} disabled={catalogStatus==='loading'}>REFRESH CATALOG</button></div>
    <div className="satCatalogControls"><input aria-label="Search satellites by name or NORAD ID" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search satellites / NORAD ID…"/><select aria-label="Filter satellite category" value={category} onChange={e=>setCategory(e.target.value)}>{SATELLITE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
    {catalogError&&<p className="satCatalogError" role="alert">{catalogError}. {alert.satrec?'ISS fallback remains available.':''}</p>}
    <div className="satCatalogList" aria-label="Satellite catalog">
      {filtered.map(s=><button type="button" key={s.id} className={selectedId===s.id?'selected':''} onClick={()=>setSelectedId(s.id)} aria-pressed={selectedId===s.id}><strong>{s.name}</strong><small>{s.category} · NORAD {s.noradId}</small></button>)}
      {catalogStatus==='ready'&&!filtered.length&&<p>No matching satellites with current orbital data.</p>}
      {catalogStatus!=='ready'&&alert.satrec&&<button type="button" onClick={()=>setSelectedId('iss')} className="selected">ISS — backup data source</button>}
    </div>
    <p className="satCatalogNote">Only spacecraft with current validated TLE records are selectable. Starlink entries represent a small current sample, not the entire constellation.</p>
  </div>
  <OrbitalMissionControl catalog={catalog} selected={selected||((legacyIss&&alert.satrec)?{...metadata,satrec:alert.satrec}:null)} onSelect={setSelectedId} now={alert.tick} location={location}/>
  <SatelliteGlobe key={selectedId} satrec={targetSatrec} now={alert.tick} loading={catalogStatus==='loading'||(selectedId==='iss'&&alert.status==='loading')} error={catalogError||(selectedId==='iss'?alert.error:'No recent orbital elements are available for this spacecraft.')} onRefresh={selectedId==='iss'?alert.refresh:reloadCatalog} satelliteName={metadata.name} noradId={metadata.noradId}/>
  <SatelliteARFinder key={'ar-'+metadata.noradId} satrec={targetSatrec} now={alert.tick} location={location} onLocation={onLocation} name={metadata.name}/>
  <SatellitePassPlanner key={metadata.noradId} satrec={targetSatrec} now={alert.tick} location={location} satellite={metadata}/>
  <SatellitePassAlert alert={alert}/>
  <div className="satTrackerDetails">
   <div><Compass size={20}/><span>PASS DIRECTION</span><strong>{pass?Math.round(pass.azStart)+'° from true north':'—'}</strong><small>The arrow indicates the ISS bearing, not your phone's heading.</small></div>
   <div><Clock3 size={20}/><span>PREDICTED PASS HEIGHT</span><strong>{pass?pass.maxAltitude.toFixed(1)+'°':'—'}</strong><small>Estimated peak altitude. Local obstructions and weather may affect visibility.</small></div>
  </div>
  <button className="satTrackerSkyLink" type="button" onClick={onOpenSky}>OPEN SKY TONIGHT FOR FULL PASS ANALYSIS <ArrowUpRight size={16}/></button>
  <p className="satTrackerCaution">Orbital visualization supports only satellites returned by the curated, recently validated catalog. The legacy global ISS alert is preserved. New custom alerts for selected satellites run while this page remains open. Notifications are delivered only when the browser is running and permitted to show them; reliable alerts after closing the app require a separate push/notification backend.</p>
 </section>;
}
