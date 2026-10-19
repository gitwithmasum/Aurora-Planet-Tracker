import React,{useEffect,useMemo,useState} from 'react';
import {CalendarDays,Bookmark,BookmarkCheck,Compass,Clock3,ArrowUpRight,Info,Moon,Download,SlidersHorizontal,BookOpen} from 'lucide-react';
import {observationForecast,OBSERVATION_TARGETS} from './observationForecast.mjs';
import {normalizeWatchlist,observationCalendar,PLANNER_STEP_MINUTES} from './observationPlannerCore.mjs';
import {useLanguage} from './i18n.jsx';
import './ObservationPlanner.css';

const STORAGE_KEY='aurora-observation-targets-v1';
const validIds=OBSERVATION_TARGETS.map(t=>t.id);
const dateLabel=ms=>new Date(ms).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const bearing=az=>Number.isFinite(az)?['N','NE','E','SE','S','SW','W','NW'][Math.round((az%360+360)%360/45)%8]:'—';
const estimateDuration=item=>Math.round((item.endMs-item.startMs)/60000);
function readSaved(){
 try{return normalizeWatchlist(JSON.parse(localStorage.getItem(STORAGE_KEY)),validIds)}catch{return []}
}
function exportCalendar(entries,observer){
 const ics=observationCalendar(entries,{observerLabel:observer});
 if(!ics)return;
 const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download='aurora-observation-plan.ics';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function ObservationPlanner({location,now,onPlanet,onGalaxy,onNavigate,onLogTarget}){
 const {language}=useLanguage();
 const bn=language==='bn';
 const txt=(en,bengali)=>bn?bengali:en;
 const [minAltitude,setMinAltitude]=useState(25);
 const [sunLimit,setSunLimit]=useState(-12);
 const [kind,setKind]=useState('all');
 const [onlySaved,setOnlySaved]=useState(false);
 const [saved,setSaved]=useState(readSaved);
 const bucket=Math.floor(now.getTime()/(PLANNER_STEP_MINUTES*60000));
 const plan=useMemo(()=>observationForecast({
  location,now:bucket*PLANNER_STEP_MINUTES*60000+1,
  minAltitude,sunLimit
 }),[location?.lat,location?.lon,bucket,minAltitude,sunLimit]);
 const results=useMemo(()=>plan.targets.filter(item=>(kind==='all'||item.type===kind)&&(!onlySaved||saved.includes(item.id))),[plan,kind,onlySaved,saved]);
 const savedResults=useMemo(()=>plan.targets.filter(item=>saved.includes(item.id)),[plan,saved]);
 const next=plan.targets[0]?.next;
 useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved))}catch{}},[saved]);
 const toggleSaved=id=>setSaved(before=>before.includes(id)?before.filter(x=>x!==id):normalizeWatchlist([...before,id],validIds));
 const openTarget=item=>item.type==='galaxy'?onGalaxy(item.galaxyId):onPlanet(item.name);
 const calendarFor=item=>exportCalendar([{...item.next,id:item.id,name:item.name}],location?.label||'Selected observer');
 return <section className="observePlanner" aria-label="Smart astronomy observation planner">
  <div className="observePlannerHero">
   <div><span className="observePlannerEyebrow">AURORA / SCIENCE / v4.1</span>
    <h3><CalendarDays size={29}/>{txt('Smart Observation Planner','স্মার্ট আকাশ পর্যবেক্ষণ পরিকল্পনা')}</h3>
    <p>{txt('Find sampled 24-hour observation windows for known planets and galaxies, based on your selected observer and Sun altitude.','নির্বাচিত পর্যবেক্ষকের অবস্থান ও সূর্যের উচ্চতাকোণ অনুযায়ী আগামী ২৪ ঘণ্টায় গ্রহ ও গ্যালাক্সি পর্যবেক্ষণের সম্ভাব্য সময় দেখুন।')}</p>
   </div>
   <button type="button" onClick={()=>onNavigate('Sky Tonight')}><Moon size={16}/>{txt('SKY TONIGHT','আজ রাতের আকাশ')} <ArrowUpRight size={15}/></button>
  </div>
  <div className="observePlannerSummary">
   <div><small>{txt('OBSERVER','পর্যবেক্ষক')}</small><strong>{location?.label||'Manual observer'}</strong><span>{Number.isFinite(location?.lat)&&Number.isFinite(location?.lon)?location.lat.toFixed(3)+'°, '+location.lon.toFixed(3)+'°':'—'}</span></div>
   <div><small>{txt('TARGETS WITH WINDOWS','সময়সীমাসহ লক্ষ্য')}</small><strong>{plan.error?'—':plan.targets.length}</strong><span>{txt('Next 24 hours','আগামী ২৪ ঘণ্টা')}</span></div>
   <div><small>{txt('NEXT POSSIBLE WINDOW','পরবর্তী সম্ভাব্য সময়')}</small><strong>{next?dateLabel(next.startMs):'—'}</strong><span>{txt('Sample-based estimate','নমুনাভিত্তিক অনুমান')}</span></div>
   <div><small>{txt('MOON ILLUMINATION','চাঁদের আলোকিত অংশ')}</small><strong>{plan.moonIllumination===null?'—':plan.moonIllumination+'%'}</strong><span>{txt('Weather not included','আবহাওয়া বিবেচিত নয়')}</span></div>
  </div>
  <div className="observePlannerFilters">
   <label><SlidersHorizontal size={16}/>{txt('MIN ALTITUDE','সর্বনিম্ন উচ্চতা')}<select aria-label="Minimum target altitude" value={minAltitude} onChange={e=>setMinAltitude(Number(e.target.value))}>
    {[15,25,35,45].map(x=><option key={x} value={x}>{x}°</option>)}
   </select></label>
   <label>{txt('SUN BELOW HORIZON','সূর্য দিগন্তের নিচে')}<select aria-label="Required Sun altitude" value={sunLimit} onChange={e=>setSunLimit(Number(e.target.value))}>
    <option value={-6}>−6° · {txt('Civil','সিভিল')}</option>
    <option value={-12}>−12° · {txt('Nautical','নটিক্যাল')}</option>
    <option value={-18}>−18° · {txt('Astronomical','জ্যোতির্বৈজ্ঞানিক')}</option>
   </select></label>
   <label>{txt('CATEGORY','বিভাগ')}<select aria-label="Observation target category" value={kind} onChange={e=>setKind(e.target.value)}>
    <option value="all">{txt('All','সব')}</option><option value="planet">{txt('Planets','গ্রহ')}</option><option value="galaxy">{txt('Galaxies','গ্যালাক্সি')}</option>
   </select></label>
   <label className="observePlannerToggle"><input type="checkbox" checked={onlySaved} onChange={e=>setOnlySaved(e.target.checked)}/>{txt('Shortlist only','শুধু পছন্দের লক্ষ্য')}</label>
  </div>
  {plan.error?<p className="observePlannerWarning" role="alert">{txt('Observer coordinates are invalid. Select a valid location in Sky Tonight.','পর্যবেক্ষকের স্থানাঙ্ক সঠিক নয়। Sky Tonight থেকে অবস্থান নির্বাচন করুন।')}</p>:null}
  <div className="observePlannerSectionTitle"><div><h4>{txt('OBSERVATION WINDOWS','পর্যবেক্ষণের সময়সূচি')}</h4><p>{txt('Estimated starts/ends, using 15-minute samples. Listed targets may require binoculars or telescopes.','১৫ মিনিট অন্তর গণনার ভিত্তিতে আনুমানিক শুরু ও শেষের সময়। কিছু লক্ষ্য দেখতে দূরবীন বা টেলিস্কোপ প্রয়োজন।')}</p></div><span>{results.length} {txt('targets','লক্ষ্য')}</span></div>
  <div className="observePlannerResults">
   {results.length?results.map(item=><article key={item.id} className="observePlannerCard">
    <div className="observePlannerCardHead"><span className="observePlannerType">{item.type==='planet'?txt('PLANET','গ্রহ'):txt('GALAXY','গ্যালাক্সি')}</span><button type="button" aria-pressed={saved.includes(item.id)} onClick={()=>toggleSaved(item.id)} title={saved.includes(item.id)?txt('Remove from shortlist','তালিকা থেকে সরান'):txt('Add to shortlist','তালিকায় যোগ করুন')}>{saved.includes(item.id)?<BookmarkCheck size={17}/>:<Bookmark size={17}/>}</button></div>
    <h5>{item.name}</h5><p className="observePlannerDetail">{item.detail}{item.type==='galaxy'&&Number.isFinite(item.magnitude)?' · mag '+item.magnitude.toFixed(1):''}</p>
    <div className="observePlannerReading"><Clock3 size={15}/><span>{txt('First estimated window','প্রথম সম্ভাব্য সময়')}</span></div>
    <strong className="observePlannerTime">{dateLabel(item.next.startMs)}</strong>
    <div className="observePlannerLine">{txt('Until','শেষ')} {dateLabel(item.next.endMs)} · {estimateDuration(item.next)} {txt('min','মিনিট')}</div>
    <div className="observePlannerPeak"><Compass size={14}/>{txt('Peak','সর্বোচ্চ')} {item.next.peakAltitude.toFixed(1)}° · {bearing(item.next.peakAzimuth)} · {dateLabel(item.next.peakMs)}</div>
    {item.windows.length>1&&<small className="observePlannerMore">+{item.windows.length-1} {txt('more window(s) within 24 hours','টি অতিরিক্ত সময় পাওয়া গেছে')}</small>}
    <div className="observePlannerCardActions"><button type="button" onClick={()=>onLogTarget(item)}><BookOpen size={14}/>{txt('LOG SESSION','সেশন নোট')}</button><button type="button" onClick={()=>openTarget(item)}>{txt('OPEN TARGET','লক্ষ্য খুলুন')} <ArrowUpRight size={14}/></button><button type="button" onClick={()=>calendarFor(item)}><CalendarDays size={14}/>{txt('CALENDAR','ক্যালেন্ডার')}</button></div>
   </article>):<p className="observePlannerEmpty">{plan.error||txt('No matching estimated observing windows. Try a lower altitude, less restrictive twilight filter, or turn off shortlist-only.','এই শর্তে সম্ভাব্য সময় পাওয়া যায়নি। সর্বনিম্ন উচ্চতা বা twilight পরিবর্তন করুন, অথবা shortlist filter বন্ধ করুন।')}</p>}
  </div>
  <div className="observePlannerSchedule">
   <div><h4>{txt('MY OBSERVATION SHORTLIST','আমার পর্যবেক্ষণ তালিকা')}</h4><p>{saved.length} {txt('saved targets','টি সংরক্ষিত লক্ষ্য')} · {savedResults.length} {txt('currently have estimated windows','টির সম্ভাব্য সময় পাওয়া গেছে')}</p></div>
   <button type="button" disabled={!savedResults.length} onClick={()=>exportCalendar(savedResults.map(item=>({...item.next,id:item.id,name:item.name})),location?.label||'Selected observer')}><Download size={16}/>{txt('EXPORT WATCHLIST (.ICS)','ক্যালেন্ডারে এক্সপোর্ট (.ICS)')}</button>
  </div>
  <div className="observePlannerMethod"><Info size={19}/><p>{txt('Scientific limits: These are sampled geometric opportunities, not confirmed visual sightings or exact rise/set instants. Conditions such as local obstructions, atmospheric clarity, weather, Moon brightness, light pollution, target magnitude and observing equipment are not included. No reminders or notifications are scheduled by a calendar export until you import it into your calendar app. Your shortlist stays in this browser.','বৈজ্ঞানিক সীমাবদ্ধতা: এগুলো আনুমানিক জ্যামিতিক পর্যবেক্ষণ সময়, নিশ্চিত দেখা যাবে এমন দাবি নয়। আবহাওয়া, আলোকদূষণ, চাঁদের উজ্জ্বলতা ও যন্ত্রপাতি বিবেচনায় নেই। ক্যালেন্ডার ফাইল নিজে ইমপোর্ট না করলে কোনো রিমাইন্ডার সেট হবে না। পছন্দের লক্ষ্য শুধু এই ব্রাউজারে সংরক্ষিত থাকে।')}</p></div>
 </section>;
}
