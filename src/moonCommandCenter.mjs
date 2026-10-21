import {MOONS} from './moonCatalog.mjs';

/** Search the curated moon inventory without treating missing values as facts. */
export function searchMoonCommand(query, moons=MOONS){
 const q=String(query||'').trim().toLocaleLowerCase();
 if(!q)return [];
 const tokens=q.split(/\\s+/).filter(Boolean);
 return moons.map((moon,index)=>({moon,index,score:tokens.reduce((sum,token)=>{
  const name=moon.name.toLocaleLowerCase(),planet=moon.planet.toLocaleLowerCase();
  const missions=moon.missions.join(' ').toLocaleLowerCase();
  const haystack=[name,planet,moon.category,moon.science,moon.surface,moon.discovery,missions].join(' ').toLocaleLowerCase();
  if(name===token)return sum+12;
  if(name.startsWith(token))return sum+8;
  if(planet===token)return sum+5;
  if(missions.includes(token))return sum+3;
  return haystack.includes(token)?sum+1:sum-100;
 },0)}).filter(item=>item.score>=tokens.length).sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.moon);
}
