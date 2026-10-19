// v4.1 — pure, sample-based observing-window planner.
// A window is a conservative sequence of qualifying samples, not an exact
// rise/set prediction, weather forecast, or guarantee of optical visibility.
export const PLANNER_STEP_MINUTES=15;
export const PLANNER_HOURS=24;
export const SUN_LIMITS=[-6,-12,-18];
const finite=value=>typeof value==='number'&&Number.isFinite(value);
export function validPlannerCoordinates(location){
 const lat=location?.lat,lon=location?.lon;
 return finite(lat)&&finite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
}
export function normalizeWatchlist(value,validIds){
 const allow=new Set(validIds);
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter(x=>typeof x==='string'&&allow.has(x)))].slice(0,32);
}
export function planObservationWindows({
 targets=[],startMs,hours=PLANNER_HOURS,stepMinutes=PLANNER_STEP_MINUTES,
 minAltitude=20,sunLimit=-12,getSunAltitude,getTargetPosition
}={}){
 if(!finite(startMs)||!finite(hours)||hours<=0||hours>48||!finite(stepMinutes)||stepMinutes<5||
    stepMinutes>60||!finite(minAltitude)||minAltitude<0||minAltitude>90||
    !SUN_LIMITS.includes(sunLimit)||typeof getSunAltitude!=='function'||
    typeof getTargetPosition!=='function')return [];
 const totalSteps=Math.floor(hours*60/stepMinutes);
 if(totalSteps<1)return [];
 const stepMs=stepMinutes*60000;
 // Sun is sampled only once per step rather than separately for every target.
 const sunSamples=Array.from({length:totalSteps+1},(_,i)=>getSunAltitude(startMs+i*stepMs));
 const output=[];
 for(const target of targets){
  if(!target||typeof target.id!=='string')continue;
  const windows=[];
  let active=null;
  const close=()=>{
   if(active&&active.endMs-active.startMs>=stepMs)windows.push(active);
   active=null;
  };
  for(let i=0;i<=totalSteps;i++){
   const time=startMs+i*stepMs;
   const sun=sunSamples[i];
   const position=finite(sun)&&sun<=sunLimit?getTargetPosition(target,time):null;
   const ok=finite(position?.alt)&&position.alt>=minAltitude&&finite(position?.az);
   if(!ok){close();continue}
   if(!active)active={startMs:time,endMs:time,peakMs:time,peakAltitude:position.alt,peakAzimuth:position.az,stepMinutes};
   else{
    active.endMs=time;
    if(position.alt>active.peakAltitude){active.peakAltitude=position.alt;active.peakMs=time;active.peakAzimuth=position.az}
   }
  }
  close();
  if(windows.length)output.push({...target,windows,next:windows[0]});
 }
 return output.sort((a,b)=>a.next.startMs-b.next.startMs||b.next.peakAltitude-a.next.peakAltitude||a.name.localeCompare(b.name));
}
export function escapeCalendarText(value){
 return String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}
const utcStamp=milliseconds=>new Date(milliseconds).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function observationCalendar(windows,{createdMs=Date.now(),observerLabel='Selected observer'}={}){
 if(!finite(createdMs))return null;
 const usable=windows.filter(x=>x&&finite(x.startMs)&&finite(x.endMs)&&x.endMs>x.startMs&&typeof x.name==='string');
 if(!usable.length)return null;
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aurora Planet Tracker//Observation Planner v4.1//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const item of usable.slice(0,32)){
  const uid=(item.id||item.name).replace(/[^a-z0-9-]/gi,'-').slice(0,48);
  const description='Estimated observing window from sampled geometric altitudes and Sun twilight threshold. Not a weather forecast or optical-visibility guarantee. Observer: '+observerLabel;
  lines.push('BEGIN:VEVENT','UID:'+uid+'-'+item.startMs+'@aurora-planet-tracker',
   'DTSTAMP:'+utcStamp(createdMs),'DTSTART:'+utcStamp(item.startMs),
   'DTEND:'+utcStamp(item.endMs),'SUMMARY:'+escapeCalendarText('Observe '+item.name),
   'DESCRIPTION:'+escapeCalendarText(description),'END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 // RFC 5545 CRLF; lines are short enough for typical clients but fold long lines.
 const folded=lines.flatMap(line=>{
  const chunks=[];
  let rest=line;
  // UTF-8 octet-aware folding keeps multibyte characters intact.
  while(rest.length){
   let cut=Math.min(68,rest.length);
   while(cut>1&&new TextEncoder().encode(rest.slice(0,cut)).length>70)cut--;
   chunks.push((chunks.length?' ':'')+rest.slice(0,cut));rest=rest.slice(cut);
  }
  return chunks.length?chunks:[''];
 });
 return folded.join('\r\n')+'\r\n';
}
