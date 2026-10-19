import React,{useEffect,useMemo,useRef,useState} from 'react';
import {BookOpen,CalendarDays,CheckCircle2,Clock3,Download,Edit3,FileText,FolderOpen,MapPin,Play,Plus,Save,Search,Trash2,Upload,X} from 'lucide-react';
import {OBSERVATION_TARGETS} from './observationForecast.mjs';
import {DEFAULT_SATELLITES} from './satelliteCatalog.mjs';
import {JOURNAL_KEY,JOURNAL_FORMAT,JOURNAL_LIMIT,createFieldSession,updateFieldSession,normalizeFieldSessions,mergeFieldSessions,journalSummary,journalJSON,journalCSV,journalTextReport} from './fieldJournalCore.mjs';
import {useLanguage} from './i18n.jsx';
import './FieldJournal.css';

const targetOptions=[
 ...OBSERVATION_TARGETS.map(t=>({key:t.id,id:t.id,name:t.name,type:t.type})),
 ...DEFAULT_SATELLITES.map(s=>({key:'satellite:'+s.id,id:'satellite:'+s.id,name:s.name,type:'satellite'})),
 {key:'other',id:'other',name:'Other / Custom',type:'other'}
];
const targetMap=new Map(targetOptions.map(t=>[t.key,t]));
const localInput=ms=>{
 const date=new Date(ms);
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
};
const formatDate=value=>value?new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'—';
const initialDraft=()=>({
 targetKey:'planet:Mars',customTarget:'',title:'',scheduledLocal:localInput(Date.now()),
 status:'planned',outcome:'not-attempted',conditions:'unknown',seeing:'unknown',equipment:'',notes:''
});
function readJournal(){
 try{return normalizeFieldSessions(JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]'))}catch{return []}
}
function fileDownload(name,text,mime){
 const blob=new Blob([text],{type:mime});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function FieldJournal({location,now,onNavigate,onPlanet,onGalaxy,onSatellite,initialTarget=null,onPrefillConsumed}){
 const {language}=useLanguage(),bn=language==='bn';
 const label=(english,bangla)=>bn?bangla:english;
 const [sessions,setSessions]=useState(readJournal);
 const [editingId,setEditingId]=useState(null),[draft,setDraft]=useState(initialDraft);
 const [showForm,setShowForm]=useState(false),[filter,setFilter]=useState('all'),[term,setTerm]=useState('');
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const picker=useRef(null);
 useEffect(()=>{
  if(!initialTarget)return;
  const known=targetMap.get(initialTarget.targetKey);
  const targetName=known?.type==='other'?String(initialTarget.targetName||''):known?.name||String(initialTarget.targetName||'');
  const date=Number.isFinite(initialTarget.scheduledMs)?initialTarget.scheduledMs:Date.now();
  setEditingId(null);
  setDraft({...initialDraft(),targetKey:known?.key||'other',
   customTarget:known?.type==='other'?String(initialTarget.targetName||''):known?'':targetName,
   title:'Observe '+targetName.slice(0,110),
   scheduledLocal:localInput(date)
  });
  setShowForm(true);setMessage('');setError('');
  onPrefillConsumed?.();
 },[initialTarget,onPrefillConsumed]);
 useEffect(()=>{
  const listener=event=>{
   if(event.key!==JOURNAL_KEY)return;
   setSessions(normalizeFieldSessions(event.newValue?safeJSON(event.newValue):[]));
  };
  const safeJSON=text=>{try{return JSON.parse(text)}catch{return []}};
  // Changes in another tab are read, but are never re-broadcast back into storage.
  window.addEventListener('storage',listener);
  return()=>window.removeEventListener('storage',listener);
 },[]);
 function persist(next){
  const clean=normalizeFieldSessions(next);
  try{
   localStorage.setItem(JOURNAL_KEY,JSON.stringify(clean));
   setSessions(clean);setError('');return true;
  }catch{
   setError(label('Browser storage is unavailable or full. Export your journal to avoid losing entries.','ব্রাউজার স্টোরেজে সংরক্ষণ সম্ভব হচ্ছে না। তথ্য হারানো এড়াতে জার্নাল এক্সপোর্ট করুন।'));
   return false;
  }
 }
 const summary=useMemo(()=>journalSummary(sessions),[sessions]);
 const visible=useMemo(()=>{
  const q=term.trim().toLowerCase();
  return sessions.filter(s=>(filter==='all'||s.status===filter)&&(!q||[s.title,s.targetName,s.notes,s.equipment].some(x=>x.toLowerCase().includes(q))));
 },[sessions,filter,term]);
 const choice=targetMap.get(draft.targetKey)||targetMap.get('other');
 const setField=(field,value)=>setDraft(prev=>({...prev,[field]:value}));
 function newSession(){
  setEditingId(null);setDraft(initialDraft());setShowForm(true);setMessage('');setError('');
 }
 function editSession(record){
  const exists=targetOptions.find(t=>t.id===record.targetId);
  setEditingId(record.id);
  setDraft({title:record.title,targetKey:exists?.key||'other',customTarget:exists?'':record.targetName,
   scheduledLocal:localInput(record.scheduledAt),status:record.status,outcome:record.outcome,
   conditions:record.conditions,seeing:record.seeing,equipment:record.equipment,notes:record.notes});
  setShowForm(true);setMessage('');setError('');
 }
 function saveForm(event){
  event.preventDefault();
  const scheduledAt=new Date(draft.scheduledLocal);
  if(!Number.isFinite(scheduledAt.getTime())){setError(label('Choose a valid date and time.','সঠিক তারিখ ও সময় নির্বাচন করুন।'));return;}
  const name=(choice?.type==='other'?draft.customTarget:choice?.name||'').trim();
  if(!name){setError(label('Choose a target or enter a custom target name.','লক্ষ্য নির্বাচন করুন অথবা কাস্টম নাম লিখুন।'));return;}
  const utc=scheduledAt.toISOString(),timestamp=new Date().toISOString();
  const title=draft.title.trim()||'Observe '+name;
  let updated;
  if(editingId){
   const original=sessions.find(r=>r.id===editingId);
   updated=updateFieldSession(original,{
    title,scheduledAt:utc,status:draft.status,outcome:draft.outcome,
    conditions:draft.conditions,seeing:draft.seeing,equipment:draft.equipment,notes:draft.notes
   },timestamp);
  }else{
   if(sessions.length>=JOURNAL_LIMIT){
    setError(label('Journal limit reached. Export and remove older entries before adding more.','জার্নালের সীমা পূর্ণ। নতুন তথ্যের আগে পুরোনো তথ্য এক্সপোর্ট ও সরিয়ে নিন।'));return;
   }
   const id='session-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
   updated=createFieldSession({
    id,title,targetName:name,targetType:choice.type,targetId:choice.type==='other'?'':choice.id,
    scheduledAt:utc,createdAt:timestamp,equipment:draft.equipment,notes:draft.notes,
    observer:{label:location?.label||'Manual observer',lat:location?.lat,lon:location?.lon}
   });
  }
  if(!updated){setError(label('Session data is invalid. Please review its fields.','সেশনের তথ্য সঠিক নয়। আবার যাচাই করুন।'));return;}
  const next=editingId?sessions.map(s=>s.id===editingId?updated:s):[updated,...sessions];
  if(persist(next)){
   setMessage(editingId?label('Session updated locally.','সেশন আপডেট হয়েছে।'):label('Session planned and saved locally.','সেশন পরিকল্পনা ও সংরক্ষণ করা হয়েছে।'));
   setEditingId(null);setDraft(initialDraft());setShowForm(false);
  }
 }
 function transition(record,status,outcome='not-attempted'){
  const next=updateFieldSession(record,{status,outcome},new Date().toISOString());
  if(next&&persist(sessions.map(s=>s.id===record.id?next:s))){
   setMessage(status==='completed'?label('Outcome recorded from your own observation.','তোমার নিজস্ব পর্যবেক্ষণের ফলাফল সংরক্ষিত হয়েছে।'):label('Session started.','সেশন শুরু হয়েছে।'));
  }
 }
 function remove(record){
  if(!window.confirm(label('Delete this session permanently from this browser?','এই ব্রাউজার থেকে সেশনটি স্থায়ীভাবে মুছে ফেলবে?')))return;
  if(persist(sessions.filter(s=>s.id!==record.id)))setMessage(label('Session deleted.','সেশন মুছে ফেলা হয়েছে।'));
  if(editingId===record.id){setEditingId(null);setShowForm(false);}
 }
 function openTarget(record){
  if(record.targetType==='planet')onPlanet(record.targetName);
  else if(record.targetType==='galaxy')onGalaxy(record.targetId.replace(/^galaxy:/,''));
  else if(record.targetType==='satellite')onSatellite(record.targetId.replace(/^satellite:/,''));
  else onNavigate('Sky Tonight');
 }
 async function importJournal(event){
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;
  if(file.size>1024*1024){setError(label('JSON file must not exceed 1 MB.','JSON ফাইল ১ MB-এর বেশি হতে পারবে না।'));return;}
  try{
   const json=JSON.parse(await file.text());
   if(!json||json.format!==JOURNAL_FORMAT||!Array.isArray(json.sessions))throw Error('Invalid Aurora journal JSON format');
   const incoming=normalizeFieldSessions(json.sessions);
   if(!incoming.length)throw Error('No valid session records in this backup');
   const merged=mergeFieldSessions(sessions,incoming);
   if(persist(merged))setMessage(label('Imported '+incoming.length+' valid session(s). Newer copies take precedence.','সফলভাবে '+incoming.length+'টি বৈধ সেশন আমদানি হয়েছে। নতুন সংস্করণ প্রাধান্য পেয়েছে।'));
  }catch(e){setError(label('Import failed: ','আমদানি ব্যর্থ: ')+(e.message||'Invalid backup'));}
 }
 function exportType(type){
  if(!sessions.length)return;
  if(type==='json')fileDownload('aurora-field-journal.json',journalJSON(sessions),'application/json;charset=utf-8');
  else if(type==='csv')fileDownload('aurora-field-journal.csv',journalCSV(sessions),'text/csv;charset=utf-8');
  else fileDownload('aurora-observation-report.txt',journalTextReport(sessions),'text/plain;charset=utf-8');
 }
 return <section className="fieldJournal" aria-label="Astronomy Observation Sessions and Field Log">
  <div className="fieldJournalHero"><div>
   <span className="fieldJournalEyebrow">AURORA / RESEARCH FIELD STATION / v4.3</span>
   <h3><BookOpen size={27}/>{label('Observation Sessions & Field Log','পর্যবেক্ষণ সেশন ও ফিল্ড লগ')}</h3>
   <p>{label('Plan your observing sessions, record what you actually saw, and export a private scientific field journal.','পর্যবেক্ষণ পরিকল্পনা, বাস্তবে যা দেখেছ তা লিখে রাখা এবং ব্যক্তিগত ফিল্ড জার্নাল এক্সপোর্ট করার ব্যবস্থা।')}</p>
  </div><button type="button" onClick={newSession}><Plus size={17}/>{label('NEW SESSION','নতুন সেশন')}</button></div>
  <div className="fieldJournalStats">
   <div><small>{label('TOTAL SESSIONS','মোট সেশন')}</small><strong>{summary.total}</strong></div>
   <div><small>{label('PLANNED','পরিকল্পিত')}</small><strong>{summary.planned}</strong></div>
   <div><small>{label('IN PROGRESS','চলমান')}</small><strong>{summary.inProgress}</strong></div>
   <div><small>{label('COMPLETED','সম্পন্ন')}</small><strong>{summary.completed}</strong></div>
   <div><small>{label('MARKED SEEN','দেখা হয়েছে বলে চিহ্নিত')}</small><strong>{summary.confirmedByUser}</strong></div>
  </div>
  <div className="fieldJournalToolbar">
   <button type="button" onClick={newSession}><Plus size={15}/>{label('ADD','যোগ')}</button>
   <button type="button" disabled={!sessions.length} onClick={()=>exportType('json')}><Download size={15}/> JSON</button>
   <button type="button" disabled={!sessions.length} onClick={()=>exportType('csv')}><Download size={15}/> CSV</button>
   <button type="button" disabled={!sessions.length} onClick={()=>exportType('report')}><FileText size={15}/>{label('REPORT','রিপোর্ট')}</button>
   <button type="button" onClick={()=>picker.current?.click()}><Upload size={15}/>{label('IMPORT BACKUP','ব্যাকআপ আমদানি')}</button>
   <input ref={picker} type="file" accept=".json,application/json" hidden onChange={importJournal} aria-label="Import Aurora field journal JSON backup"/>
  </div>
  {message&&<p className="fieldJournalSuccess" role="status">{message}</p>}
  {error&&<p className="fieldJournalError" role="alert">{error}</p>}
  {showForm&&<form className="fieldJournalForm" onSubmit={saveForm}>
   <div className="fieldJournalFormHead"><h4>{editingId?label('EDIT SESSION','সেশন সম্পাদনা'):label('PLAN A NEW SESSION','নতুন পর্যবেক্ষণ পরিকল্পনা')}</h4><button type="button" onClick={()=>{setShowForm(false);setEditingId(null);}} aria-label="Close session editor"><X size={18}/></button></div>
   <div className="fieldJournalGrid">
    <label>{label('TARGET','লক্ষ্য')}<select disabled={!!editingId} value={draft.targetKey} onChange={e=>{setField('targetKey',e.target.value);}}>{targetOptions.map(item=><option key={item.key} value={item.key}>{item.name} ({item.type})</option>)}</select></label>
    {choice?.type==='other'&&<label>{label('CUSTOM TARGET NAME','কাস্টম লক্ষ্য')}<input disabled={!!editingId} value={draft.customTarget} maxLength={110} onChange={e=>setField('customTarget',e.target.value)} required={!editingId} placeholder="e.g. Orion Nebula"/></label>}
    <label>{label('SESSION TITLE','সেশনের শিরোনাম')}<input value={draft.title} maxLength={120} onChange={e=>setField('title',e.target.value)} placeholder={label('Optional — auto-created from target','ঐচ্ছিক — লক্ষ্য থেকে তৈরি হবে')}/></label>
    <label>{label('PLANNED TIME','পরিকল্পিত সময়')}<input type="datetime-local" value={draft.scheduledLocal} onChange={e=>setField('scheduledLocal',e.target.value)} required/></label>
    {editingId&&<label>{label('STATUS','অবস্থা')}<select value={draft.status} onChange={e=>setField('status',e.target.value)}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>}
    {editingId&&draft.status==='completed'&&<label>{label('ACTUAL SIGHTING RESULT','বাস্তব পর্যবেক্ষণের ফলাফল')}<select value={draft.outcome} onChange={e=>setField('outcome',e.target.value)}><option value="not-attempted">Not attempted / unknown</option><option value="seen">Observed by me</option><option value="not-seen">Not observed</option></select></label>}
    <label>{label('SKY CONDITIONS','আকাশের অবস্থা')}<select value={draft.conditions} onChange={e=>setField('conditions',e.target.value)}><option value="unknown">Unknown</option><option value="clear">Clear</option><option value="partly-cloudy">Partly cloudy</option><option value="cloudy">Cloudy</option><option value="rain">Rain</option></select></label>
    <label>{label('ATMOSPHERIC SEEING','বায়ুমণ্ডলীয় স্থিরতা')}<select value={draft.seeing} onChange={e=>setField('seeing',e.target.value)}><option value="unknown">Unknown</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></label>
    <label className="fieldJournalWide">{label('EQUIPMENT','যন্ত্রপাতি')}<input value={draft.equipment} maxLength={160} onChange={e=>setField('equipment',e.target.value)} placeholder={label('Naked eye, binoculars, telescope…','খালি চোখ, বাইনোকুলার, টেলিস্কোপ…')}/></label>
    <label className="fieldJournalWide">{label('FIELD NOTES','পর্যবেক্ষণের নোট')}<textarea rows={4} maxLength={2000} value={draft.notes} onChange={e=>setField('notes',e.target.value)} placeholder={label('Record what you saw, obstacles, equipment settings, or things to verify.','কী দেখেছ, বাধা, যন্ত্রের সেটিংস বা পরে যাচাই করতে হবে এমন তথ্য লেখো।')}/></label>
   </div>
   <p className="fieldJournalPrivacy"><MapPin size={14}/>{editingId?label('Original observer snapshot is preserved.','মূল পর্যবেক্ষক অবস্থান অপরিবর্তিত থাকবে।'):label('Saving this session stores your currently selected observer name and coordinates locally in this browser.','সেশন সংরক্ষণ করলে নির্বাচিত পর্যবেক্ষকের নাম ও স্থানাঙ্ক শুধু এই ব্রাউজারে থাকবে।')}</p>
   <div className="fieldJournalFormActions"><button type="submit"><Save size={16}/>{editingId?label('SAVE CHANGES','পরিবর্তন সংরক্ষণ'):label('SAVE SESSION','সেশন সংরক্ষণ')}</button><button type="button" onClick={()=>{setShowForm(false);setEditingId(null)}}>{label('CANCEL','বাতিল')}</button></div>
  </form>}
  <div className="fieldJournalHistoryHeader"><div><h4>{label('OBSERVATION HISTORY','পর্যবেক্ষণের ইতিহাস')}</h4><p>{label('Predicted positions do not count as real sightings. Only your own recorded outcome does.','গণনাভিত্তিক অবস্থানকে বাস্তব পর্যবেক্ষণ ধরা হয় না; শুধুমাত্র তোমার রেকর্ড করা ফলাফল গণনা হয়।')}</p></div></div>
  <div className="fieldJournalFilters"><label><Search size={15}/><input aria-label="Search observation journal" value={term} onChange={e=>setTerm(e.target.value)} placeholder={label('Find sessions, targets or notes…','সেশন, লক্ষ্য বা নোট খুঁজুন…')}/></label>
   <select aria-label="Filter field log by session status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All sessions</option><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select>
  </div>
  <div className="fieldJournalEntries">
   {visible.length?visible.map(record=><article className="fieldJournalEntry" key={record.id}>
    <div className="fieldJournalEntryHead"><span className={'fieldJournalStatus fieldJournalStatus--'+record.status}>{record.status.replace('-',' ').toUpperCase()}</span><span>{record.targetType.toUpperCase()}</span></div>
    <h5>{record.title}</h5><p className="fieldJournalTarget">{record.targetName}</p>
    <div className="fieldJournalFacts"><span><CalendarDays size={14}/>{formatDate(record.scheduledAt)}</span><span><MapPin size={14}/>{record.observer?.label||'Not recorded'}</span>
     {record.status==='completed'&&<span><CheckCircle2 size={14}/>{record.outcome==='seen'?'SELF-REPORTED: OBSERVED':record.outcome==='not-seen'?'NOT OBSERVED':'NOT ATTEMPTED / UNKNOWN'}</span>}
     <span>{label('Sky','আকাশ')}: {record.conditions} · {label('Seeing','স্থিরতা')}: {record.seeing}</span>
    </div>
    {record.equipment&&<p className="fieldJournalEquipment">{label('Equipment','যন্ত্রপাতি')}: {record.equipment}</p>}
    {record.notes&&<p className="fieldJournalNotes">{record.notes}</p>}
    <div className="fieldJournalEntryActions">
     {record.status==='planned'&&<button type="button" onClick={()=>transition(record,'in-progress')}><Play size={14}/>{label('START','শুরু')}</button>}
     {record.status!=='completed'&&<button type="button" onClick={()=>transition(record,'completed','seen')}><CheckCircle2 size={14}/>{label('I OBSERVED IT','আমি দেখেছি')}</button>}
     {record.status!=='completed'&&<button type="button" onClick={()=>transition(record,'completed','not-seen')}>{label('NOT SEEN','দেখিনি')}</button>}
     <button type="button" onClick={()=>editSession(record)}><Edit3 size={14}/>{label('EDIT','সম্পাদনা')}</button>
     <button type="button" onClick={()=>openTarget(record)}><FolderOpen size={14}/>{label('OPEN TARGET','লক্ষ্য খুলুন')}</button>
     <button type="button" className="fieldJournalDelete" onClick={()=>remove(record)}><Trash2 size={14}/>{label('DELETE','মুছুন')}</button>
    </div>
   </article>):<p className="fieldJournalEmpty">{sessions.length?label('No sessions match the current filters.','ফিল্টারে কোনো সেশন মেলেনি।'):label('Your field journal is empty. Create a session to start recording real observations.','জার্নাল খালি আছে। বাস্তব পর্যবেক্ষণ লিখতে প্রথম সেশন তৈরি করুন।')}</p>}
  </div>
  <p className="fieldJournalDisclosure">{label('Privacy & method: This journal stores self-reported data and optional observer coordinates in this browser only (up to 150 sessions). No cloud sync, background notifications or verified sighting claims are made. JSON backup and CSV/text exports include your field notes and saved coordinates; share them only intentionally. Browser storage may be erased, so export backups.','গোপনীয়তা: সর্বোচ্চ ১৫০টি সেশন ও নির্বাচিত স্থানাঙ্ক শুধু এই ব্রাউজারে সংরক্ষিত হয়। Cloud sync বা নিশ্চিত বৈজ্ঞানিক sighting দাবি করা হয় না। JSON/CSV রিপোর্টে নোট ও সংরক্ষিত স্থানাঙ্ক থাকতে পারে—সতর্কভাবে শেয়ার করুন। ব্রাউজার ডেটা মুছে গেলে তথ্য হারাতে পারে, তাই ব্যাকআপ রাখুন।')}</p>
 </section>;
}
