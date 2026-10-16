import React,{useEffect,useMemo,useState} from 'react';
import {Activity,Satellite,BookOpen,Download,Trash2,BarChart3} from 'lucide-react';
import {satelliteTelemetry} from './satelliteOrbit.mjs';
import {comparisonRows,catalogHealth,appendObservation,createObservation,normalizeObservation,HISTORY_KEY,MAX_OBSERVATIONS} from './orbitalMissionMath.mjs';
import './OrbitalMissionControl.css';
function loadHistory(){try{const raw=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(raw)?raw.map(normalizeObservation).filter(Boolean).slice(0,MAX_OBSERVATIONS):[]}catch{return []}}
const fmt=(v,n=1)=>Number.isFinite(v)?v.toFixed(n):'—';
export default function OrbitalMissionControl({catalog,selected,onSelect,now,location}){
 const [compareIds,setCompareIds]=useState([]);
 const [history,setHistory]=useState(loadHistory);
 const [note,setNote]=useState(''),[status,setStatus]=useState('');
 const minute=Math.floor(now/60000);
 const compare=useMemo(()=>comparisonRows(catalog.filter(x=>compareIds.includes(x.id)),new Date(minute*60000),3),[catalog,compareIds,minute]);
 const health=useMemo(()=>catalogHealth(catalog,minute*60000),[catalog,minute]);
 const selectedTelemetry=useMemo(()=>selected?.satrec?satelliteTelemetry(selected.satrec,new Date(now)):null,[selected,Math.floor(now/1000)]);
 useEffect(()=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}catch{setStatus('Browser storage unavailable; saved observations may not persist.')}},[history]);
 function toggleCompare(id){
  setCompareIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length>=3?[...prev.slice(1),id]:[...prev,id]);
 }
 function save(){
  const observation=createObservation(selected,selectedTelemetry,now,note);
  if(!observation){setStatus('Fresh satellite telemetry is required to save an observation.');return}
  setHistory(prev=>appendObservation(prev,observation));setNote('');setStatus('Calculated orbital snapshot saved locally. This is not proof of a visual sighting.');
 }
 function download(){
  const blob=new Blob([JSON.stringify({format:'aurora-orbital-history-v1',exportedAt:new Date().toISOString(),observations:history},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='aurora-orbital-observations.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="missionControl" aria-label="Orbital Mission Control">
  <header><div><span className="eyebrow">AURORA / v2.9 / ORBITAL ANALYTICS</span><h4><Activity size={22}/> Orbital Mission Control</h4><p>Compare calculated spacecraft telemetry, review catalog health and keep an observation journal on this device.</p></div><span className="missionIndicator">MISSION SYSTEMS ONLINE</span></header>
  <div className="missionMetrics">
   <div><Satellite size={17}/><small>TRACKABLE SATELLITES</small><strong>{health.total}</strong></div>
   <div><BarChart3 size={17}/><small>OLDEST TLE AGE</small><strong>{health.oldestHours===null?'—':fmt(health.oldestHours,1)+' h'}</strong></div>
   <div><BookOpen size={17}/><small>LOCAL OBSERVATIONS</small><strong>{history.length}</strong></div>
   <div><Activity size={17}/><small>COMPARISON SLOTS</small><strong>{compare.length} / 3</strong></div>
  </div>
  <div className="missionCompare"><h5>SATELLITE COMPARISON</h5><p>Select up to three spacecraft. The values are propagated from orbital elements for the same minute, not received from spacecraft telemetry.</p>
   <div className="missionComparePicker" aria-label="Compare satellites">{catalog.map(item=><button key={item.id} type="button" onClick={()=>toggleCompare(item.id)} aria-pressed={compareIds.includes(item.id)}>{item.name}</button>)}</div>
   <div className="missionCompareTableWrap"><table><thead><tr><th>SPACECRAFT</th><th>ALTITUDE</th><th>SPEED</th><th>ORBIT PERIOD</th><th>LAT / LON</th><th>VIEW</th></tr></thead><tbody>{compare.map(row=><tr key={row.id}><td>{row.name}<small>NORAD {row.noradId}</small></td><td>{fmt(row.telemetry?.altitudeKm)} km</td><td>{fmt(row.telemetry?.speedKmS,2)} km/s</td><td>{fmt(row.telemetry?.orbitalPeriodMin)} min</td><td>{fmt(row.telemetry?.latitude)}° / {fmt(row.telemetry?.longitude)}°</td><td><button type="button" onClick={()=>onSelect(row.id)}>VIEW ORBIT</button></td></tr>)}</tbody></table>{!compare.length&&<p className="missionEmpty">Choose satellites above to compare orbital characteristics.</p>}</div>
  </div>
  <div className="missionHistory"><div className="missionHistoryTop"><div><h5>OBSERVATION HISTORY</h5><p>Record a predicted orbital snapshot with your own note. No GPS, camera image or personal data is uploaded.</p></div><div><button type="button" onClick={download} disabled={!history.length}><Download size={15}/> EXPORT JSON</button><button type="button" onClick={()=>{if(window.confirm('Clear all locally saved satellite observations?')){setHistory([]);setStatus('History cleared on this browser.')}}} disabled={!history.length}><Trash2 size={15}/> CLEAR HISTORY</button></div></div>
   <div className="missionLogForm"><label>OBSERVATION NOTE <input aria-label="Observation journal note" value={note} maxLength={240} onChange={e=>setNote(e.target.value)} placeholder="Example: clear evening sky, attempted sighting…"/></label><button type="button" onClick={save} disabled={!selectedTelemetry}>SAVE OBSERVATION</button></div>
   {status&&<p className="missionStatus" role="status">{status}</p>}
   <div className="missionEntries">{history.length?history.slice(0,15).map(item=><article key={item.id}><div><strong>{item.name}</strong><small>{new Date(item.observedAt).toLocaleString()} · NORAD {item.noradId}</small></div><span>{fmt(item.altitudeKm)} km altitude</span><p>{item.note||'Calculated orbital snapshot; no visual observation note.'}</p><button type="button" onClick={()=>setHistory(prev=>prev.filter(x=>x.id!==item.id))}>REMOVE</button></article>):<p className="missionEmpty">No observations saved yet. Select a satellite with fresh orbital data, add a note and save.</p>}</div>
  </div>
  <p className="missionDisclaimer">Estimates rely on recently published TLE/SGP4 data and are not live downlinked satellite telemetry. Histories remain on this browser, subject to storage clearing. Comparison intentionally limits propagation to three spacecraft per minute for performance.</p>
 </section>;
}
