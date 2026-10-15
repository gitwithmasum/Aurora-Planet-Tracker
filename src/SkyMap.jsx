import React,{useEffect,useMemo,useState} from 'react';
import * as Astronomy from 'astronomy-engine';
import './SkyMap.css';

const AU=149597870.7;
const DEG=Math.PI/180;
const wrap=(a)=>((a%360)+360)%360;
const cardinal=(a)=>['N','NE','E','SE','S','SW','W','NW'][Math.round(wrap(a)/45)%8];
const fmt=(value,decimal=1)=>Number.isFinite(value)?value.toFixed(decimal):'—';
function position(name,date,lat,lon){
 try{
  const observer=new Astronomy.Observer(lat,lon,0);
  const equatorial=Astronomy.Equator(name,date,observer,true,true);
  const horizontal=Astronomy.Horizon(date,observer,equatorial.ra,equatorial.dec,'normal');
  return {az:horizontal.azimuth,alt:horizontal.altitude,distance:equatorial.dist*AU};
 }catch{return {az:NaN,alt:NaN,distance:NaN}}
}
function polarPoint(az,alt,heading){
 const bearing=(az-heading)*DEG;
 const radius=160*(90-Math.max(0,Math.min(90,alt)))/90;
 return {x:200+Math.sin(bearing)*radius,y:200-Math.cos(bearing)*radius};
}
const glyphs=[{name:'N',angle:0},{name:'NE',angle:45},{name:'E',angle:90},{name:'SE',angle:135},{name:'S',angle:180},{name:'SW',angle:225},{name:'W',angle:270},{name:'NW',angle:315}];
const presets=[{name:'N',angle:0},{name:'E',angle:90},{name:'S',angle:180},{name:'W',angle:270}];

export default function SkyMap({planets,location,selected,onSelect,onOpenDetails}){
 const [hours,setHours]=useState(0);
 const [anchor,setAnchor]=useState(()=>Date.now());
 const [heading,setHeading]=useState(0);
 const [below,setBelow]=useState(false);
 const [clock,setClock]=useState(true);
 const [search,setSearch]=useState('');
 useEffect(()=>{if(!clock)return;const update=()=>setAnchor(Date.now());const timer=setInterval(update,30000);return()=>clearInterval(timer)},[clock]);
 const date=useMemo(()=>new Date(anchor+hours*3600000),[anchor,hours]);
 const bodies=useMemo(()=>planets.map(p=>({...p,...position(p.name,date,location.lat,location.lon)})),[planets,date,location.lat,location.lon]);
 const solar=useMemo(()=>position('Sun',date,location.lat,location.lon),[date,location.lat,location.lon]);
 const active=bodies.find(p=>p.name===selected.name)||bodies[0];
 const visible=bodies.filter(p=>below||p.alt>=0).filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
 const forecasts=useMemo(()=>{
  if(!active)return[];
  return Array.from({length:25},(_,i)=>{
   const at=new Date(date.getTime()+i*3600000);
   const planet=position(active.name,at,location.lat,location.lon);
   const sun=position('Sun',at,location.lat,location.lon);
   return {at,alt:planet.alt,good:planet.alt>=10&&sun.alt<=-6,above:planet.alt>0};
  });
 },[active?.name,date,location.lat,location.lon]);
 const nextWindow=forecasts.find(f=>f.good);
 const point=active?polarPoint(active.az,active.alt,heading):{x:200,y:200};
 const bearingOffset=active?((wrap(active.az-heading+180)-180)):0;
 function setNow(){setAnchor(Date.now());setHours(0);setClock(true)}
 function changeHours(v){setHours(Number(v));setClock(false)}
 const conditions=solar.alt>0?'DAYLIGHT':solar.alt>-6?'TWILIGHT':'NIGHT';
 return <section className="astroMap">
  <div className="astroHeader"><div><span className="eyebrow">ASTRONOMICAL NAVIGATION / HORIZON PROJECTION</span><h3>360° Sky Observatory</h3><p>Accurate calculated directions for your observer coordinates, visualized on a compass-style sky dome.</p></div><span className="astroLive">{clock&&hours===0?'● LIVE BASE TIME':'◉ TIME EXPLORER'}</span></div>
  <div className="astroControls">
   <label className="astroSearch">FIND PLANET<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by planet name"/></label>
   <label>TIME OFFSET <strong>{hours>0?'+':''}{hours} h</strong><input aria-label="Time offset in hours" type="range" min="-24" max="48" step="1" value={hours} onChange={e=>changeHours(e.target.value)}/></label>
   <button className="astroButton" onClick={setNow}>↻ NOW</button>
   <label className="astroToggle"><input type="checkbox" checked={below} onChange={e=>setBelow(e.target.checked)}/> INCLUDE BELOW HORIZON</label>
  </div>
  <div className="astroLayout">
  <div className="astroMapArea"><div className="astroMapMeta"><span>{date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</span><span>{conditions}</span><span>OBSERVER {fmt(location.lat,3)}°, {fmt(location.lon,3)}°</span></div>
   <svg className="astroChart" viewBox="0 0 400 400" role="img" aria-label="360 degree sky map. North is at the top when bearing zero. Planet locations represent azimuth and altitude.">
    <defs><radialGradient id="astroBackdrop"><stop stopColor="#152a57"/><stop offset=".75" stopColor="#0a1a35"/><stop offset="1" stopColor="#030b1d"/></radialGradient><filter id="astroHalo"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <circle cx="200" cy="200" r="165" fill="url(#astroBackdrop)" stroke="#63a2ca" strokeWidth="1.5"/>
    {[40,80,120,160].map((r,i)=><circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#3c749f" strokeOpacity={i===3?.8:.37} strokeDasharray={i===3?'0':'3 6'}/>)}
    {Array.from({length:12},(_,i)=>{const theta=i*30*DEG;return <line key={i} x1="200" y1="200" x2={200+160*Math.sin(theta)} y2={200-160*Math.cos(theta)} stroke="#477497" strokeOpacity=".25"/>;})}
    {[90,60,30,0].map((alt,i)=><text key={alt} x="204" y={200-160*(90-alt)/90-4} fill="#6e91ba" fontSize="9">{alt}°</text>)}
    {glyphs.map(g=>{const theta=(g.angle-heading)*DEG;return <text key={g.name} textAnchor="middle" dominantBaseline="middle" x={200+184*Math.sin(theta)} y={200-184*Math.cos(theta)} fill={g.name==='N'?'#75edff':'#92adc8'} fontSize={g.name.length===1?16:10} fontWeight="bold">{g.name}</text>})}
    <circle cx="200" cy="200" r="3" fill="#a5f0ff"/>
    {visible.filter(p=>Number.isFinite(p.az)&&Number.isFinite(p.alt)&&p.alt>=0).map(p=>{const pt=polarPoint(p.az,p.alt,heading);const chosen=p.name===active?.name;return <g key={p.name} onClick={()=>onSelect(planets.find(q=>q.name===p.name))} className="astroMarker" role="button" tabIndex={0} aria-label={p.name+' altitude '+fmt(p.alt)+' degrees'} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(planets.find(q=>q.name===p.name))}}}><title>{p.name} — altitude {fmt(p.alt)}°, bearing {fmt(p.az)}°</title>{chosen&&<circle cx={pt.x} cy={pt.y} r="15" fill={p.color} opacity=".3" filter="url(#astroHalo)"/>}<circle cx={pt.x} cy={pt.y} r={chosen?8:5.3} stroke={chosen?'#fff':'#95bbd0'} strokeWidth={chosen?1.5:.5} fill={p.color}/><text x={pt.x+12} y={pt.y-8} fontSize="11" fontWeight={chosen?700:500} fill={chosen?'#b8f5ff':'#b1cee8'}>{p.name}</text></g>})}
   </svg>
   <div className="astroBearing"><span>ROTATE SKY MAP</span><input aria-label="Map rotation bearing" type="range" min="0" max="359" value={heading} onChange={e=>setHeading(Number(e.target.value))}/><strong>{heading}° {cardinal(heading)}</strong></div>
   <div className="astroDirectionButtons">{presets.map(p=><button key={p.name} className={heading===p.angle?'active':''} onClick={()=>setHeading(p.angle)}>{p.name}</button>)}</div>
   <p className="astroFineprint">Top of chart points toward the selected map heading. Center is zenith (+90°); outer ring is horizon (0°). Below-horizon planets appear in the data list, not inside the above-horizon dome.</p>
  </div>
  <aside className="astroReadout">
   <div className="astroSectionCaption">TARGET LOCKED / {active?.name.toUpperCase()}</div>
   <div className="astroTarget"><div className="astroOrb" style={{'--orb':active?.color}}/><div><h4>{active?.name}</h4><span>{active?.type}</span></div></div>
   <div className="astroReadGrid"><div><small>AZIMUTH</small><strong>{fmt(active?.az)}°</strong><em>{cardinal(active?.az||0)}</em></div><div><small>ALTITUDE</small><strong>{fmt(active?.alt)}°</strong><em>{active?.alt>0?'Above horizon':'Below horizon'}</em></div><div><small>EARTH DISTANCE</small><strong>{fmt(active?.distance/1e6,2)}M</strong><em>kilometers</em></div><div><small>MAP TURN</small><strong>{fmt(Math.abs(bearingOffset))}°</strong><em>{bearingOffset<0?'Rotate left':'Rotate right'}</em></div></div>
   <div className="astroForecast"><div className="astroSectionCaption">NEXT 24 HOURS / GEOMETRIC OBSERVATION</div><div className="astroTimeline">{forecasts.filter((f,i)=>i%2===0).map((f,i)=><div key={i} title={f.at.toLocaleString()+' altitude '+fmt(f.alt)+'°'}><span style={{height:(Math.max(0,f.alt)+6)*.85+'px',background:f.good?'#6de6d3':f.above?'#5a93c8':'#2a3b57'}}/><small>{f.at.getHours().toString().padStart(2,'0')}</small></div>)}</div>
   <p>{nextWindow?'Next candidate observing window (planet ≥ 10° and Sun ≤ −6°): '+nextWindow.at.toLocaleString(undefined,{weekday:'short',hour:'numeric',minute:'2-digit'}):'No suitable geometric observation window found within the sampled next 24 hours.'}</p>
   </div>
   <button className="astroButton astroFull" onClick={onOpenDetails}>OPEN PLANET INTELLIGENCE →</button>
   <div className="astroSectionCaption">PLANET FEED</div><div className="astroFeed">{bodies.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=><button key={p.name} className={p.name===active?.name?'selected':''} onClick={()=>onSelect(planets.find(q=>q.name===p.name))}><span style={{background:p.color}}/>{p.name}<b>{fmt(p.alt)}°</b><small>{fmt(p.az)}°</small></button>)}</div>
  </aside>
  </div>
  <p className="astroCaution">Observation forecasts are geometric estimates only: weather, atmospheric extinction, light pollution, instrument requirements and planet brightness are not evaluated. This map is based on calculated celestial coordinates, not phone compass or camera calibration. Hours are sampled at one-hour intervals.</p>
 </section>;
}
