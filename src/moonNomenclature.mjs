// v5.4 — USGS/IAU Gazetteer georeferenced feature centers.
// ALL values copied from individual approved nomenclature records, +WEST
// 0–360, planetographic latitude. Not spacecraft-accurate surface mapping.
// Original photojournal coordinates in moonGeology.mjs MUST NOT be used as
// georeferenced markers unless independently validated here.
export const IAU_GAZETTEER='https://planetarynames.wr.usgs.gov/';
const SITES=[
 ['europa','conamara','Conamara Chaos',9.7,272.7,1282,'1997'],
 ['phobos','stickney','Stickney',1,49,5707,'1973'],
 ['titan','kraken','Kraken Mare',68,310,14399,'2008'],
 ['titan','ligeia','Ligeia Mare',79.7,247.9,14400,'2008'],
 ['callisto','valhalla','Valhalla',14.7,56,6284,'1979']
];
export const IAU_FEATURE_COORDS=Object.freeze(SITES.map(([moonId,featureId,name,latitude,longitudeWest,usgsId,approvedYear])=>Object.freeze({
 moonId,featureId,name,latitude,longitudeWest,usgsId,approvedYear,
 coordinateSystem:'planetographic +West 0–360',status:'Adopted by IAU',
 source:IAU_GAZETTEER+'Feature/'+usgsId
})));
export function nomenclatureForMoon(moonId){return IAU_FEATURE_COORDS.filter(x=>x.moonId===moonId)}
export function nomenclatureForFeature(moonId,featureId){return IAU_FEATURE_COORDS.find(x=>x.moonId===moonId&&x.featureId===featureId)||null}
export function validNomenclatureCoordinate(feature){
 return !!feature&&typeof feature.moonId==='string'&&typeof feature.featureId==='string'&&
 Number.isInteger(feature.usgsId)&&feature.usgsId>0&&
 Number.isFinite(feature.latitude)&&feature.latitude>=-90&&feature.latitude<=90&&
 Number.isFinite(feature.longitudeWest)&&feature.longitudeWest>=0&&feature.longitudeWest<360&&
 feature.coordinateSystem==='planetographic +West 0–360'&&feature.status==='Adopted by IAU'&&
 feature.source===IAU_GAZETTEER+'Feature/'+feature.usgsId;
}
export function westLongitudeToEast(west){
 if(!Number.isFinite(west))return null;
 return ((360-(west%360))%360+360)%360;
}
export function projectIAUPoint(feature,{width=720,height=360}={}){
 if(!validNomenclatureCoordinate(feature)||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const east=westLongitudeToEast(feature.longitudeWest);
 return {x:width*east/360,y:height*(90-feature.latitude)/180,
  eastLongitude:east,westLongitude:feature.longitudeWest,latitude:feature.latitude};
}
export function nomenclatureAudit(moons){
 const valid=IAU_FEATURE_COORDS.every(validNomenclatureCoordinate);
 const unique=new Set(IAU_FEATURE_COORDS.map(x=>x.moonId+'|'+x.featureId)).size===IAU_FEATURE_COORDS.length;
 const inCatalog=IAU_FEATURE_COORDS.every(x=>{const entry=moons?.[x.moonId];const features=Array.isArray(entry)?entry:entry?.features;return Array.isArray(features)&&features.some(feature=>feature.id===x.featureId)});
 return {valid:valid&&unique&&inCatalog,records:IAU_FEATURE_COORDS.length,moons:new Set(IAU_FEATURE_COORDS.map(x=>x.moonId)).size,
 errors:[!valid?'Invalid coordinate/source metadata':null,!unique?'Duplicate site keys':null,!inCatalog?'Gazetteer site not in NASA curated geology catalog':null].filter(Boolean)};
}
