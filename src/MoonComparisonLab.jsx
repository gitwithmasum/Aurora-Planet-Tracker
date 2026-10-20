import React,{useMemo,useState} from 'react';
import {MOONS} from './moonCatalog.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonComparisonLab.css';
const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
export function compareMoonMetrics(a,b){
 if(!a||!b)return null;
 const fields=[['Radius','radiusKm','km'],['Orbital distance','orbitKm','km'],['Orbital period','periodDays','days'],['Eccentricity','eccentricity','']];
 return fields.map(([name,key,unit])=>({name,key,unit,a:Math.abs(a[key]),b:Math.abs(b[key]),ratio:Number.isFinite(a[key])&&Number.isFinite(b[key])&&b[key]!==0?Math.abs(a[key]/b[key]):null}));
}
export default function MoonComparisonLab({moon}){
 const {language}=useLanguage(),t=(en,bn)=>language==='bn'?bn:en;
 const [otherId,setOtherId]=useState('');const other=MOONS.find(m=>m.id===otherId&&m.id!==moon.id)||MOONS.find(m=>m.id!==moon.id&&m.planet===moon.planet)||MOONS.find(m=>m.id!==moon.id);
 const metrics=useMemo(()=>compareMoonMetrics(moon,other),[moon,other]);
 return <section className="moonCompare" aria-label="Comparative moon science lab"><header><div><span>MOONVERSE / v5.7</span><h5>{t('Comparative Science Lab','তুলনামূলক বিজ্ঞান গবেষণাগার')}</h5></div><label>{t('Compare with','তুলনা করুন')}<select aria-label="Select comparison moon" value={otherId===moon.id?'':otherId} onChange={e=>setOtherId(e.target.value)}><option value="">{t('Auto: another moon','স্বয়ংক্রিয়: অন্য উপগ্রহ')}</option>{MOONS.filter(m=>m.id!==moon.id).map(m=><option value={m.id} key={m.id}>{m.name} — {m.planet}</option>)}</select></label></header>
 <p>{t('Compare catalog reference estimates—not live or measured spacecraft readings. Orbital periods are compared by magnitude; retrograde direction is shown separately.','ক্যাটালগের আনুমানিক বৈজ্ঞানিক তথ্য তুলনা করুন—এগুলো সরাসরি spacecraft measurement নয়। বিপরীতমুখী কক্ষপথ আলাদাভাবে দেখানো হয়েছে।')}</p>
 <div className="moonCompareTable"><table><thead><tr><th>{t('Metric','বৈশিষ্ট্য')}</th><th>{moon.name}</th><th>{other.name}</th></tr></thead><tbody>{metrics.map(m=><tr key={m.key}><th>{m.name}</th><td>{fmt(m.a, m.key==='orbitKm'?0:3)} {m.unit}</td><td>{fmt(m.b,m.key==='orbitKm'?0:3)} {m.unit}</td></tr>)}<tr><th>{t('Orbit direction','কক্ষপথের দিক')}</th><td>{moon.periodDays<0?'Retrograde':'Prograde / unspecified'}</td><td>{other.periodDays<0?'Retrograde':'Prograde / unspecified'}</td></tr><tr><th>{t('Classification','শ্রেণিবিভাগ')}</th><td>{moon.category}</td><td>{other.category}</td></tr></tbody></table></div>
 <div className="moonCompareBars">{metrics.slice(0,3).map(m=>{const max=Math.max(m.a,m.b,1);return <div className="moonCompareBar" key={m.key}><strong>{m.name}</strong><div aria-label={moon.name+' '+m.name}><span style={{width:(100*m.a/max)+'%'}}/></div><div aria-label={other.name+' '+m.name}><span style={{width:(100*m.b/max)+'%'}}/></div></div>})}</div>
 <small>{t('Visual bar lengths are normalized within each metric. Do not compare bar sizes between different metric rows. Missing measurements are never inferred.','প্রতিটি বৈশিষ্ট্যে আলাদাভাবে বার স্কেল করা হয়েছে। ভিন্ন বৈশিষ্ট্যের বারের দৈর্ঘ্য তুলনা করবেন না। অনুপস্থিত তথ্য অনুমান করা হয়নি।')}</small>
 </section>;
}
