import React,{useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Camera,Check,FlaskConical,GitCompare,Info,Layers3,Plus,RefreshCw,X} from 'lucide-react';
import {MOONS,moonById} from './moonCatalog.mjs';
import {moonScience,physicalParameters,PHYSICAL_SOURCE,NASA_OCEAN_SOURCE,moonComparison} from './moonScience.mjs';
import {moonMedia,nasaImageQuery,extractNasaThumbnail} from './moonMedia.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonScienceLab.css';
const fixed=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d}):'—';
function ScienceCard({name,value,unit='',detail=''}){return <div className="moonLabMetric"><small>{name}</small><strong>{value}{value!=='—'?' '+unit:''}</strong>{detail&&<span>{detail}</span>}</div>}
function SafeNasaMedia({record}){
 const [status,setStatus]=useState('idle'),[thumb,setThumb]=useState('');
 useEffect(()=>{setStatus('idle');setThumb('')},[record?.nasaId]);
 async function load(){
  if(!record||status==='loading')return;
  setStatus('loading');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8500);
  try{
   const response=await fetch(nasaImageQuery(record),{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('NASA media API unavailable');
   const body=await response.json();
   const uri=extractNasaThumbnail(body,record);
   if(!uri)throw Error('Verified NASA thumbnail not present in API results');
   setThumb(uri);setStatus('ready');
  }catch{setStatus('unavailable')}
  finally{clearTimeout(timeout)}
 }
 if(!record)return <p className="moonLabNotice">No verified NASA Photojournal media item curated for this moon yet. Use its NASA scientific source links; an unverified photo will not be substituted.</p>;
 return <div className="moonLabMedia">
   <div className="moonLabMediaFigure">
    {thumb?<img src={thumb} loading="lazy" referrerPolicy="no-referrer" alt={record.title+' — '+record.kind} onError={()=>{setThumb('');setStatus('unavailable')}}/>:<div className="moonLabMediaBlank"><Camera size={32}/><span>NASA PHOTOJOURNAL · {record.nasaId}</span></div>}
   </div>
   <div className="moonLabMediaCaption"><h5>{record.title}</h5><p>{record.kind} · {record.credit}</p>
    <div className="moonLabActions">
     <a target="_blank" rel="noopener noreferrer" href={record.page}>OPEN VERIFIED NASA IMAGE <ArrowUpRight size={14}/></a>
     <button type="button" onClick={load} disabled={status==='loading'}><RefreshCw size={13}/>{status==='loading'?'LOADING NASA…':'LOAD NASA THUMBNAIL'}</button>
    </div>
    {status==='unavailable'&&<p className="moonLabNotice">NASA thumbnail could not be fetched. The original verified NASA image page remains available above.</p>}
   </div>
 </div>;
}
function PhysicalDetails({moon,bn}){
 const science=moonScience(moon),phy=science?.physical,status=science?.status;
 const label=(en,bangla)=>bn?bangla:en;
 if(!phy)return <p className="moonLabNotice">No JPL scientific mass/gravity record is currently available.</p>;
 return <>
  <div className="moonLabMetrics">
   <ScienceCard name={label('JPL ID / NAIF code','JPL / NAIF কোড')} value={fixed(phy.naifCode,0)}/>
   <ScienceCard name={label('Density (JPL)','ঘনত্ব (JPL)')} value={fixed(phy.densityGcm3,4)} unit="g/cm³" detail={phy.densityGcm3!==null?'JPL modeled from GM and mean radius':''}/>
   <ScienceCard name={label('GM (JPL)','GM (JPL)')} value={fixed(phy.gmKm3S2,7)} unit="km³/s²" detail={phy.gmKm3S2!==null?'JPL orbital fit':''}/>
   <ScienceCard name={label('Surface gravity (derived)','পৃষ্ঠের অভিকর্ষ (গণনাকৃত)')} value={fixed(phy.gravityMS2,3)} unit="m/s²" detail={phy.gravityMS2!==null?'GM / mean radius²; spherical model':''}/>
   <ScienceCard name={label('Escape speed (derived)','মুক্তিবেগ (গণনাকৃত)')} value={fixed(phy.escapeVelocityMS,1)} unit="m/s" detail={phy.escapeVelocityMS!==null?'√(2 GM / mean radius); spherical model':''}/>
   <ScienceCard name={label('Approximate mass (derived)','ভর (গণনাকৃত)')} value={phy.massKg!==null?phy.massKg.toExponential(3):'—'} unit="kg" detail={phy.massKg!==null?'GM ÷ CODATA gravitational constant':''}/>
  </div>
  <div className="moonLabEvidence">
   <span className="moonLabTag">DATA QUALITY: {phy.quality.toUpperCase()}</span>
   {Number.isFinite(phy.gmUncertainty)&&<span>GM relative sigma: {fixed(100*phy.gmUncertainty,1)}%</span>}
   {Number.isFinite(phy.densityRelativeError)&&<span>Density relative sigma: {fixed(100*phy.densityRelativeError,1)}%</span>}
  </div>
  {status?<div className="moonLabResearch"><h5><FlaskConical size={17}/>{label('Environment and evidence','পরিবেশ ও বৈজ্ঞানিক প্রমাণ')}</h5><span className="moonLabTag">{status.evidence.toUpperCase()}</span>
    <p>{status.environment}</p><h5>{label('Interior (scientific model)','অভ্যন্তরীণ গঠন (মডেল)')}</h5>
    <p>{status.interior}</p><a href={status.source} target="_blank" rel="noopener noreferrer">{label('NASA scientific source','NASA বৈজ্ঞানিক সূত্র')} <ArrowUpRight size={13}/></a>
   </div>:<div className="moonLabNotice">{label('No vetted interior or ocean claim is included for this moon. Unknown is not equivalent to absent.','এই উপগ্রহের অভ্যন্তরীণ গঠন যাচাই করা তথ্য নেই। অজানা মানে বৈশিষ্ট্য নেই—এমন নয়।')}</div>}
  <p className="moonLabNotice"><Info size={14}/>{label('JPL GM and density are reference values, not live sensor readings. Surface gravity, escape speed and mass are formula-derived approximations. Near-irregular moons, radius uncertainty and GM uncertainty can make the estimates unreliable. A GM reported as zero/upper limit is deliberately treated as unavailable.','GM ও density JPL-এর reference value। Gravity, escape velocity ও mass সূত্র থেকে গণনাকৃত; ছোট moon-এর ক্ষেত্রে অনিশ্চয়তা অনেক বেশি হতে পারে। শূন্য GM থাকলে হিসাব দেখানো হয় না।')}</p>
  <a className="moonLabSource" href={PHYSICAL_SOURCE} target="_blank" rel="noopener noreferrer">JPL SOLAR SYSTEM DYNAMICS — PHYSICAL PARAMETERS <ArrowUpRight size={14}/></a>
 </>;
}
function CompareMoons({selected,compareIds,setCompareIds,bn}){
 const label=(en,bangla)=>bn?bangla:en;
 const compared=useMemo(()=>moonComparison(compareIds.map(moonById)),[compareIds]);
 const add=id=>setCompareIds(old=>old.includes(id)?old:old.length>=4?[...old.slice(1),id]:[...old,id]);
 function remove(id){setCompareIds(old=>old.filter(x=>x!==id))}
 const metrics=[['radiusKm','Mean radius','km'],['orbitKm','Orbital semimajor distance','km'],['gravityMS2','Derived surface gravity','m/s²'],['densityGcm3','JPL mean density','g/cm³'],['periodDays','Sidereal orbital period','days']];
 return <div className="moonLabCompare">
  <p>{label('Compare 2–4 curated natural moons across different planetary systems. Gravity is a derived spherical approximation.','ভিন্ন গ্রহের ২–৪টি প্রাকৃতিক উপগ্রহ তুলনা করুন। Gravity আনুমানিক গণনা।')}</p>
  <div className="moonLabCompareActions"><label>{label('Add moon','উপগ্রহ যোগ করুন')}
    <select aria-label="Moon comparison target" value="" onChange={e=>{if(e.target.value)add(e.target.value)}}>
     <option value="">{label('Select a moon…','উপগ্রহ বাছাই করুন…')}</option>
     {MOONS.filter(m=>!compareIds.includes(m.id)).sort((a,b)=>a.planet.localeCompare(b.planet)||a.name.localeCompare(b.name)).map(m=><option value={m.id} key={m.id}>{m.planet} · {m.name}</option>)}
    </select></label>
   <button onClick={()=>add(selected.id)} type="button" disabled={compareIds.includes(selected.id)}><Plus size={14}/>{label('ADD CURRENT','বর্তমানটি যোগ')}</button>
  </div>
  <div className="moonLabSelectedChips">{compared.map(m=><button title={'Remove '+m.name} key={m.id} type="button" onClick={()=>remove(m.id)}>{m.name} <X size={13}/></button>)}</div>
  {compared.length<2?<p className="moonLabNotice">Choose at least two different moons to display comparison graphs.</p>:
  <div className="moonLabComparisonPlots">{metrics.map(([field,title,unit])=>{
   const vals=compared.map(m=>m[field]);const max=Math.max(...vals.filter(v=>Number.isFinite(v)),0);
   return <div key={field} className="moonLabComparisonMetric"><h5>{title} <small>({unit})</small></h5>
    {compared.map(m=><div className="moonLabComparisonRow" key={m.id}>
     <span>{m.name}</span><div className="moonLabBarTrack"><div style={{width:Number.isFinite(m[field])&&max>0?(100*m[field]/max)+'%':'0%'}}/></div>
     <strong>{fixed(m[field],field==='orbitKm'?0:3)}</strong>
    </div>)}
   </div>})}</div>}
  <p className="moonLabNotice">Charts scale within each selected metric; they do not use a common physical scale. Unknown measurements remain blank rather than zero.</p>
 </div>;
}
export default function MoonScienceLab({moon}){
 const {language}=useLanguage(),bn=language==='bn';
 const label=(a,b)=>bn?b:a;
 const [tab,setTab]=useState('science');
 const [compareIds,setCompareIds]=useState(()=>[moon?.id||'europa','titan'].filter(Boolean));
 useEffect(()=>{if(moon)setCompareIds(old=>old.includes(moon.id)?old:old.length>=4?[...old.slice(1),moon.id]:[...old,moon.id])},[moon?.id]);
 if(!moon)return null;
 const media=moonMedia(moon.id);
 return <section className="moonScienceLab" aria-label={'Moon science lab '+moon.name}>
  <div className="moonLabHeader"><div><span>MOONVERSE / v5.1 / JPL SCIENCE</span><h4><Layers3 size={20}/>{label('Advanced Moon Intelligence','উন্নত উপগ্রহ গবেষণা')}</h4></div>
   <span className="moonLabVersion">{moon.name.toUpperCase()} · {physicalParameters(moon)?.naifCode||'—'}</span>
  </div>
  <div className="moonLabTabs" role="tablist" aria-label="Moon scientific investigations">
   {[
    ['science',label('PHYSICAL SCIENCE','পদার্থবিজ্ঞান'),FlaskConical],
    ['compare',label('COMPARE MOONS','উপগ্রহ তুলনা'),GitCompare],
    ['media',label('NASA IMAGES','NASA ছবি'),Camera]
   ].map(([id,title,Icon])=><button type="button" key={id} role="tab" aria-selected={tab===id} className={tab===id?'current':''} onClick={()=>setTab(id)}><Icon size={16}/>{title}</button>)}
  </div>
  <div className="moonLabBody" role="tabpanel">
   {tab==='science'&&<PhysicalDetails moon={moon} bn={bn}/>}
   {tab==='compare'&&<CompareMoons selected={moon} compareIds={compareIds} setCompareIds={setCompareIds} bn={bn}/>}
   {tab==='media'&&<SafeNasaMedia record={media}/>}
  </div>
 </section>;
}
