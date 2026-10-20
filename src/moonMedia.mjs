// v5.1 NASA/JPL verified image PHOTOJOURNAL records, with provenance.
// Thumbnails are fetched on demand from NASA's official Images API.
// An image is never synthesized or attributed to another moon.
export const NASA_IMAGE_API='https://images-api.nasa.gov/search';
export const MOON_MEDIA=Object.freeze({
 europa:{nasaId:'PIA01295',title:'Europa: natural and enhanced-color global views',credit:'NASA/JPL/University of Arizona',kind:'NASA Galileo image composite',page:'https://science.nasa.gov/photojournal/pj-europa-global-views-in-natural-and-enhanced-colors/'},
 titan:{nasaId:'PIA14909',title:'Titan Up Front',credit:'NASA/JPL-Caltech/Space Science Institute',kind:'Cassini natural-color photograph',page:'https://science.nasa.gov/resource/titan-up-front/'},
 ganymede:{nasaId:'PIA24681',title:'Juno Ganymede close-up',credit:'NASA/JPL-Caltech/SwRI/MSSS',kind:'JunoCam green-filter image',page:'https://science.nasa.gov/photojournal/junos-ganymede-close-up/'},
 enceladus:{nasaId:'PIA12762',title:'Plumes and a Crescent',credit:'NASA/JPL/Space Science Institute',kind:'Cassini photograph',page:'https://science.nasa.gov/photojournal/plumes-and-a-crescent/'},
 triton:{nasaId:'PIA00317',title:'Global Color Mosaic of Triton',credit:'NASA/JPL/USGS',kind:'Voyager 2 reconstructed color mosaic',page:'https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/'},
 io:{nasaId:'PIA26486',title:'Surface Changes on Io',credit:'NASA/JPL-Caltech/SwRI/MSSS',kind:'JunoCam-derived surface map',page:'https://science.nasa.gov/photojournal/pj-surface-changes-on-io/'}
});
export function moonMedia(id){return MOON_MEDIA[id]||null}
export function nasaImageQuery(record){
 if(!record||!/^PIA[0-9]{5}$/.test(record.nasaId))return null;
 const params=new URLSearchParams({nasa_id:record.nasaId,media_type:'image',page_size:'2'});
 return NASA_IMAGE_API+'?'+params.toString();
}
export function extractNasaThumbnail(payload,record){
 const list=payload?.collection?.items;
 if(!Array.isArray(list))return null;
 const item=list.find(it=>it?.data?.some(row=>row.nasa_id===record?.nasaId));
 const links=item?.links||[];
 const match=links.find(it=>{
  try{const url=new URL(it.href);return url.protocol==='https:'&&url.hostname==='images-assets.nasa.gov'&&it.rel==='preview'}catch{return false}
 });
 return match?.href||null;
}
