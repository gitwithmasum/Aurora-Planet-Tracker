import React,{useEffect,useState} from 'react';
const photoCache=new Set();
const SOURCES={
 m51:{page:'https://science.nasa.gov/asset/hubble/out-of-this-whirl-the-whirlpool-galaxy-m51-and-companion-galaxy/',credit:'NASA / ESA / Hubble Heritage Team'},
 m104:{page:'https://science.nasa.gov/asset/hubble/the-majestic-sombrero-galaxy-m104/',credit:'NASA / Hubble Heritage Team'}
};
export default function GalaxyPhoto({galaxy,large=false}){
 const source=SOURCES[galaxy.id];
 const [loaded,setLoaded]=useState(()=>photoCache.has(galaxy.id)),[failed,setFailed]=useState(false);
 useEffect(()=>{setLoaded(photoCache.has(galaxy.id));setFailed(false)},[galaxy.id]);
 const img=source?import.meta.env.BASE_URL+'galaxy-images/'+galaxy.id+'.jpg':null;
 return <div className={`goPhoto ${large?'goPhoto--large':''}`} style={{'--tone':galaxy.color}}>
  {img&&!failed&&<img key={galaxy.id} loading={large?"eager":"lazy"} decoding="async" src={img} alt={`NASA Hubble observation of ${galaxy.name}`} onLoad={()=>{photoCache.add(galaxy.id);setLoaded(true)}} onError={()=>setFailed(true)} style={{opacity:loaded?1:0}}/>}
  {(!loaded||failed)&&<div className="goPhotoFallback"><span className="goPhotoSpiral"/> <small>CONCEPTUAL GALAXY VISUAL</small></div>}
  <div className="goPhotoCaption">{loaded&&source?'NASA HUBBLE IMAGE':'ILLUSTRATIVE VISUAL'}{source&&<a href={source.page} target="_blank" rel="noopener noreferrer">NASA SOURCE ↗</a>}</div>
 </div>;
}
