import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Search,X,Orbit,Satellite,Compass,Layers3,ArrowUpRight,LoaderCircle} from 'lucide-react';
import {loadSatelliteCatalog} from './satelliteCatalog.mjs';
import {buildSpaceIndex,searchSpace} from './spaceSearch.mjs';
import {MOONS} from './moonCatalog.mjs';
import './UniversalSearch.css';

const ICONS={planet:Orbit,moon:Orbit,satellite:Satellite,galaxy:Compass,module:Layers3};
const TYPE_LABEL={planet:'PLANET',moon:'NATURAL MOON',satellite:'SATELLITE',galaxy:'GALAXY',module:'MODULE'};
export default function UniversalSearch({planets,galaxies,onSelect,onClose,language='en'}){
 const bn=language==='bn';
 const [query,setQuery]=useState('');
 const [activeIndex,setActiveIndex]=useState(0);
 const [satellites,setSatellites]=useState([]);
 const [status,setStatus]=useState('loading');
 const field=useRef(null),dialog=useRef(null);
 useEffect(()=>{
  let live=true;
  loadSatelliteCatalog().then(data=>{
   if(live){setSatellites(data.rows);setStatus('ready')}
  }).catch(()=>{
   if(live)setStatus('unavailable');
  });
  return()=>{live=false};
 },[]);
 useEffect(()=>{
  const previous=document.activeElement;
  field.current?.focus();
  return()=>{if(previous?.isConnected)previous.focus?.()};
 },[]);
 useEffect(()=>{
  function key(event){if(event.key==='Escape'){event.preventDefault();onClose()}}
  document.addEventListener('keydown',key);
  return()=>document.removeEventListener('keydown',key);
 },[onClose]);
 const index=useMemo(()=>buildSpaceIndex({planets,galaxies,satellites,moons:MOONS}),[planets,galaxies,satellites]);
 const results=useMemo(()=>searchSpace(index,query),[index,query]);
 const pick=item=>{if(item)onSelect(item)};
 function keyboard(event){
  if(event.key==='ArrowDown'){
   event.preventDefault();setActiveIndex(v=>results.length?(v+1)%results.length:0);
  }else if(event.key==='ArrowUp'){
   event.preventDefault();setActiveIndex(v=>results.length?(v-1+results.length)%results.length:0);
  }else if(event.key==='Enter'&&results.length){
   event.preventDefault();pick(results[activeIndex]||results[0]);
  }
 }
 function trapTab(event){
  if(event.key!=='Tab')return;
  const focusables=[...dialog.current.querySelectorAll('button:not([disabled]),input:not([disabled])')];
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }
 return <div className="universalSearchBackdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section ref={dialog} className="universalSearch" role="dialog" aria-modal="true" aria-labelledby="universalSearchTitle" onKeyDown={trapTab}>
   <div className="universalSearchTop">
    <div><small>AURORA / v3.9</small><h2 id="universalSearchTitle">{bn?'মহাকাশ অনুসন্ধান':'Universal Space Search'}</h2></div>
    <button className="universalSearchClose" onClick={onClose} aria-label={bn?'অনুসন্ধান বন্ধ করুন':'Close universal search'}><X size={20}/></button>
   </div>
   <div className="universalSearchInput"><Search size={21}/><input ref={field} role="combobox" aria-label={bn?'গ্রহ, স্যাটেলাইট, গ্যালাক্সি বা মডিউল খুঁজুন':'Search planets, satellites, galaxies or modules'} aria-autocomplete="list" aria-expanded={Boolean(query.trim())} aria-controls="universalSearchResults" value={query} maxLength={80} onChange={e=>{setQuery(e.target.value);setActiveIndex(0)}} onKeyDown={keyboard} placeholder={bn?'যেমন: Mars, ISS, M31, 25544':'Try Mars, ISS, M31, 25544, NASA…'}/><kbd>ESC</kbd></div>
   <div className="universalSearchMeta"><span>{bn?'গ্রহ · প্রাকৃতিক উপগ্রহ · স্যাটেলাইট · গ্যালাক্সি · মডিউল':'PLANETS · NATURAL MOONS · SATELLITES · GALAXIES · MODULES'}</span><span>{status==='loading'?<><LoaderCircle size={12}/> {bn?'ক্যাটালগ লোড হচ্ছে':'Loading catalog'}</>:status==='ready'?`${satellites.length} validated satellite records`:(bn?'স্যাটেলাইট ডেটা পাওয়া যায়নি':'Satellite catalog unavailable')}</span></div>
   <div id="universalSearchResults" className="universalSearchResults" role="listbox" aria-label="Universal search results">
    {!query.trim()?<p className="universalSearchHint">{bn?'অনুসন্ধানের জন্য শব্দ লিখুন। Ctrl+K চাপলেও এটি খুলবে।':'Type to search the local astronomy catalog. Press Ctrl/⌘ + K anywhere to reopen.'}</p>:
    results.length?results.map((item,i)=>{
     const Icon=ICONS[item.type];
     return <button key={item.id} className={i===activeIndex?'active':''} type="button" role="option" aria-selected={i===activeIndex} onMouseEnter={()=>setActiveIndex(i)} onClick={()=>pick(item)}>
      <span className="universalSearchIcon"><Icon size={19}/></span><span className="universalSearchItemText"><strong>{item.title}</strong><small>{item.description}</small></span><span className="universalSearchType">{TYPE_LABEL[item.type]}</span><ArrowUpRight size={16}/>
     </button>;
    }):<p className="universalSearchHint">{bn?'কোনো ফল পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।':'No results found. Try a planet name, NORAD ID, Messier number or module.'}</p>}
   </div>
   <div className="universalSearchFooter"><span>{bn?'↑ ↓ নির্বাচন · Enter খুলুন · Esc বন্ধ':'↑ ↓ Select · Enter Open · Esc Close'}</span><span>{bn?'কক্ষপথের অবস্থান গণনাভিত্তিক':'Satellite orbits are computed estimates'}</span></div>
  </section>
 </div>;
}
