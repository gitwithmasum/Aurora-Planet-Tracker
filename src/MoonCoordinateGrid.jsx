import React,{useMemo} from 'react';
import {MapPin,ExternalLink,Info,Globe2} from 'lucide-react';
import {nomenclatureForMoon,projectIAUPoint,IAU_GAZETTEER} from './moonNomenclature.mjs';
import {useLanguage} from './i18n.jsx';
import './MoonCoordinateGrid.css';

// A coordinate reference GRID, NOT an image basemap, globe texture or verified
// surface photomosaic. USGS feature center positions only; no invented pins.
const V_WIDTH=720,V_HEIGHT=360;
export default function MoonCoordinateGrid({moonId,selectedFeatureId,onFeatureSelect}){
 const {language}=useLanguage(),bn=language==='bn';
 const features=useMemo(()=>nomenclatureForMoon(moonId),[moonId]);
 const placed=useMemo(()=>features.map(f=>({...f,projection:projectIAUPoint(f)})).filter(f=>f.projection),[features]);
 return <section className="moonCoordGrid" aria-label="USGS IAU planetary nomenclature coordinate grid">
  <div className="moonCoordHeader">
   <span><Globe2 size={17}/>{bn?'IAU/USGS অনুমোদিত স্থানাঙ্ক':'IAU/USGS Verified Feature Centers'}</span>
   <strong>{placed.length} {bn?'টি যাচাইকৃত স্থান':'verified locations'}</strong>
  </div>
  <p>{bn?'এটি বাস্তব পৃষ্ঠের উপগ্রহ-ছবি বা 3D map নয়; অনুমোদিত geological feature-এর কেন্দ্র নির্দিষ্ট অক্ষাংশ–দ্রাঘিমাংশে দেখানো grid। খালি অঞ্চল data অনুপস্থিত বোঝায়।':'Coordinate grid only, NOT a photo surface map or topographic basemap. Pins indicate official IAU named-feature centers; blank areas do not mean unobserved terrain.'}</p>
  {placed.length?<>
    <div className="moonCoordSurface">
     <svg aria-hidden="true" viewBox="0 0 720 360" preserveAspectRatio="none">
      <rect x="0" y="0" width="720" height="360" fill="#092239"/>
      {[0,60,120,180,240,300,360].map(deg=><g key={'lon'+deg}>
       <line x1={deg*2} x2={deg*2} y1="0" y2="360" stroke="#6c9cb0" strokeWidth=".9" opacity=".5"/>
       <text x={Math.max(7,Math.min(696,deg*2+5))} y="19" fontSize="12" fill="#c8e2ed">{deg}° E</text>
      </g>)}
      {[-60,-30,0,30,60].map(lat=><g key={'lat'+lat}>
       <line x1="0" x2="720" y1={(90-lat)*2} y2={(90-lat)*2} stroke="#6c9cb0" strokeWidth=".8" opacity=".5"/>
       <text x="9" y={(90-lat)*2-6} fontSize="12" fill="#c1dbea">{Math.abs(lat)}° {lat<0?'S':lat>0?'N':''}</text>
      </g>)}
     </svg>
     {placed.map((feature,i)=><button
      type="button" key={feature.usgsId} className={'moonCoordPin'+(selectedFeatureId===feature.featureId?' current':'')}
      aria-label={'Select verified feature '+feature.name}
      aria-pressed={selectedFeatureId===feature.featureId}
      style={{left:(100*feature.projection.x/V_WIDTH)+'%',top:(100*feature.projection.y/V_HEIGHT)+'%'}}
      title={feature.name+' — '+feature.latitude+'° latitude, '+feature.longitudeWest+'° W'}
      onClick={()=>onFeatureSelect(feature.featureId)}>
      <MapPin size={21} aria-hidden="true"/><span className="moonCoordPinName">{feature.name}</span>
     </button>)}
    </div>
    <div className="moonCoordRows" role="group" aria-label="Official named feature centers">
     {placed.map(feature=><div key={feature.usgsId} className={selectedFeatureId===feature.featureId?'active':''}>
      <button type="button" onClick={()=>onFeatureSelect(feature.featureId)} aria-pressed={selectedFeatureId===feature.featureId}>
       <MapPin size={14}/><strong>{feature.name}</strong><span>{feature.latitude.toFixed(1)}° {feature.latitude>=0?'N':'S'} · {feature.longitudeWest.toFixed(1)}° W</span>
      </button>
      <a href={feature.source} target="_blank" rel="noopener noreferrer" title={'USGS IAU feature '+feature.usgsId}><ExternalLink size={14}/>{bn?'IAU সূত্র':'IAU record'}</a>
     </div>)}
    </div>
  </>:<div className="moonCoordEmpty" role="status"><Info size={21}/>{bn?'এই উপগ্রহের geological features-এর জন্য যাচাইকৃত IAU coordinates এখনো catalog-এ নেই। কোনো কাল্পনিক marker দেখানো হবে না।':'No independently verified IAU feature-center coordinates are curated for this moon. No locations are invented.'}</div>}
  <p className="moonCoordFoot">{bn?'USGS Gazetteer-এর গ্রহগত planetographic latitude ও ০–৩৬০° +West longitude-কে পূর্বমুখী গ্রিডে রূপান্তর করা হয়েছে। পিনগুলো feature-এর কেন্দ্র, বিশাল এলাকার সীমানা নয়।':'Grid increases toward 360° EAST; source records use planetographic latitude and 0–360° WEST longitude. Pins represent recorded feature centers, NOT exact outlines, photogrammetry or spacecraft navigation.'} <a href={IAU_GAZETTEER+'Page/Specifics'} target="_blank" rel="noopener noreferrer">USGS coordinate conventions <ExternalLink size={12}/></a></p>
 </section>;
}
