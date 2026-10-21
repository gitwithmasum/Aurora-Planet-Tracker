import React,{useMemo,useState} from 'react';
import {researchForMoon} from './moonResearchCatalog.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonEvidenceViewer.css';
export default function MoonEvidenceViewer({moon}){
 const {language}=useLanguage(),t=(a,b)=>language==='bn'?b:a;
 const [active,setActive]=useState(0);
 const cards=useMemo(()=>researchForMoon(moon),[moon]);
 const item=cards[active]||cards[0];
 return <section className="moonEvidence" aria-label={'Mission evidence viewer '+moon.name}>
 <header><div><span>MOONVERSE / v5.9 / EVIDENCE VIEWER</span><h5>{t('Mission Evidence Viewer','মিশন এভিডেন্স ভিউয়ার')} — {moon.name}</h5></div><span>{cards.length} {t('curated records','টি নির্বাচিত রেকর্ড')}</span></header>
 <p>{t('Explore source-linked evidence records. These are research summaries, not a live spacecraft image feed.','উৎসসহ বৈজ্ঞানিক প্রমাণ দেখুন। এগুলো গবেষণার সারাংশ, সরাসরি মহাকাশযানের ছবি ফিড নয়।')}</p>
 {!item?<div className="moonEvidenceEmpty">{t('No curated evidence records are available for this moon yet.','এই উপগ্রহের জন্য এখনো নির্বাচিত প্রমাণের রেকর্ড নেই।')}</div>:<>
 <nav className="moonEvidenceTabs" aria-label="Evidence records">{cards.map((card,i)=><button type="button" key={card.title} className={i===active?'active':''} aria-pressed={i===active} onClick={()=>setActive(i)}>{card.title}</button>)}</nav>
 <article className="moonEvidenceCard"><div className="moonEvidenceArtwork" aria-hidden="true"><span>MISSION DATA</span><strong>{moon.name.toUpperCase()}</strong><small>{item.topic.toUpperCase()} / {item.confidence.toUpperCase()}</small><div className="moonEvidenceOrbit"><i/><i/><i/></div></div><div className="moonEvidenceDetails"><span>{t('EVIDENCE RECORD','প্রমাণের রেকর্ড')} {active+1} / {cards.length}</span><h6>{item.title}</h6><p><b>{t('Observation','পর্যবেক্ষণ')}</b> {item.evidence}</p><p><b>{t('Scientific interpretation','বৈজ্ঞানিক ব্যাখ্যা')}</b> {item.interpretation}</p><p><b>{t('Evidence status','প্রমাণের অবস্থা')}</b> {item.confidence}</p><a href={item.url} target="_blank" rel="noopener noreferrer">{t('Open original NASA source ↗','মূল NASA উৎস খুলুন ↗')}</a></div></article>
 </>}
 <small>{t('Source links and summaries are curated and may need updating as mission results evolve. No image has been fabricated or represented as a spacecraft photograph.','উৎস ও সারাংশ বাছাই করা; নতুন মিশন ফলাফলে আপডেট প্রয়োজন হতে পারে। কোনো কৃত্রিম ছবিকে মহাকাশযানের আসল ছবি বলা হয়নি।')}</small>
 </section>;
}