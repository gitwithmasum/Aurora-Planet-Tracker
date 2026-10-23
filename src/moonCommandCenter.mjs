import {MOONS} from './moonCatalog.mjs';

/** Search curated moons by name, parent, mission, and descriptive science fields. */
export function searchMoonCommand(query, moons=MOONS){
 const q=String(query??'').trim().toLocaleLowerCase();
 if(!q)return [];
 const tokens=q.split(/\s+/).filter(Boolean);
 return moons.map((moon,index)=>{
  const name=String(moon.name??'').toLocaleLowerCase();
  const planet=String(moon.planet??'').toLocaleLowerCase();
  const missions=Array.isArray(moon.missions)?moon.missions.join(' ').toLocaleLowerCase():'';
  const haystack=[name,planet,moon.category,moon.science,moon.surface,moon.discovery,missions]
   .filter(value=>typeof value==='string').join(' ').toLocaleLowerCase();
  const score=tokens.reduce((sum,token)=>{
   if(name===token)return sum+12;
   if(name.startsWith(token))return sum+8;
   if(planet===token)return sum+5;
   if(missions.includes(token))return sum+3;
   return haystack.includes(token)?sum+1:sum-100;
  },0);
  return {moon,index,score};
 }).filter(item=>item.score>=tokens.length)
  .sort((a,b)=>b.score-a.score||a.index-b.index)
  .map(item=>item.moon);
}
