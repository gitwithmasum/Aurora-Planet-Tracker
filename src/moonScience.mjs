// Moonverse v5.1: JPL SSD planetary satellite physical parameters.
// Primary source https://ssd.jpl.nasa.gov/sats/phys_par/ (consulted 2026-10-21).
// Row: [JPL NAIF code, GM km^3/s^2 or null, mean density g/cm^3 or null,
//       GM sigma km^3/s^2 or null, density sigma g/cm^3 or null].
// A reported zero GM or inequality upper limit is NOT a measured mass.
// Values for small irregular moons may carry large fractional uncertainties.
export const PHYSICAL_SOURCE='https://ssd.jpl.nasa.gov/sats/phys_par/';
export const NASA_OCEAN_SOURCE='https://science.nasa.gov/solar-system/ocean-worlds/';
const ROWS={
 moon:[301,4902.800,3.344,.001,.001],
 phobos:[401,.0007087,1.872,.0000006,.076],
 deimos:[402,.0000962,1.471,.0000028,.166],
 io:[501,5959.91547,3.5276,.00135,.0029],
 europa:[502,3202.71210,3.0130,.00181,.0017],
 ganymede:[503,9887.83275,1.9416,.00247,.0038],
 callisto:[504,7179.28340,1.8340,.00324,.0034],
 amalthea:[505,.16456,1.0111,.00867,.1213],
 thebe:[514,.03015,.9000,.01250,.4327],
 adrastea:[515,.00014,.9018,.00020,1.8507],
 metis:[516,.00250,.9002,.00160,.7642],
 himalia:[506,.15155,.8827,.05763,.4580],
 mimas:[601,2.50349,1.1501,.00014,.0070],
 enceladus:[602,7.21037,1.6097,.00009,.0038],
 tethys:[603,41.21353,.9840,.00031,.0033],
 dione:[604,73.11607,1.4781,.00005,.0032],
 rhea:[605,153.94175,1.2372,.00041,.0029],
 titan:[606,8978.13710,1.8814,.00025,.0001],
 hyperion:[607,.37049,.5386,.00005,.0479],
 iapetus:[608,120.51511,1.0887,.00242,.0125],
 phoebe:[609,.55479,1.6428,.00108,.0326],
 janus:[610,.12662,.6381,.00007,.0172],
 epimetheus:[611,.03514,.6375,.00002,.0394],
 helene:[612,.00048,.2918,.00002,.0217],
 atlas:[615,.00037,.3850,.00001,.0613],
 prometheus:[616,.01071,.4784,.00001,.0400],
 pandora:[617,.00926,.4948,.00002,.0549],
 pan:[618,.00028,.3650,.00014,.2052],
 ariel:[701,83.5,1.539,1.4,.026],
 umbriel:[702,85.1,1.523,1.9,.041],
 titania:[703,226.9,1.653,4.1,.032],
 oberon:[704,205.3,1.664,5.8,.050],
 miranda:[705,4.3,1.178,.2,.053],
 // JPL orbital ID 715 is known; no GM/density in the physical-parameters table.
 puck:[715,null,null,null,null],
 triton:[801,1428.49546,2.0649,.61603,.0110],
 nereid:[802,null,null,null,null],
 naiad:[803,.00853,1.2511,.00480,1.0478],
 thalassa:[804,.02359,1.3184,.00522,.8432],
 despina:[805,.11673,1.0304,.25263,2.2689],
 galatea:[806,.18990,1.3777,.76278,5.5695],
 larissa:[807,.25484,1.0303,3.12230,12.626],
 proteus:[808,2.58342,1.0269,2.42070,.9695],
 charon:[901,106.1,1.853,.3,.004],
 nix:[902,.0015,.88,.0005,.31],
 hydra:[903,.0020,1.21,.0003,.19],
 kerberos:[904,null,null,null,null],
 styx:[905,null,null,null,null]
};
export const PHYSICAL_PARAMETERS=Object.freeze(Object.fromEntries(
 Object.entries(ROWS).map(([id,[naifCode,gmKm3S2,densityGcm3,gmSigma,densitySigma]])=>
 [id,Object.freeze({id,naifCode,gmKm3S2,densityGcm3,gmSigma,densitySigma,
  source:PHYSICAL_SOURCE,reviewed:'2026-10-21'})])));
const GRAVITATIONAL_CONSTANT=6.67430e-20; // km^3/(kg·s^2), CODATA
export function physicalParameters(moon){
 if(!moon||typeof moon.id!=='string')return null;
 const data=PHYSICAL_PARAMETERS[moon.id];
 if(!data)return null;
 const radiusKm=Number.isFinite(moon.radiusKm)&&moon.radiusKm>0?moon.radiusKm:null;
 const gm=Number.isFinite(data.gmKm3S2)&&data.gmKm3S2>0?data.gmKm3S2:null;
 const sigma=data.gmSigma;
 const gmUncertainty=gm!==null&&Number.isFinite(sigma)&&sigma>=0?sigma/gm:null;
 const gravityMS2=radiusKm!==null&&gm!==null?1000*gm/(radiusKm*radiusKm):null;
 const escapeVelocityMS=radiusKm!==null&&gm!==null?1000*Math.sqrt(2*gm/radiusKm):null;
 const massKg=gm!==null?gm/GRAVITATIONAL_CONSTANT:null;
 const densityGcm3=Number.isFinite(data.densityGcm3)&&data.densityGcm3>0?data.densityGcm3:null;
 const densityRelativeError=densityGcm3!==null&&Number.isFinite(data.densitySigma)?data.densitySigma/densityGcm3:null;
 return {...data,gmUncertainty,densityRelativeError,gravityMS2,escapeVelocityMS,massKg,
  isDerived:true,geometryAssumption:'spherical mean-radius approximation',
  quality:gm===null?'not available':gmUncertainty!==null&&gmUncertainty>.5?'very uncertain':gmUncertainty!==null&&gmUncertainty>.2?'uncertain':'estimated'};
}
export const SCIENCE_STATUS={
 moon:{environment:'No atmosphere; ancient volcanic plains and impact basins',interior:'Differentiated crust, mantle and small core; lunar seismic constraints',evidence:'observed',source:'https://science.nasa.gov/moon/facts/'},
 io:{environment:'Silicate volcanism powered by strong tidal heating',interior:'Rocky/silicate interior; internal structure constrained by magnetic/gravity data',evidence:'observed',source:'https://science.nasa.gov/jupiter/jupiter-moons/io/facts/'},
 europa:{environment:'Water-ice shell with strong evidence of a subsurface salty ocean; no confirmed life',interior:'Models indicate an iron-bearing core, silicate mantle, global briny ocean and ice shell',evidence:'strong evidence',source:'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/'},
 ganymede:{environment:'Intrinsic magnetosphere and an inferred subsurface saltwater ocean',interior:'Differentiated metallic core, rocky mantle and multi-layer ice/water envelope',evidence:'strong evidence',source:'https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/'},
 callisto:{environment:'Ancient cratered surface and possible underground ocean',interior:'Possible partial differentiation; buried ocean remains a model-based inference',evidence:'hypothesis',source:NASA_OCEAN_SOURCE},
 enceladus:{environment:'Observed south-polar water/ice jets fed by a subsurface ocean',interior:'Global liquid water ocean, rocky core and icy outer shell',evidence:'observed',source:'https://science.nasa.gov/mission/cassini/science/enceladus/'},
 titan:{environment:'Dense nitrogen atmosphere, methane/ethane surface lakes and subsurface water ocean',interior:'Models suggest ice layers and subsurface brine; detailed stratification uncertain',evidence:'observed',source:'https://science.nasa.gov/saturn/moons/titan/facts/'},
 triton:{environment:'Nitrogen frost, thin nitrogen atmosphere and observed active plumes',interior:'Frozen nitrogen surface over icy mantle; possible internal ocean not confirmed',evidence:'observed',source:'https://science.nasa.gov/neptune/moons/triton/'},
 charon:{environment:'Tectonic chasms and dark polar region observed by New Horizons',interior:'Rock-ice mixture; interior layering and ancient ocean hypotheses unsettled',evidence:'observed',source:'https://science.nasa.gov/dwarf-planets/pluto/moons/'}
};
export function moonScience(moon){
 if(!moon)return null;
 const physical=physicalParameters(moon);
 const status=SCIENCE_STATUS[moon.id]||null;
 return {physical,status,hasDeepResearch:!!status,hasGM:physical?.gmKm3S2!==null&&physical?.gmKm3S2!==undefined};
}
export function searchMoonScience(moons,{query='',category='all',sort='radius-desc',minRadius=0}={}){
 const text=String(query).trim().toLocaleLowerCase();
 const r=Number.isFinite(Number(minRadius))?Math.max(0,Number(minRadius)):0;
 const result=moons.filter(m=>{
  const phy=physicalParameters(m);
  return (category==='all'||m.category===category)&&m.radiusKm>=r&&
   (!text||[m.name,m.planet,m.category,m.science,m.surface,...m.missions,
    phy?.naifCode?String(phy.naifCode):''].join(' ').toLocaleLowerCase().includes(text));
 });
 const sorters={
  'radius-desc':(a,b)=>b.radiusKm-a.radiusKm,
  'radius-asc':(a,b)=>a.radiusKm-b.radiusKm,
  'orbit-asc':(a,b)=>a.orbitKm-b.orbitKm,
  'name-asc':(a,b)=>a.name.localeCompare(b.name),
  'gravity-desc':(a,b)=>(physicalParameters(b)?.gravityMS2??-1)-(physicalParameters(a)?.gravityMS2??-1)
 };
 return result.sort(sorters[sort]||sorters['radius-desc']);
}
export function moonComparison(rows){
 const unique=[...new Map(rows.filter(Boolean).map(m=>[m.id,m])).values()].slice(0,4);
 return unique.map(m=>({id:m.id,name:m.name,planet:m.planet,radiusKm:m.radiusKm,
  orbitKm:m.orbitKm,periodDays:Math.abs(m.periodDays),
  densityGcm3:physicalParameters(m)?.densityGcm3??null,
  gravityMS2:physicalParameters(m)?.gravityMS2??null,
  massKg:physicalParameters(m)?.massKg??null}));
}
