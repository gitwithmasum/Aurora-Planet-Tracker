import React from 'react';
import './PlanetPortrait.css';

const BASE=import.meta.env.BASE_URL;
const CREDIT={
 Mercury:'Mariner 10 mission-derived map',
 Venus:'Magellan radar-derived false-color map',
 Earth:'NASA/JPL topographic rendering',
 Mars:'Viking-derived surface mosaic',
 Jupiter:'Voyager atmospheric composite',
 Saturn:'JPL representative rendering',
 Uranus:'JPL representative rendering',
 Neptune:'JPL representative rendering'
};
export default function PlanetPortrait({planet,compact=false}){
 const planetName=planet.name.toLowerCase();
 const style={'--planet-map':`url("${BASE}planet-textures/${planetName}.jpg")`,'--planet-tint':planet.color};
 return <div className={`planetPortrait planetPortrait--${planetName} ${compact?'planetPortrait--compact':''}`} style={style} role="img" aria-label={`${planet.name} visualization derived from NASA/JPL map imagery`}>
  {!compact&&<div className="planetPortrait__stars" aria-hidden="true"/>}
  {(planet.name==='Saturn'||planet.name==='Uranus')&&<div className="planetPortrait__ring planetPortrait__ring--back" aria-hidden="true"/>}
  <div className="planetPortrait__sphere" aria-hidden="true"/>
  {(planet.name==='Saturn'||planet.name==='Uranus')&&<div className="planetPortrait__ring planetPortrait__ring--front" aria-hidden="true"/>}
  {!compact&&<div className="planetPortrait__credit">{CREDIT[planet.name]} · NASA/JPL source</div>}
 </div>;
}
