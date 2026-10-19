// v3.9 Universal Space Search — pure deterministic search, no browser/network APIs.
export const SPACE_MODULES=[
 {name:'Dashboard',terms:'home mission overview'},
 {name:'Command Center',terms:'3d simulation orbit mission control'},
 {name:'Solar System',terms:'planet 3d orbit sun'},
 {name:'Planet Intelligence',terms:'planet facts distance elevation'},
 {name:'Sky Tonight',terms:'night sky visibility observation'},
 {name:'Satellite Tracker',terms:'iss tiangong hubble noaa starlink norad tle pass predictor'},
 {name:'Earth Observation',terms:'earth nasa imagery weather maps cloud climate'},
 {name:'Sky Tracker',terms:'360 sky star positions constellation'},
 {name:'AR Scanner',terms:'augmented reality camera compass planet'},
 {name:'Galaxy Observatory',terms:'andromeda galaxy messier deep space'},
 {name:'Space Intelligence',terms:'research scientific sGP4 tle freshness science sky observer inclination eccentricity orbit analysis'}
];

const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g,' ');
const words=value=>normalize(value).split(' ').filter(Boolean);
const makeItem=(type,id,title,description,terms)=>({
 id:type+':'+id,type,target:id,title,description,terms:normalize([title,description,terms].join(' '))
});
export function buildSpaceIndex({planets=[],galaxies=[],satellites=[]}={}){
 const modules=SPACE_MODULES.map(m=>makeItem('module',m.name,m.name,'Open '+m.name,m.terms));
 const worlds=planets.map(p=>makeItem('planet',p.name,p.name,p.description||'Solar System planet',`planet ${p.type||''} ${p.name==='Earth'?'world blue marble':''}`));
 const deepSky=galaxies.map(g=>makeItem('galaxy',g.id,g.name,g.other||g.constellation||'Galaxy',`galaxy deep space messier ${g.other||''} ${g.constellation||''} ${g.id}`));
 // Only validated, loaded orbital catalog rows should be passed as satellites.
 const spacecraft=satellites.map(s=>makeItem('satellite',s.id,s.name,`${s.category||'Satellite'} · NORAD ${s.noradId}`,`satellite ${s.category||''} ${s.noradId} ${s.id} ${s.id==='iss'?'international space station':''}`));
 return [...worlds,...spacecraft,...deepSky,...modules];
}
function rank(item,query,tokens){
 const title=normalize(item.title),id=normalize(item.target),term=item.terms;
 if(title===query||id===query)return 0;
 if(title.startsWith(query))return 1;
 if(title.includes(query))return 2;
 if(id.includes(query))return 3;
 if(term.includes(query))return 4;
 if(tokens.every(t=>term.includes(t)))return 5;
 return Infinity;
}
export function searchSpace(index,rawQuery,{limit=12,type='all'}={}){
 const query=normalize(rawQuery).slice(0,80);
 if(!query)return [];
 const tokens=words(query);
 const safeLimit=Math.max(1,Math.min(50,Number.isFinite(limit)?Math.floor(limit):12));
 return index
  .filter(item=>type==='all'||item.type===type)
  .map(item=>({item,score:rank(item,query,tokens)}))
  .filter(x=>Number.isFinite(x.score))
  .sort((a,b)=>a.score-b.score||a.item.title.localeCompare(b.item.title)||a.item.id.localeCompare(b.item.id))
  .slice(0,safeLimit)
  .map(x=>x.item);
}
