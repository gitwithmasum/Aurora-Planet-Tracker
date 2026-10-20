import React,{Suspense,lazy,useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Camera,FlaskConical,Layers3,MapPin,RefreshCw,ShieldCheck,Waves} from 'lucide-react';
import {geologyForMoon,featuresForMoon,geologySummary} from './moonGeology.mjs';
import {nomenclatureForFeature,nomenclatureForMoon} from './moonNomenclature.mjs';
import {nasaImageQuery,extractNasaThumbnail} from './moonMedia.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonGeologyExplorer.css';
const MoonCoordinateGrid=lazy(()=>import('./MoonCoordinateGrid.jsx'));

const EVIDENCE={observed:{en:'OBSERVED',bn:'পর্যবেক্ষিত'},inferred:{en:'INFERRED',bn:'প্রমাণভিত্তিক অনুমান'},hypothetical:{en:'HYPOTHESIS',bn:'হাইপোথিসিস'}};
function Evidence({level,bn}){
 const value=EVIDENCE[level]||EVIDENCE.hypothetical;
 return <span className={'moonGeoEvidence moonGeoEvidence-'+level}>{bn?value.bn:value.en}</span>;
}
function Cutaway({moonId,layers,selectedId,onSelect,bn}){
 const raw=useId(),clipId='moon-cut-'+raw.replace(/[^a-z0-9_-]/gi,'');
 const radii=useMemo(()=>layers.map((_,i)=>145-i*(layers.length>1?118/(layers.length-1):0)),[layers]);
 const selectedIndex=layers.findIndex(l=>l.id===selectedId);
 return <div className="moonGeoCutaway">
  <svg viewBox="0 0 370 350" role="img" aria-label={'Qualitative schematic interior of '+moonId+', not to scale'} focusable="false">
   <defs>
    <radialGradient id={clipId+'-planet'} cx="28%" cy="24%" r="76%"><stop offset="0%" stopColor="#dce9e9"/><stop offset="62%" stopColor="#697e9d"/><stop offset="100%" stopColor="#121e38"/></radialGradient>
    <clipPath id={clipId}><rect x="187" y="26" width="161" height="299"/></clipPath>
   </defs>
   <circle cx="186" cy="176" r="148" fill={'url(#'+clipId+'-planet)'} stroke="#bacddd" strokeWidth="1.5"/>
   <g clipPath={'url(#'+clipId+')'}>
    {layers.map((layer,i)=><circle key={layer.id} cx="186" cy="176" r={radii[i]} fill={layer.color} stroke="#223449" strokeWidth="1.5"/>)}
    {selectedIndex>=0&&<circle cx="186" cy="176" r={radii[selectedIndex]} fill="none" stroke="#ffe0a9" strokeWidth="4" strokeDasharray="5 4"/>}
   </g>
   <path d="M186 27 L186 324" stroke="#d8e6f6" strokeWidth="1.5" strokeDasharray="3 3"/>
   <path d="M186 27 A149 149 0 0 1 186 325" fill="none" stroke="#cce4f7" strokeWidth="1.8"/>
   <text x="186" y="16" fontSize="10" textAnchor="middle" fill="#e9c9a3">NOT TO SCALE</text>
   <text x="69" y="344" fontSize="11" textAnchor="middle" fill="#c2d9eb">EXTERIOR</text>
   <text x="277" y="344" fontSize="11" textAnchor="middle" fill="#c2d9eb">SCHEMATIC CUT</text>
  </svg>
  <p className="moonGeoSmall">{bn?'রঙ, layer-এর ব্যাস ও অবস্থান কেবল ধারণাগত; প্রকৃত গভীরতা, পরিমাণ বা georeferenced profile নয়।':'Schematic colors and layer radii are illustrative; they do not measure shell depth, volume or temperature.'}</p>
  <div className="moonGeoLayerButtons" role="group" aria-label="Select schematic interior layer">
   {layers.map(layer=><button key={layer.id} type="button" className={selectedId===layer.id?'selected':''}
     aria-pressed={selectedId===layer.id} onClick={()=>onSelect(layer.id)}>
     <span className="moonGeoSwatch" style={{background:layer.color}}/>
     <span>{layer.name}</span><Evidence level={layer.evidence} bn={bn}/>
   </button>)}
  </div>
 </div>;
}
function FeatureImage({feature,bn}){
 const [image,setImage]=useState('');
 const [state,setState]=useState('idle');
 const controller=useRef(null);
 useEffect(()=>{controller.current?.abort();setImage('');setState('idle');return()=>controller.current?.abort()},[feature?.id]);
 if(!feature?.nasaId)return <p className="moonGeoSmall">{bn?'এই ভূতাত্ত্বিক অঞ্চলের জন্য curated NASA preview নেই।':'No verified NASA thumbnail is curated for this feature.'}</p>;
 async function request(){
  controller.current?.abort();
  const c=new AbortController();controller.current=c;
  setState('loading');
  const limit=setTimeout(()=>c.abort(),9000);
  try{
   const res=await fetch(nasaImageQuery({nasaId:feature.nasaId}),{signal:c.signal,headers:{Accept:'application/json'}});
   if(!res.ok)throw Error('NASA media service unavailable');
   const payload=await res.json();
   const preview=extractNasaThumbnail(payload,{nasaId:feature.nasaId});
   if(!preview)throw Error('No verified NASA preview');
   if(!c.signal.aborted){setImage(preview);setState('ready')}
  }catch{if(!c.signal.aborted)setState('unavailable')}
  finally{clearTimeout(limit)}
 }
 return <div className="moonGeoMedia">
  {image?<img src={image} alt={feature.name+' — official NASA preview (not a map pin)'} loading="lazy" referrerPolicy="no-referrer"
   onError={()=>{setImage('');setState('unavailable')}}/>:<div className="moonGeoMediaPlaceholder"><Camera size={27}/><span>NASA PHOTOJOURNAL {feature.nasaId}</span></div>}
  <button type="button" disabled={state==='loading'} onClick={request}><RefreshCw size={14}/>{state==='loading'?'CHECKING NASA…':image?'RELOAD NASA IMAGE':'LOAD NASA PREVIEW'}</button>
  {state==='unavailable'&&<p role="status">{bn?'NASA preview পাওয়া যায়নি। নিচের মূল NASA source link ব্যবহার করুন।':'NASA preview unavailable. Use the original NASA source link below.'}</p>}
  <small>{bn?'NASA source থেকে চাহিদামতো ছবি আনা হয়; কোনো ছবি নিজে তৈরি করা হয়নি।':'On-demand NASA thumbnail. An illustration is never substituted as real photography.'}</small>
 </div>;
}
export default function MoonGeologyExplorer({moon}){
 const {language}=useLanguage(),bn=language==='bn';
 const profile=geologyForMoon(moon?.id);
 const [view,setView]=useState('surface');
 const [showMap,setShowMap]=useState(false);
 const [featureId,setFeatureId]=useState(null),[layerId,setLayerId]=useState(null);
 useEffect(()=>{setFeatureId(null);setLayerId(null);setView('surface');setShowMap(false)},[moon?.id]);
 if(!moon)return null;
 if(!profile)return <section className="moonGeoEmpty" aria-label="Moon geological profile unavailable">
  <Layers3 size={24}/><h5>{moon.name} — {bn?'গবেষণা তথ্য সীমিত':'Geological research still being curated'}</h5>
  <p>{bn?'এই উপগ্রহের পর্যাপ্ত যাচাইকৃত ভূতাত্ত্বিক feature বা interior model এখনো catalog-এ নেই। কাল্পনিক cross-section দেখানো হবে না।':'No verified regional features or defensible interior layering have been curated for this moon. No fictitious cutaway is displayed.'}</p>
 </section>;
 const feature=profile.features.find(x=>x.id===featureId)||profile.features[0];
 const verified=nomenclatureForFeature(moon.id,feature.id);
 const matchedSites=nomenclatureForMoon(moon.id);
 const layer=profile.layers.find(x=>x.id===layerId)||profile.layers[0];
 const summary=geologySummary();
 return <section className="moonGeoExplorer" aria-label={'Surface and interior explorer for '+moon.name}>
  <div className="moonGeoHeader"><div><span>MOONVERSE / v5.4 / SURFACE & INTERIOR</span>
   <h5><Layers3 size={21}/>{moon.name} · {bn?'ভূতত্ত্ব ও অভ্যন্তরীণ গঠন':'Surface & Interior Explorer'}</h5>
   <p>{profile.label} · {profile.features.length} {bn?'টি NASA-নথিভুক্ত স্থান/বৈশিষ্ট্য':'NASA-supported geological features'}</p></div>
   <div className="moonGeoOcean"><Waves size={16}/>{profile.ocean==='none-detected'?'NO CONFIRMED WATER OCEAN':profile.ocean==='hypothetical'?'OCEAN HYPOTHESIS':profile.ocean==='inferred'?'OCEAN INFERRED':'STRONG OCEAN EVIDENCE'}</div>
  </div>
  <div className="moonGeoModes" role="tablist" aria-label="Moon geological investigation">
   <button type="button" role="tab" aria-selected={view==='surface'} className={view==='surface'?'selected':''} onClick={()=>setView('surface')}><MapPin size={16}/>{bn?'ভূতাত্ত্বিক স্থান':'SURFACE ATLAS'}</button>
   <button type="button" role="tab" aria-selected={view==='interior'} className={view==='interior'?'selected':''} onClick={()=>setView('interior')}><Layers3 size={16}/>{bn?'অভ্যন্তরীণ স্তর':'INTERIOR CUTAWAY'}</button>
  </div>
  {view==='surface'?<div className="moonGeoSurface" role="tabpanel">
   <div className="moonGeoFeatureList" role="group" aria-label="Select geological feature">
    {profile.features.map(item=><button key={item.id} type="button" aria-pressed={feature.id===item.id} className={feature.id===item.id?'selected':''} onClick={()=>setFeatureId(item.id)}>
     <span><strong>{item.name}</strong><small>{item.kind}</small></span><Evidence level={item.evidence} bn={bn}/>
    </button>)}
   </div>
   <article className="moonGeoFeatureDetail">
    <div className="moonGeoMapControls">
     <button type="button" aria-pressed={showMap} onClick={()=>setShowMap(v=>!v)}>
      <MapPin size={15}/>{showMap?(bn?'স্থানাঙ্ক লুকাও':'HIDE COORDINATE GRID'):(bn?'IAU স্থানাঙ্ক দেখাও':'SHOW IAU COORDINATE GRID')}
     </button><small>{matchedSites.length} {bn?'টি USGS-যাচাইকৃত স্থান':'USGS-verified centers'}</small>
    </div>
    {showMap&&<Suspense fallback={<p className="moonGeoSmall" role="status">Loading IAU location grid…</p>}>
     <MoonCoordinateGrid moonId={moon.id} selectedFeatureId={feature.id} onFeatureSelect={setFeatureId}/>
    </Suspense>}
    <div className="moonGeoDetailTitle"><span>GEOLOGICAL FEATURE</span><h5>{feature.name}</h5><Evidence level={feature.evidence} bn={bn}/></div>
    <p>{feature.description}</p>
    {verified?<p className="moonGeoSmall"><MapPin size={13}/>{bn?'USGS/IAU অনুমোদিত feature center':'USGS/IAU approved feature center'}: {verified.latitude}° {verified.latitude>=0?'N':'S'}, {verified.longitudeWest}° W · <a href={verified.source} target="_blank" rel="noopener noreferrer">IAU #{verified.usgsId}</a> · {bn?'এলাকার সীমানা নয়':'Not a feature boundary'}</p>:
     <p className="moonGeoSmall">{bn?'যাচাইকৃত IAU latitude/longitude নেই; কাল্পনিক map pin নয়।':'No verified IAU coordinates are curated for this feature. No fabricated location pins or exact surface projection.'}</p>}
    <FeatureImage key={feature.id} feature={feature} bn={bn}/>
    <a href={feature.source} target="_blank" rel="noopener noreferrer">NASA SCIENTIFIC SOURCE <ArrowUpRight size={14}/></a>
   </article>
  </div>:<div className="moonGeoInterior" role="tabpanel">
   <Cutaway moonId={moon.name} layers={profile.layers} selectedId={layer.id} onSelect={setLayerId} bn={bn}/>
   <article className="moonGeoInteriorDetail"><div><span>SELECTED INTERIOR LAYER</span><Evidence level={layer.evidence} bn={bn}/></div>
    <h5>{layer.name}</h5><strong>{layer.material}</strong><p>{layer.description}</p>
    <div className="moonGeoCaution"><ShieldCheck size={17}/><span>{profile.note}</span></div>
    <p className="moonGeoSmall">{bn?'স্তরের বেধ ও গভীরতা ইচ্ছাকৃতভাবে দেওয়া হয়নি; বাস্তব তথ্যসূত্রে অনিশ্চিত হলে schematic-এ সংখ্যা দেখানো হবে না।':'No layer thickness or radial boundary is asserted: depth and chemistry may be unknown, inferred or debated.'}</p>
   </article>
  </div>}
  <footer className="moonGeoFooter"><FlaskConical size={16}/><span>{bn?'বৈজ্ঞানিক তথ্য ও চিত্রের পার্থক্য: Observed = পর্যবেক্ষিত; Inferred = প্রমাণভিত্তিক মডেল; Hypothesis = সম্ভাব্য ব্যাখ্যা।':'Evidence legend: observed = directly imaged or measured; inferred = supported interpretation; hypothesis = unconfirmed model.'}</span><span>{summary.researchedMoons} RESEARCHED WORLDS</span></footer>
 </section>;
}
