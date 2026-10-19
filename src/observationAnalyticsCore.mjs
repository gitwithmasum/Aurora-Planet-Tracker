// v4.4 — pure descriptive analytics for browser-local, self-reported sessions.
// Records are grouped by their scheduled local calendar date (not sighting proof).
import {normalizeFieldSessions} from './fieldJournalCore.mjs';

export const ANALYTICS_RANGES=[7,30,90,'all'];
export const ANALYTICS_TYPES=['all','planet','galaxy','satellite','other'];
const safeNumber=value=>typeof value==='number'&&Number.isFinite(value);
const dayStart=value=>{const d=new Date(value);d.setHours(0,0,0,0);return d};
export const localDayKey=value=>{
 const d=value instanceof Date?value:new Date(value);
 if(!Number.isFinite(d.getTime()))return null;
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
};
const csvCell=value=>{
 const raw=String(value??'');
 // CSV escaping plus formula-injection protection for custom target names.
 const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
};
export function analyzeObservationSessions(records,{rangeDays=30,targetType='all',now=Date.now()}={}){
 const range=ANALYTICS_RANGES.includes(rangeDays)?rangeDays:30;
 const type=ANALYTICS_TYPES.includes(targetType)?targetType:'all';
 const nowMs=now instanceof Date?now.getTime():now;
 if(!safeNumber(nowMs))return null;
 const all=normalizeFieldSessions(records);
 const endDay=dayStart(nowMs);
 const cutoff=dayStart(nowMs);
 if(range!=='all')cutoff.setDate(cutoff.getDate()-(range-1));
 const selected=all.filter(item=>{
  if(type!=='all'&&item.targetType!==type)return false;
  if(range==='all')return true;
  const t=Date.parse(item.scheduledAt);
  return t>=cutoff.getTime()&&t<=nowMs;
 });
 const status={planned:0,inProgress:0,completed:0};
 const outcomes={seen:0,notSeen:0,unknown:0};
 const types={planet:0,galaxy:0,satellite:0,other:0};
 const sky={unknown:0,clear:0,'partly-cloudy':0,cloudy:0,rain:0};
 let withNotes=0,withEquipment=0;
 const targets=new Map();
 for(const s of selected){
  if(s.status==='planned')status.planned++;
  if(s.status==='in-progress')status.inProgress++;
  if(s.status==='completed'){
   status.completed++;
   if(s.outcome==='seen')outcomes.seen++;
   else if(s.outcome==='not-seen')outcomes.notSeen++;
   else outcomes.unknown++;
  }
  types[s.targetType]++;
  sky[s.conditions]++;
  if(s.notes)withNotes++;
  if(s.equipment)withEquipment++;
  // Keep custom objects distinct by normalized type/name; use validated catalog ID when present.
  const key=s.targetId||s.targetType+':'+s.targetName.toLocaleLowerCase();
  const record=targets.get(key)||{id:key,name:s.targetName,type:s.targetType,total:0,seen:0,notSeen:0,completed:0};
  record.total++;
  if(s.status==='completed'){
   record.completed++;
   if(s.outcome==='seen')record.seen++;
   if(s.outcome==='not-seen')record.notSeen++;
  }
  targets.set(key,record);
 }
 const targetRows=[...targets.values()].sort((a,b)=>b.total-a.total||b.seen-a.seen||a.name.localeCompare(b.name)).slice(0,20);
 const confirmedAttempts=outcomes.seen+outcomes.notSeen;
 const sightingRatio=confirmedAttempts?outcomes.seen/confirmedAttempts:null;
 const upcoming=all.filter(s=>s.status==='planned'&&Date.parse(s.scheduledAt)>nowMs&&(type==='all'||type===s.targetType)).length;
 // Last N local calendar days; never generate a 90-day chart for a narrow screen.
 const trendDays=range==='all'?30:Math.min(range,30);
 const trendStart=dayStart(nowMs);
 trendStart.setDate(trendStart.getDate()-(trendDays-1));
 const byDate=new Map();
 for(let i=0;i<trendDays;i++){
  const date=new Date(trendStart);date.setDate(trendStart.getDate()+i);
  byDate.set(localDayKey(date),{day:localDayKey(date),scheduled:0,completed:0,seen:0});
 }
 for(const s of selected){
  const key=localDayKey(s.scheduledAt);
  const bar=byDate.get(key);
  if(!bar)continue;
  bar.scheduled++;
  if(s.status==='completed'){bar.completed++;if(s.outcome==='seen')bar.seen++;}
 }
 const trend=[...byDate.values()];
 return {
  generatedAt:new Date(nowMs).toISOString(),rangeDays:range,targetType:type,
  basis:'scheduled local calendar date',total:selected.length,
  status,outcomes,types,sky,withNotes,withEquipment,upcoming,
  uniqueTargets:targets.size,confirmedAttempts,sightingRatio,
  targets:targetRows,trend,trendDays,
  limits:'Self-reported observations, not independently verified sightings; ratio includes completed sessions explicitly marked seen or not-seen only.'
 };
}
export function observationAnalyticsJSON(analysis){
 if(!analysis)return null;
 // Explicitly aggregate-only: do not export notes, observer names or GPS.
 return JSON.stringify({format:'aurora-observation-analytics-v1',...analysis},null,2);
}
export function observationAnalyticsCSV(analysis){
 if(!analysis)return null;
 const rows=['section,name,type,total,completed,marked_seen,marked_not_seen'];
 const r=analysis;
 rows.push(['summary','Sessions','all',r.total,r.status.completed,r.outcomes.seen,r.outcomes.notSeen].map(csvCell).join(','));
 for(const t of r.targets)rows.push(['target',t.name,t.type,t.total,t.completed,t.seen,t.notSeen].map(csvCell).join(','));
 rows.push('');
 rows.push('day,scheduled_sessions,completed_sessions,marked_seen');
 for(const d of r.trend)rows.push([d.day,d.scheduled,d.completed,d.seen].map(csvCell).join(','));
 return rows.join('\r\n')+'\r\n';
}
export function observationAnalyticsReport(analysis){
 if(!analysis)return null;
 const a=analysis;
 const fmt=n=>n===null?'Not available':(n*100).toFixed(1)+'%';
 return [
  'AURORA PLANET TRACKER — OBSERVATION ANALYTICS REPORT',
  'Generated: '+a.generatedAt,'Range: '+(a.rangeDays==='all'?'All recorded sessions':'Last '+a.rangeDays+' calendar days'),
  'Target category: '+a.targetType,'Grouping basis: '+a.basis,
  'Source: browser-local, self-reported field journal',
  'IMPORTANT: Recorded outcomes are not independent verification of visual sightings.',
  'No personal coordinates, observing notes, or observer names are included in this aggregate report.',
  '',
  'Total sessions: '+a.total+' | Planned: '+a.status.planned+' | In progress: '+a.status.inProgress+' | Completed: '+a.status.completed,
  'Self-reported seen: '+a.outcomes.seen+' | Not seen: '+a.outcomes.notSeen+' | Unknown outcome: '+a.outcomes.unknown,
  'Self-reported seen / explicitly answered attempts: '+fmt(a.sightingRatio)+' (n='+a.confirmedAttempts+')',
  'Distinct targets: '+a.uniqueTargets+' | Sessions with notes: '+a.withNotes+' | With equipment: '+a.withEquipment,
  '',
  'TARGET SUMMARY',
  ...a.targets.map((t,i)=>String(i+1)+'. '+t.name+' ('+t.type+') — sessions '+t.total+', completed '+t.completed+', seen '+t.seen+', not seen '+t.notSeen),
  '',
  'Recent local-day timeline (sessions grouped by planned date):',
  ...a.trend.map(t=>t.day+': scheduled '+t.scheduled+', completed '+t.completed+', marked seen '+t.seen),
  '',
  a.limits
 ].join('\n');
}
