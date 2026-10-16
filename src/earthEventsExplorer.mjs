export const EVENT_WINDOWS=[7,14,30,90,365];
export function eventCategories(events){
 return ['All',...new Set(events.map(e=>e.category||'Uncategorized'))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
}
export function filterEarthEvents(events,{category='All',days=30,search=''}={},now=Date.now()){
 const earliest=now-Math.max(1,days)*86400000,q=search.trim().toLowerCase();
 return events.filter(e=>{
  const date=Date.parse(e.date);
  return Number.isFinite(date)&&date>=earliest&&date<=now+86400000&&(category==='All'||(e.category||'Uncategorized')===category)&&
   (!q||[e.title,e.category,e.id].some(x=>String(x||'').toLowerCase().includes(q)));
 }).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
}
export function sourceEventLink(item){
 if(!item||!/^EONET_[A-Za-z0-9_-]{1,35}$/.test(item.id))return null;
 return 'https://eonet.gsfc.nasa.gov/api/v3/events/'+encodeURIComponent(item.id);
}
