import React,{useMemo,useState} from 'react';
import {missionArchiveFor} from './moonMissionArchive.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonMissionArchive.css';
const TYPES=['all','flyby','landing','orbiter','discovery','launch','planned'];
export default function MoonMissionArchive({moon}){
 const {language}=useLanguage(),bn=language==='bn',t=(en,bnText)=>bn?bnText:en;
 const [filter,setFilter]=useState('all'),[direction,setDirection]=useState('asc');
 const rows=useMemo(()=>missionArchiveFor(moon),[moon]);
 const visible=useMemo(()=>rows.filter(x=>filter==='all'||x.kind===filter).sort((a,b)=>direction==='asc'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)),[rows,filter,direction]);
 return <section className="moonMissionArchive" aria-label={'Mission archive for '+moon.name}>
 <header><div><span>MOONVERSE / v5.5 / SCIENTIFIC TIMELINE</span><h5>{t('Mission Archive & Discoveries','মিশন আর্কাইভ ও আবিষ্কারের টাইমলাইন')} — {moon.name}</h5></div><strong>{rows.length} {t('curated events','নির্বাচিত ঘটনা')}</strong></header>
 <p>{t('Dated spacecraft milestones for this moon. Entries are curated, not a complete flyby log. Future milestones are marked planned and are subject to change.','এই উপগ্রহের বাছাই করা মহাকাশ অভিযানের ইতিহাস। এটি সব flyby-এর পূর্ণ তালিকা নয়। ভবিষ্যৎ ঘটনা পরিকল্পিত হিসেবে চিহ্নিত।')}</p>
 <div className="moonMissionControls"><label>{t('Event type','ঘটনার ধরন')}<select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter mission events">{TYPES.map(type=><option key={type} value={type}>{type.toUpperCase()}</option>)}</select></label><label>{t('Timeline order','টাইমলাইন ক্রম')}<select value={direction} onChange={e=>setDirection(e.target.value)} aria-label="Mission event sort"><option value="asc">{t('Oldest first','পুরোনো আগে')}</option><option value="desc">{t('Newest first','নতুন আগে')}</option></select></label></div>
 {rows.length===0?<div className="moonMissionEmpty"><strong>{t('No individually verified milestone entered yet','এই উপগ্রহের জন্য পৃথক যাচাইকৃত ঘটনা এখনো যোগ করা হয়নি')}</strong><p>{t('This does not mean the moon was never observed. Check the scientific profile and mission references above.','এর অর্থ এই নয় যে উপগ্রহটি কখনো পর্যবেক্ষণ করা হয়নি। ওপরের বৈজ্ঞানিক তথ্য ও মিশনের উৎস দেখুন।')}</p></div>:<ol className="moonMissionTimeline">{visible.map((e,i)=><li key={e.date+e.mission+i}><time dateTime={e.date}>{e.status==='planned'?e.date.slice(0,4)+' · '+t('approx.','আনুমানিক'):e.date}</time><div><div className="moonMissionTags"><span>{e.mission}</span><span>{e.kind.toUpperCase()}</span>{e.status==='planned'&&<b>{t('PLANNED / NOT COMPLETED','পরিকল্পিত / সম্পন্ন নয়')}</b>}</div><h6>{e.title}</h6><p>{e.detail}</p><a href={e.source} target="_blank" rel="noopener noreferrer">{t('Mission source ↗','মিশনের উৎস ↗')}</a></div></li>)}</ol>}
 {rows.length>0&&visible.length===0&&<p>{t('No entries for this event type.','এই ধরনের কোনো ঘটনা নেই।')}</p>}
 <small>{t('Event dates are UTC calendar dates or approximate year markers, not an orbital simulation timeline. Historical flyby records and future plans may be revised as new mission information is published.','তারিখগুলো ঐতিহাসিক ক্যালেন্ডার তথ্য; এগুলো 3D কক্ষপথের সময় নয়। নতুন তথ্য অনুযায়ী ইতিহাস ও ভবিষ্যৎ পরিকল্পনা সংশোধিত হতে পারে।')}</small>
 </section>;
}
