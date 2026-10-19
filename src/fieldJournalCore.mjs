// v4.3 — browser-local observation sessions. A prediction is never a sighting.
export const JOURNAL_KEY='aurora-field-sessions-v1';
export const JOURNAL_FORMAT='aurora-field-sessions-v1';
export const JOURNAL_LIMIT=150;
export const SESSION_STATUS=['planned','in-progress','completed'];
export const SIGHTING_STATUS=['not-attempted','seen','not-seen'];
export const SKY_CONDITIONS=['unknown','clear','partly-cloudy','cloudy','rain'];
export const SEEING_CONDITIONS=['unknown','excellent','good','fair','poor'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clean=(value,max)=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,max);
const stamp=value=>{
 if(value===null||value===undefined||value==='')return null;
 const date=new Date(value);
 return Number.isFinite(date.getTime())&&date.getUTCFullYear()>=2000&&date.getUTCFullYear()<=2100?date.toISOString():null;
};
const oneOf=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
function observerSnapshot(input){
 if(!input||typeof input!=='object')return null;
 const label=clean(input.label,120);
 const lat=input.lat,lon=input.lon;
 if(!finite(lat)||!finite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return label?{label,lat:null,lon:null}:null;
 return {label:label||'Selected observer',lat,lon};
}
export function normalizeFieldSession(item){
 if(!item||typeof item!=='object'||Array.isArray(item))return null;
 const id=clean(item.id,90);
 const title=clean(item.title,120);
 const type=oneOf(item.targetType,['planet','galaxy','satellite','other'],'other');
 const name=clean(item.targetName,110);
 const scheduledAt=stamp(item.scheduledAt);
 const createdAt=stamp(item.createdAt);
 const updatedAt=stamp(item.updatedAt);
 if(!/^[a-zA-Z0-9_-]{3,90}$/.test(id)||!title||!name||!scheduledAt||!createdAt||!updatedAt)return null;
 const status=oneOf(item.status,SESSION_STATUS,'planned');
 const outcome=oneOf(item.outcome,SIGHTING_STATUS,'not-attempted');
 const startedAt=stamp(item.startedAt),completedAt=stamp(item.completedAt);
 return {
  id,title,targetType:type,targetName:name,targetId:clean(item.targetId,100),
  scheduledAt,createdAt,updatedAt,status,
  startedAt,completedAt,
  outcome:status==='completed'?outcome:'not-attempted',
  conditions:oneOf(item.conditions,SKY_CONDITIONS,'unknown'),
  seeing:oneOf(item.seeing,SEEING_CONDITIONS,'unknown'),
  equipment:clean(item.equipment,160),
  notes:clean(item.notes,2000),
  observer:observerSnapshot(item.observer)
 };
}
export function createFieldSession({
 id,title,targetType,targetName,targetId='',scheduledAt,observer=null,
 equipment='',notes='',createdAt=new Date().toISOString()
}={}){
 return normalizeFieldSession({
  id,title,targetType,targetName,targetId,scheduledAt,observer,equipment,notes,createdAt,updatedAt:createdAt,
  status:'planned',outcome:'not-attempted',conditions:'unknown',seeing:'unknown',
  startedAt:null,completedAt:null
 });
}
export function updateFieldSession(session,patch,now=new Date().toISOString()){
 if(!session||!patch||typeof patch!=='object')return null;
 // Never permit an edit to replace the stable ID, creation timestamp or target.
 const allowed=['title','scheduledAt','status','outcome','conditions','seeing','equipment','notes','observer'];
 const safe=Object.fromEntries(allowed.filter(key=>Object.hasOwn(patch,key)).map(key=>[key,patch[key]]));
 const nextStatus=oneOf(safe.status??session.status,SESSION_STATUS,session.status);
 const changed=nextStatus!==session.status;
 const joined={
  ...session,...safe,status:nextStatus,id:session.id,createdAt:session.createdAt,
  targetId:session.targetId,targetType:session.targetType,targetName:session.targetName,
  updatedAt:now,
  startedAt:nextStatus==='in-progress'&&!session.startedAt?now:session.startedAt,
  completedAt:nextStatus==='completed'&&!session.completedAt?now:session.completedAt
 };
 if(nextStatus!=='completed'){joined.outcome='not-attempted';if(changed)joined.completedAt=null;}
 return normalizeFieldSession(joined);
}
export function normalizeFieldSessions(records){
 if(!Array.isArray(records))return [];
 const map=new Map();
 for(const candidate of records.slice(0,500)){
  const record=normalizeFieldSession(candidate);
  if(!record)continue;
  const prior=map.get(record.id);
  if(!prior||record.updatedAt>prior.updatedAt)map.set(record.id,record);
 }
 return [...map.values()].sort((a,b)=>b.scheduledAt.localeCompare(a.scheduledAt)||b.createdAt.localeCompare(a.createdAt)).slice(0,JOURNAL_LIMIT);
}
export function mergeFieldSessions(existing,incoming){
 return normalizeFieldSessions([...normalizeFieldSessions(existing),...normalizeFieldSessions(incoming)]);
}
export function journalSummary(records){
 const items=normalizeFieldSessions(records);
 return {total:items.length,planned:items.filter(x=>x.status==='planned').length,
  inProgress:items.filter(x=>x.status==='in-progress').length,
  completed:items.filter(x=>x.status==='completed').length,
  confirmedByUser:items.filter(x=>x.status==='completed'&&x.outcome==='seen').length,
  notSeen:items.filter(x=>x.status==='completed'&&x.outcome==='not-seen').length};
}
export function journalJSON(records,createdAt=new Date().toISOString()){
 return JSON.stringify({format:JOURNAL_FORMAT,exportedAt:createdAt,
  disclaimer:'Self-reported field notes. Astronomical estimates and planned sessions do not establish visual confirmation.',
  sessions:normalizeFieldSessions(records)},null,2);
}
const csvField=value=>{
 let x=String(value??'');
 // Spreadsheet programs may interpret user-supplied text as formulae.
 if(/^[\s]*[=+@-]/.test(x))x="'"+x;
 return '"'+x.replace(/"/g,'""')+'"';
};
export function journalCSV(records){
 const columns=['id','title','targetType','targetName','status','outcome','scheduledAt','startedAt','completedAt','conditions','seeing','equipment','notes','observerLabel','latitude','longitude'];
 const rows=normalizeFieldSessions(records).map(r=>({
  ...r,observerLabel:r.observer?.label??'',latitude:r.observer?.lat??'',longitude:r.observer?.lon??''
 }));
 return [columns.join(','),...rows.map(row=>columns.map(col=>csvField(row[col])).join(','))].join('\r\n')+'\r\n';
}
export function journalTextReport(records,createdAt=new Date().toISOString()){
 const items=normalizeFieldSessions(records),summary=journalSummary(items);
 const lines=[
  'AURORA PLANET TRACKER — OBSERVATION FIELD REPORT',
  'Generated: '+createdAt,'Source: Self-reported browser-local notes',
  'Disclaimer: Planned targets, estimated positions and personal notes are not independently verified sightings.',
  '',
  'Sessions: '+summary.total+' | Planned: '+summary.planned+' | In progress: '+summary.inProgress+' | Completed: '+summary.completed,
  'Marked seen by observer: '+summary.confirmedByUser+' | Marked not seen: '+summary.notSeen,
  ''
 ];
 for(const [index,r] of items.entries()){
  lines.push((index+1)+'. '+r.title,
   'Target: '+r.targetName+' ('+r.targetType+')',
   'Scheduled: '+r.scheduledAt+' | Status: '+r.status+' | Outcome: '+r.outcome,
   'Observer: '+(r.observer?.label||'Not recorded'),
   'Conditions: '+r.conditions+' | Seeing: '+r.seeing+' | Equipment: '+(r.equipment||'Not recorded'),
   'Notes: '+(r.notes||'None'), '');
 }
 return lines.join('\n');
}
