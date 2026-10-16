export const NASA_IMAGERY_ATTRIBUTION='NASA EOSDIS Global Imagery Browse Services (GIBS) · MODIS Terra';
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
export function validateImagerySnapshot(row){
 if(!row||!DATE_RE.test(row.date)||!/^modis-terra-\d{4}-\d{2}-\d{2}\.jpg$/.test(row.file)||row.width!==1024||row.height!==512)return null;
 const date=Date.parse(row.date+'T00:00:00Z');
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==row.date)return null;
 return {date:row.date,file:row.file,label:String(row.label||'MODIS Terra true-color daily mosaic').slice(0,120),acquisitionNote:String(row.acquisitionNote||'Daily browse mosaic').slice(0,180)};
}
export function imageryAssetUrl(file){
 if(!/^modis-terra-\d{4}-\d{2}-\d{2}\.jpg$/.test(file))return null;
 return (import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/')+'earth-imagery/'+file;
}
export async function loadNasaImageryManifest(){
 const url=(import.meta.env?.BASE_URL||'/Aurora-Planet-Tracker/')+'earth-imagery/manifest.json';
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error('NASA imagery manifest HTTP '+response.status);
 const value=await response.json();
 const snapshots=Array.isArray(value.snapshots)?value.snapshots.map(validateImagerySnapshot).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8):[];
 if(!snapshots.length)throw Error('No verified NASA imagery snapshots yet');
 return {snapshots,source:NASA_IMAGERY_ATTRIBUTION,fetchedAt:value.fetchedAt};
}
