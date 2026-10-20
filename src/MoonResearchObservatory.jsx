import React,{useMemo,useState} from 'react';
import {researchForMoon,researchCategories} from './moonResearchCatalog.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonResearchObservatory.css';
export default function MoonResearchObservatory({moon}){
 const {language}=useLanguage(),t=(a,b)=>language==='bn'?b:a;
 const [filter,setFilter]=useState('all');
 const entries=useMemo(()=>researchForMoon(moon),[moon]);
 const visible=entries.filter(e=>filter==='all'||e.topic===filter);
 return <section className="moonResearchObs" aria-label={'Research observatory for '+moon.name}>
  <header><div><span>MOONVERSE / v5.8 / RESEARCH</span><h5>{t('Scientific Research Observatory','বৈজ্ঞানিক গবেষণা অবজারভেটরি')} — {moon.name}</h5></div><label>{t('Evidence category','প্রমাণের ধরন')}<select aria-label="Filter research evidence" value={filter} onChange={e=>setFilter(e.target.value)}>{researchCategories.map(x=><option key={x} value={x}>{x.toUpperCase()}</option>)}</select></label></header>
  <p>{t('Source-linked scientific observations, interpretations and uncertainty. This archive is selective and does not establish extraterrestrial life.','উৎসসহ বৈজ্ঞানিক পর্যবেক্ষণ, ব্যাখ্যা এবং অনিশ্চয়তা। এটি নির্বাচিত তথ্যের সংগ্রহ; ভিনগ্রহের জীবনের প্রমাণ নয়।')}</p>
  {entries.length===0?<div className="moonResearchEmpty">{t('No research evidence card curated for this moon yet. Consult the general NASA/JPL science links in the profile.','এই উপগ্রহের পৃথক গবেষণার কার্ড এখনো যোগ হয়নি। প্রোফাইলে NASA/JPL-এর সাধারণ উৎস দেখুন।')}</div>:<div className="moonResearchList">{visible.map((e,i)=><article key={e.title}><span>{e.topic.toUpperCase()} / {t('EVIDENCE CARD','প্রমাণের কার্ড')} {i+1}</span><h6>{e.title}</h6><p><strong>{t('Observation','পর্যবেক্ষণ')}:</strong> {e.evidence}</p><p><strong>{t('Interpretation','ব্যাখ্যা')}:</strong> {e.interpretation}</p><p><strong>{t('Evidence status','প্রমাণের অবস্থা')}:</strong> {e.confidence}</p><a href={e.url} target="_blank" rel="noopener noreferrer">{t('Read primary NASA source ↗','NASA মূল উৎস দেখুন ↗')}</a></article>)}</div>}
  {entries.length>0&&visible.length===0&&<p>{t('No evidence cards match this filter.','এই filter-এ কোনো গবেষণা নেই।')}</p>}
  <small>{t('Research status can change as missions publish new results. Links open original research summaries; this is not a live NASA feed or image archive.','নতুন গবেষণায় তথ্য পরিবর্তিত হতে পারে। এটি NASA-র সরাসরি তথ্য বা ছবি feed নয়।')}</small>
 </section>;
}