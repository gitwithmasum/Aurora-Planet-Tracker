import React,{useEffect,useMemo,useState} from 'react';
import {Activity,BarChart3,BookOpen,CalendarDays,CheckCircle2,Download,FileText,Info,Layers3,Target,TrendingUp} from 'lucide-react';
import {JOURNAL_KEY,normalizeFieldSessions} from './fieldJournalCore.mjs';
import {ANALYTICS_RANGES,ANALYTICS_TYPES,analyzeObservationSessions,observationAnalyticsJSON,observationAnalyticsCSV,observationAnalyticsReport} from './observationAnalyticsCore.mjs';
import {useLanguage} from './i18n.jsx';
import './ObservationAnalytics.css';

function readSessions(){
 try{return normalizeFieldSessions(JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]'))}catch{return []}
}
function downloadReport(name,content,mime){
 if(!content)return;
 const blob=new Blob([content],{type:mime});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const percent=(numerator,denominator)=>denominator?Math.round(numerator/denominator*100):null;
const typeNames={planet:'Planet',galaxy:'Galaxy',satellite:'Satellite',other:'Other'};
const conditionNames={clear:'Clear','partly-cloudy':'Partly cloudy',cloudy:'Cloudy',rain:'Rain',unknown:'Not recorded'};
const formatRatio=ratio=>ratio===null?'—':(ratio*100).toFixed(1)+'%';
export default function ObservationAnalytics({now,onNavigate}){
 const {language}=useLanguage(),bn=language==='bn';
 const t=(en,translated)=>bn?translated:en;
 const [sessions,setSessions]=useState(readSessions);
 const [rangeDays,setRangeDays]=useState(30),[targetType,setTargetType]=useState('all');
 const [notice,setNotice]=useState('');
 const minute=Math.floor(now.getTime()/60000);
 useEffect(()=>{
  const update=event=>{
   if(event.key!==JOURNAL_KEY&&event.key!==null)return;
   setSessions(readSessions());setNotice('');
  };
  window.addEventListener('storage',update);
  return()=>window.removeEventListener('storage',update);
 },[]);
 const analysis=useMemo(()=>analyzeObservationSessions(sessions,{rangeDays,targetType,now:minute*60000}),[sessions,rangeDays,targetType,minute]);
 const daily=analysis?.trend||[];
 const chartMax=Math.max(1,...daily.map(x=>x.scheduled));
 const maxType=Math.max(1,...Object.values(analysis?.types||{}));
 const maxSky=Math.max(1,...Object.values(analysis?.sky||{}));
 const displayedTypes=Object.entries(analysis?.types||{});
 const conditionRows=Object.entries(analysis?.sky||{});
 function exportAggregate(format){
  if(!analysis||!analysis.total)return;
  const name='aurora-observation-analytics-'+(rangeDays==='all'?'all':rangeDays+'d');
  if(format==='json')downloadReport(name+'.json',observationAnalyticsJSON(analysis),'application/json;charset=utf-8');
  else if(format==='csv')downloadReport(name+'.csv',observationAnalyticsCSV(analysis),'text/csv;charset=utf-8');
  else downloadReport(name+'.txt',observationAnalyticsReport(analysis),'text/plain;charset=utf-8');
  setNotice(t('Aggregate report prepared. Target names are included; notes, observer names and coordinates are excluded.','সারসংক্ষেপ রিপোর্ট প্রস্তুত। লক্ষ্যবস্তুর নাম আছে; পর্যবেক্ষণের নোট, পর্যবেক্ষকের নাম ও স্থানাঙ্ক নেই।'));
 }
 const highlights=analysis?[
  {heading:t('Reported outcomes','নিজস্ব পর্যবেক্ষণের ফল'),description:analysis.confirmedAttempts?
   t('Seen ', 'দেখা হয়েছে ')+analysis.outcomes.seen+' / '+analysis.confirmedAttempts+
    t(' explicitly answered attempts. These are observer reports, not scientific confirmation.','টি নির্দিষ্ট ফলাফলের মধ্যে। এটি ব্যক্তিগত রেকর্ড, বৈজ্ঞানিকভাবে যাচাইকৃত তথ্য নয়।'):
   t('No sessions have an explicitly answered seen/not-seen outcome in this range.','এই সময়সীমায় seen/not-seen হিসেবে কোনো সম্পন্ন রেকর্ড নেই।')},
  {heading:t('Documentation coverage','নোট সংরক্ষণের পরিমাণ'),description:analysis.total?
   analysis.withNotes+' / '+analysis.total+t(' sessions have field notes; ','টি সেশনে নোট রয়েছে; ')+
   analysis.withEquipment+' / '+analysis.total+t(' list equipment.','টিতে যন্ত্রপাতির তথ্য রয়েছে।'):
   t('Start recording field notes to build a meaningful research dataset.','বিশ্লেষণের জন্য আগে পর্যবেক্ষণের নোট সংরক্ষণ করুন।')},
  {heading:t('Sampling caveat','নমুনার সীমাবদ্ধতা'),description:t('Counts describe your recorded plans and reports, not astronomy forecast accuracy or an independent detection rate.','এই সংখ্যা তোমার পরিকল্পনা ও নিজস্ব রেকর্ডের সারাংশ; পূর্বাভাসের নির্ভুলতা বা স্বাধীনভাবে যাচাই করা detection rate নয়।')}
 ]:[];
 return <section className="obsAnalytics" aria-label="Observation Analytics and Research Dashboard">
  <div className="obsAnalyticsHero"><div><span className="obsAnalyticsOverline">AURORA / FIELD SCIENCE / v4.4</span>
   <h3><BarChart3 size={29}/>{t('Observation Analytics & Research Dashboard','পর্যবেক্ষণ বিশ্লেষণ ও গবেষণা ড্যাশবোর্ড')}</h3>
   <p>{t('Explore your local Field Journal as aggregated trends, research-ready summaries and clearly labeled self-reported outcomes.','স্থানীয় Field Journal থেকে পর্যবেক্ষণের প্রবণতা, গবেষণার সারাংশ ও নিজের রেকর্ড করা ফলাফল দেখুন।')}</p>
  </div><button type="button" onClick={()=>onNavigate('Field Journal')}><BookOpen size={16}/>{t('OPEN FIELD JOURNAL','ফিল্ড জার্নাল খুলুন')}</button></div>
  <div className="obsAnalyticsFilters"><label><CalendarDays size={16}/>{t('DATE RANGE','সময়সীমা')}<select aria-label="Observation analytics date range" value={String(rangeDays)} onChange={e=>setRangeDays(e.target.value==='all'?'all':Number(e.target.value))}>
   {ANALYTICS_RANGES.map(value=><option key={String(value)} value={String(value)}>{value==='all'?t('All recorded sessions','সব রেকর্ড'):t('Last ','গত ')+value+t(' days',' দিন')}</option>)}
  </select></label><label><Layers3 size={16}/>{t('TARGET TYPE','লক্ষ্যের ধরন')}<select aria-label="Observation analytics target category" value={targetType} onChange={e=>setTargetType(e.target.value)}>{ANALYTICS_TYPES.map(type=><option key={type} value={type}>{type==='all'?t('All targets','সব লক্ষ্য'):typeNames[type]}</option>)}</select></label>
  <button type="button" onClick={()=>{setSessions(readSessions());setNotice(t('Local journal reloaded.','স্থানীয় জার্নাল রিলোড হয়েছে।'))}}>{t('REFRESH JOURNAL','জার্নাল রিফ্রেশ')}</button></div>
  <div className="obsAnalyticsMetrics">
   <article><Target size={19}/><small>{t('RECORDED SESSIONS','মোট সেশন')}</small><strong>{analysis?.total??'—'}</strong><span>{t('Filtered by planned date','পরিকল্পিত তারিখ অনুযায়ী')}</span></article>
   <article><CheckCircle2 size={19}/><small>{t('COMPLETED','সম্পন্ন')}</small><strong>{analysis?.status.completed??'—'}</strong><span>{t('Including unknown outcomes','অজানা ফলসহ')}</span></article>
   <article><TrendingUp size={19}/><small>{t('MARKED SEEN','দেখা হয়েছে বলে চিহ্নিত')}</small><strong>{analysis?.outcomes.seen??'—'}</strong><span>{t('Self-reported only','শুধু নিজের রেকর্ড')}</span></article>
   <article><Activity size={19}/><small>{t('SEEN / EXPLICIT ATTEMPTS','দেখা / নির্দিষ্ট চেষ্টা')}</small><strong>{analysis?formatRatio(analysis.sightingRatio):'—'}</strong><span>{t('Not a forecast accuracy rate','পূর্বাভাসের নির্ভুলতার হার নয়')}</span></article>
   <article><BookOpen size={19}/><small>{t('DISTINCT TARGETS','আলাদা লক্ষ্য')}</small><strong>{analysis?.uniqueTargets??'—'}</strong><span>{t('Top 20 shown below','নিচে সর্বোচ্চ ২০টি')}</span></article>
  </div>
  {!analysis?.total&&<div className="obsAnalyticsEmpty" role="status">{sessions.length?
   t('No sessions match this date and target filter. Try another range or category.','এই সময়সীমা ও বিভাগে সেশন নেই। অন্য ফিল্টার নির্বাচন করুন।'):
   t('Your Field Journal is empty. Record a planned or completed observing session to populate these analytics.','Field Journal-এ এখনো কোনো সেশন নেই। পর্যবেক্ষণের সেশন লিখলে এখানে বিশ্লেষণ দেখা যাবে।')}
   <button type="button" onClick={()=>onNavigate('Field Journal')}>{t('ADD A FIELD SESSION','নতুন সেশন যোগ করুন')}</button></div>}
  <div className="obsAnalyticsColumns">
   <article className="obsAnalyticsPanel obsAnalyticsTrend"><div className="obsAnalyticsPanelHeader"><div><h4>{t('SESSION TIMELINE','সেশনের সময়রেখা')}</h4><p>{t('Daily counts by planned local date. Completed means its current status, not a verified sighting.','স্থানীয় পরিকল্পিত তারিখ অনুযায়ী সেশনের সংখ্যা; completed মানে স্বতন্ত্রভাবে যাচাইকৃত sighting নয়।')}</p></div><span>{daily.length} {t('days','দিন')}</span></div>
    <div className="obsAnalyticsChartLegend"><span><i className="obsAnalyticsLegendScheduled"/>{t('Scheduled','পরিকল্পিত')}</span><span><i className="obsAnalyticsLegendSeen"/>{t('Self-reported seen','নিজে দেখেছি')}</span></div>
    <div className="obsAnalyticsChart" role="img" aria-label={t('Daily session chart showing scheduled sessions and self-reported observations.','প্রতিদিনের পরিকল্পিত সেশন ও নিজে দেখা লক্ষ্যগুলোর চার্ট।')}>
     {daily.map((entry,i)=><div className="obsAnalyticsChartSlot" key={entry.day} title={entry.day+': '+entry.scheduled+' sessions; '+entry.seen+' self-reported seen'}>
      <div className="obsAnalyticsChartPill"><span style={{height:(entry.scheduled?Math.max(5,entry.scheduled/chartMax*100):0)+'%'}} className="obsAnalyticsBarScheduled"/><span style={{height:(entry.seen?Math.max(5,entry.seen/chartMax*100):0)+'%'}} className="obsAnalyticsBarSeen"/></div>
      <small>{i===0||i===daily.length-1||i%Math.max(1,Math.ceil(daily.length/5))===0?entry.day.slice(5):' '}</small>
     </div>)}
    </div>
   </article>
   <article className="obsAnalyticsPanel"><div className="obsAnalyticsPanelHeader"><div><h4>{t('SESSION OUTCOMES','সেশনের ফলাফল')}</h4><p>{t('Explicitly completed journal entries only.','শুধু completed সেশনের নিজস্ব ফলাফল।')}</p></div></div>
    <div className="obsAnalyticsOutcomeRows">{[
     {name:t('Planned','পরিকল্পিত'),n:analysis?.status.planned??0,group:'planned'},
     {name:t('In progress','চলমান'),n:analysis?.status.inProgress??0,group:'progress'},
     {name:t('Completed · Seen','সম্পন্ন · দেখেছি'),n:analysis?.outcomes.seen??0,group:'seen'},
     {name:t('Completed · Not seen','সম্পন্ন · দেখিনি'),n:analysis?.outcomes.notSeen??0,group:'missed'},
     {name:t('Completed · Unknown','সম্পন্ন · অজানা'),n:analysis?.outcomes.unknown??0,group:'unknown'}
    ].map(item=><div className="obsAnalyticsOutcome" key={item.group}><div><span>{item.name}</span><strong>{item.n}</strong></div><div className="obsAnalyticsMeter"><span data-kind={item.group} style={{width:percent(item.n,analysis?.total)||0+'%'}}/></div></div>)}</div>
    <p className="obsAnalyticsPanelFoot">{t('Upcoming planned sessions (all journal dates, matching category):','পরবর্তী পরিকল্পিত সেশন (সব তারিখ, নির্বাচিত বিভাগ):')} <strong>{analysis?.upcoming??'—'}</strong></p>
   </article>
  </div>
  <div className="obsAnalyticsColumns">
   <article className="obsAnalyticsPanel"><div className="obsAnalyticsPanelHeader"><div><h4>{t('MOST RECORDED TARGETS','সবচেয়ে বেশি রেকর্ড করা লক্ষ্য')}</h4><p>{t('Counts include plans and completed sessions; target names may be custom.','পরিকল্পিত ও সম্পন্ন উভয় সেশন গণনা; লক্ষ্যবস্তুর নাম কাস্টম হতে পারে।')}</p></div></div>
    <div className="obsAnalyticsTargetList">{analysis?.targets.length?analysis.targets.map((item,i)=><div className="obsAnalyticsTarget" key={item.id}><span>{i+1}</span><div><strong>{item.name}</strong><small>{typeNames[item.type]} · {item.completed} {t('completed','সম্পন্ন')} · {item.seen} {t('marked seen','দেখেছি')}</small></div><b>{item.total}</b></div>):<p className="obsAnalyticsPanelFoot">{t('No target records for these filters.','এই ফিল্টারে কোনো লক্ষ্য পাওয়া যায়নি।')}</p>}</div>
   </article>
   <article className="obsAnalyticsPanel"><div className="obsAnalyticsPanelHeader"><div><h4>{t('TARGET & SKY DISTRIBUTION','লক্ষ্য ও আকাশের অবস্থার বণ্টন')}</h4><p>{t('Sky conditions are user-entered and may be unknown.','আকাশের অবস্থা ব্যবহারকারী দিয়েছেন; অজানা থাকতে পারে।')}</p></div></div>
    <h5>{t('Target types','লক্ষ্যের ধরন')}</h5>
    <div className="obsAnalyticsBreakdown">{displayedTypes.map(([key,n])=><div key={key}><span>{typeNames[key]}</span><div><i style={{width:n/maxType*100+'%'}}/></div><strong>{n}</strong></div>)}</div>
    <h5>{t('Recorded sky conditions','রেকর্ড করা আকাশের অবস্থা')}</h5>
    <div className="obsAnalyticsBreakdown">{conditionRows.map(([key,n])=><div key={key}><span>{conditionNames[key]}</span><div><i style={{width:n/maxSky*100+'%'}}/></div><strong>{n}</strong></div>)}</div>
   </article>
  </div>
  <div className="obsAnalyticsResearch"><h4><FileText size={20}/>{t('RESEARCH NOTES & LIMITATIONS','গবেষণার তথ্য ও সীমাবদ্ধতা')}</h4>
   <div>{highlights.map(item=><article key={item.heading}><strong>{item.heading}</strong><p>{item.description}</p></article>)}</div>
   <p className="obsAnalyticsDisclaimer"><Info size={17}/>{t('No astronomical ephemeris or observational proof is fabricated. The chart groups sessions by their scheduled date, and outcome ratios exclude unattempted/unknown records. Aggregated exports contain target names and counts but exclude raw notes and coordinates.','কোনো কৃত্রিম পর্যবেক্ষণ বা প্রমাণ তৈরি করা হয়নি। চার্ট পরিকল্পিত তারিখ অনুযায়ী সাজানো, অজানা ফলকে হার গণনায় ধরা হয়নি। সারসংক্ষেপ রিপোর্টে লক্ষ্য ও সংখ্যা থাকবে, কাঁচা নোট বা স্থানাঙ্ক থাকবে না।')}</p>
  </div>
  <div className="obsAnalyticsExport"><div><h4>{t('EXPORT RESEARCH SUMMARY','গবেষণার সারাংশ এক্সপোর্ট')}</h4><p>{t('Only aggregated counts, target names and daily trends; never raw journal notes, observer identities or coordinates.','শুধু সারসংক্ষেপের সংখ্যা, লক্ষ্যবস্তু ও দিনভিত্তিক তথ্য; মূল নোট, পর্যবেক্ষকের নাম বা স্থানাঙ্ক নয়।')}</p></div><div>
   <button type="button" disabled={!analysis?.total} onClick={()=>exportAggregate('json')}><Download size={15}/> JSON</button>
   <button type="button" disabled={!analysis?.total} onClick={()=>exportAggregate('csv')}><Download size={15}/> CSV</button>
   <button type="button" disabled={!analysis?.total} onClick={()=>exportAggregate('txt')}><FileText size={15}/> TXT</button>
  </div></div>
  {notice&&<p role="status" className="obsAnalyticsNotice">{notice}</p>}
 </section>;
}
