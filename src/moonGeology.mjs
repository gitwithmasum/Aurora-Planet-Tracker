// Moonverse v5.3 — NASA sourced named geological features and QUALITATIVE
// interior schematics. NO feature without independently sourced coordinates
// is presented as a geolocated map pin. Layer widths are NOT measured depths.
// Evidence codes: observed = instrument/photo, inferred = strong interpretation,
// hypothetical = possible scenario, never confirmed as a detection.
export const SURFACE_EVIDENCE=Object.freeze(['observed','inferred','hypothetical']);
const FEATURE=(id,name,kind,description,source,evidence='observed',nasaId=null,coords=null)=>
 Object.freeze({id,name,kind,description,source,evidence,nasaId,coords});
const LAYER=(id,name,material,description,evidence,color)=>
 Object.freeze({id,name,material,description,evidence,color});
const GEOLOGY={
 europa:{
  label:'Fractured ocean-world ice',ocean:'strong-evidence',
  features:[
   FEATURE('conamara','Conamara Chaos','chaos terrain','Broken ice plates displaced and rotated within younger, disrupted terrain; the process may involve warm ice or water.','https://science.nasa.gov/photojournal/pj-chaotic-terrain-on-europa-in-very-high-resolution/','observed','PIA01177',{latitudeN:8,longitudeW:274,approximate:true}),
   FEATURE('europa-ridges','Ridges and fracture bands','ice tectonics','Widespread cracks and bands record stretching, compression and tidal stresses in the ice crust.','https://science.nasa.gov/science-research/landscapes-and-features-of-europa/'),
   FEATURE('europa-ice','Ice shell thickness','interior uncertainty','Europa’s ice-shell thickness remains debated; surface terrain cannot uniquely determine a layer thickness.','https://science.nasa.gov/science-research/thick-or-thin-ice-shell-on-europa/','inferred')
  ],
  layers:[
   LAYER('shell','Water-ice shell','H₂O ice','Icy surface measured; shell thickness and basal heat flow are not uniquely known.','observed','#e3f4fb'),
   LAYER('ocean','Proposed salty ocean','Saline liquid water','Strong magnetometer and geological evidence; ocean not directly visited.','inferred','#278cb8'),
   LAYER('mantle','Silicate mantle','Rock','Interior differentiation inferred from density and geophysical models.','inferred','#a98063'),
   LAYER('core','Metallic core model','Iron-rich material','Possible central core; detailed structure is model-dependent.','hypothetical','#dca66f')
  ],note:'Liquid water is strongly supported; no detected life and no direct sample of the ocean.'
 },
 enceladus:{
  label:'South-polar plume world',ocean:'strong-evidence',
  features:[
   FEATURE('tiger-stripes','Tiger stripes','active fractures','Four prominent south-polar fractures — Alexandria, Cairo, Baghdad and Damascus — emit water-ice and vapor plumes.','https://science.nasa.gov/photojournal/bursting-at-the-seams-the-geyser-basin-of-enceladus/','observed','PIA11688'),
   FEATURE('enceladus-plumes','Cassini plume jets','cryovolcanic jets','Cassini imaged south-polar jets and sampled escaping material, providing major evidence of subsurface liquid water.','https://science.nasa.gov/missions/cassini/cassini-at-enceladus-a-decade-plus-of-discovery/'),
   FEATURE('enceladus-vents','Hydrothermal activity','ocean floor model','Cassini chemistry supports interactions between ocean water and rocky seafloor, potentially including hydrothermal processes.','https://science.nasa.gov/mission/cassini/science/enceladus/','inferred')
  ],
  layers:[
   LAYER('shell','Icy exterior','Water ice','Surface fractures and jets are observed; ice thickness varies by region.','observed','#e5f5fa'),
   LAYER('ocean','Global liquid-water ocean','Saline liquid water','Geophysical and plume evidence support liquid water beneath the ice.','inferred','#2a98be'),
   LAYER('core','Rocky interior','Silicates / rock','Rocky core and ocean–rock interactions inferred from gravity and plume chemistry.','inferred','#ac7d64')
  ],note:'Plumes are observed; the seafloor and ocean are not photographed directly.'
 },
 titan:{
  label:'Methane seas and thick haze',ocean:'inferred',
  features:[
   FEATURE('kraken','Kraken Mare','hydrocarbon sea','Titan’s largest northern sea mapped by Cassini radar; predominantly methane and ethane, not liquid water.','https://science.nasa.gov/resource/titans-north-annotated-with-text/','observed','PIA17655'),
   FEATURE('ligeia','Ligeia Mare','hydrocarbon sea','Second large northern sea imaged with radar; one of several surface hydrocarbon reservoirs.','https://science.nasa.gov/resource/flying-over-an-extraterrestrial-land-of-lakes/','observed','PIA17656'),
   FEATURE('titan-haze','Nitrogen-rich atmosphere','atmosphere','Dense haze blocks straightforward optical surface imaging; Cassini mapped terrain using radar.','https://science.nasa.gov/saturn/moons/titan/facts/')
  ],
  layers:[
   LAYER('atmosphere','Dense atmospheric envelope','Nitrogen / hydrocarbons','Nitrogen-rich atmosphere confirmed by spacecraft observations.','observed','#d7a760'),
   LAYER('ice','Water-ice crust','Water ice','Ice-rich solid surface beneath hydrocarbon reservoirs.','inferred','#e2eef3'),
   LAYER('ocean','Possible deep liquid ocean','Water–ammonia mixture','Evidence favors a deep subsurface ocean; composition and layers are uncertain.','inferred','#247da5'),
   LAYER('core','Mixed rocky/icy deep interior','Rock and ice','Internal mixing/differentiation models vary.','hypothetical','#a57964')
  ],note:'Surface methane/ethane seas are observed; they are not a subsurface water ocean.'
 },
 io:{
  label:'Active silicate volcanism',ocean:'none-detected',
  features:[
   FEATURE('chors','Chors Patera','lava lake','Juno JIRAM observed a volcanic lava lake in infrared, not an ordinary visible-light photograph.','https://science.nasa.gov/photojournal/juno-captures-lava-lake-chors-patera-on-io/','observed','PIA26371'),
   FEATURE('loki','Loki Patera','lava lake / patera','Large volcanic depression with smooth reflective surfaces; NASA’s visual flyover is an artist concept based on observations.','https://science.nasa.gov/photojournal/looking-into-ios-loki-patera-artists-concept/','observed','PIA26293'),
   FEATURE('pele','Pele volcano','volcanism','Hubble and Voyager observations identify volcanic deposits and emissions from Pele.','https://science.nasa.gov/asset/hubble/volcanoes-on-io/')
  ],
  layers:[
   LAYER('surface','Sulfur-rich volcanic crust','Silicate rock, sulfur','Volcanoes and extensive surface deposits are observed.','observed','#edbd60'),
   LAYER('mantle','Hot silicate mantle','Silicate rock','Tidal heating powers extraordinary volcanism.','inferred','#d16e42'),
   LAYER('core','Metal-rich central region','Iron-bearing material','Core structure inferred from gravity/magnetic studies.','inferred','#8c554a')
  ],note:'Io is not an observed subsurface ocean world; persistent magma and volcanism are distinct from liquid-water habitability.'
 },
 ganymede:{
  label:'Grooved ice and magnetic field',ocean:'strong-evidence',
  features:[
   FEATURE('nippur','Nippur Sulcus','grooved terrain','Parallel ridges and troughs imaged by Galileo demonstrate large-scale icy deformation.','https://science.nasa.gov/photojournal/grooves-and-craters-on-ganymede/','observed','PIA01059'),
   FEATURE('erech','Erech Sulcus','grooved terrain','Prominent band of bright grooves crossing dark Marius Regio.','https://science.nasa.gov/photojournal/swaths-of-grooved-terrain-on-ganymede/','observed','PIA01615'),
   FEATURE('galileo-regio','Galileo Regio','ancient dark terrain','Heavily cratered ancient terrain contrasting with younger grooved surfaces.','https://science.nasa.gov/photojournal/high-latitude-bright-and-dark-terrains-on-ganymede/')
  ],
  layers:[
   LAYER('ice','Ice-rich crust','Water ice','Distinct grooved and cratered ice terrains have been directly observed.','observed','#d9edf7'),
   LAYER('stack','Possible ocean–ice layers','Liquid brine / high-pressure ice','Multiple ocean/ice layers appear in models; boundaries are not directly measured.','inferred','#3086b5'),
   LAYER('mantle','Silicate mantle','Rock','Differentiation inferred from gravity and magnetic constraints.','inferred','#ae876b'),
   LAYER('core','Metal core','Iron-bearing metal','Intrinsic magnetic field supports a conducting core.','inferred','#bb8058')
  ],note:'The internal ocean has strong evidence, but the proposed multi-layer stack is model-dependent.'
 },
 triton:{
  label:'Nitrogen frost and exotic ice',ocean:'hypothetical',
  features:[
   FEATURE('cantaloupe','Cantaloupe terrain','ice tectonics','Unusual cellular landscape seen by Voyager 2; proposed formation involves ice-shell overturn.','https://science.nasa.gov/resource/tritons-cantaloupe-terrain/','observed','PIA12186'),
   FEATURE('triton-plumes','Active dark plumes','cryovolcanism / jets','Voyager 2 detected dark geyser-like jets rising over frozen terrain.','https://science.nasa.gov/neptune/moons/triton/')
  ],
  layers:[
   LAYER('frost','Nitrogen-frost surface','Nitrogen and water ice','Nitrogen-frost terrains and a tenuous nitrogen atmosphere are observed.','observed','#d7e6f8'),
   LAYER('ice','Icy shell','Water ice','Shell structure and thermal state remain model-dependent.','inferred','#9ab3d7'),
   LAYER('possible-ocean','Possible subsurface liquid','Water / ammonia brine','Ocean is a hypothesis, not a detected liquid layer.','hypothetical','#337fbb'),
   LAYER('core','Rock-ice interior','Rock and ice','Bulk composition inferred from density and origin scenarios.','inferred','#b68a7c')
  ],note:'A liquid-water ocean has not been confirmed on Triton.'
 },
 charon:{
  label:'Frozen faults and canyons',ocean:'hypothetical',
  features:[
   FEATURE('serenity','Serenity Chasma','tectonic canyon','Deep canyon imaged during the New Horizons Pluto–Charon flyby.','https://science.nasa.gov/resource/flyover-pluto-moon-charon/','observed','PIA21864'),
   FEATURE('vulcan','Vulcan Planum','equatorial plains','Relatively smooth plains and surrounding mountain structures; names were originally used informally.','https://science.nasa.gov/photojournal/soaring-over-charon/'),
   FEATURE('mordor','Mordor Macula','dark polar terrain','Dark polar region on Charon recorded in New Horizons imaging.','https://science.nasa.gov/resource/flyover-pluto-moon-charon/')
  ],
  layers:[
   LAYER('crust','Fractured icy exterior','Water ice','Canyons and plains photographed by New Horizons.','observed','#e1e6f5'),
   LAYER('ice','Icy interior','Ice and rock','Interior ice-rock distribution not directly determined.','inferred','#a5b7d1'),
   LAYER('ancient-ocean','Possible ancient ocean','Potential past liquid layer','Ancient ocean explanation remains speculative, NOT a present confirmed ocean.','hypothetical','#39769b'),
   LAYER('core','Rocky interior','Rock','Interior rocky fraction inferred from bulk measurements.','inferred','#986d60')
  ],note:'No present-day liquid ocean on Charon has been confirmed.'
 },
 moon:{
  label:'Lunar maria and impacts',ocean:'none-detected',
  features:[
   FEATURE('tranquility','Mare Tranquillitatis','basaltic mare','Ancient lava-flooded impact basin and Apollo 11 landing region — not a liquid sea.','https://science.nasa.gov/solar-system/moon/history-of-lunar-exploration/'),
   FEATURE('tycho','Tycho crater','impact crater','Prominent young ray crater with preserved impact-melt features.','https://science.nasa.gov/resource/tycho-crater-on-the-moon-labeled/'),
   FEATURE('mare-imbrium','Mare Imbrium','basaltic mare','Dark impact basin flooded by ancient lava, visible from Earth.','https://science.nasa.gov/moon/facts/')
  ],
  layers:[
   LAYER('crust','Regolith & silicate crust','Basalt / anorthosite','Apollo samples and surface imaging directly constrain the crust.','observed','#d7d3c6'),
   LAYER('mantle','Silicate mantle','Rock','Seismic and gravity measurements support mantle differentiation.','inferred','#ad9878'),
   LAYER('core','Small iron-bearing core','Iron-rich material','Lunar interior inferred from seismic, rotational and gravity studies.','inferred','#916457')
  ],note:'Lunar maria are solid lava plains, not oceans; present-day global subsurface water ocean not detected.'
 },
 phobos:{
  label:'Mars moon impact history',ocean:'none-detected',
  features:[
   FEATURE('stickney','Stickney crater','impact crater','Largest prominent crater on Phobos, photographed by Mars Reconnaissance Orbiter.','https://science.nasa.gov/image-article/apod-2018-may-5-stickney-crater/'),
   FEATURE('phobos-grooves','Linear grooves','surface lineations','Phobos has unexplained linear grooves; origins remain contested.','https://science.nasa.gov/mars/moons/phobos/','observed')
  ],
  layers:[
   LAYER('regolith','Dusty regolith','Fine rock debris','Craters and surface regolith are observed.','observed','#aaa19a'),
   LAYER('interior','Poorly constrained interior','Rock / rubble','Porosity and internal distribution are uncertain; homogeneous shells are illustrative only.','hypothetical','#77746e')
  ],note:'Phobos interior is not resolved into measured concentric layers.'
 }
};
export const MOON_GEOLOGY=Object.freeze(Object.fromEntries(Object.entries(GEOLOGY).map(([id,value])=>[id,Object.freeze({
 ...value,features:Object.freeze(value.features),layers:Object.freeze(value.layers)})])));
export function geologyForMoon(id){return typeof id==='string'?MOON_GEOLOGY[id]||null:null}
export function featuresForMoon(id){return geologyForMoon(id)?.features||[]}
export function interiorLayers(id){return geologyForMoon(id)?.layers||[]}
export function surfaceFeatureById(moonId,featureId){return featuresForMoon(moonId).find(x=>x.id===featureId)||null}
export function geologySummary(){
 return {researchedMoons:Object.keys(MOON_GEOLOGY).length,
  documentedFeatures:Object.values(MOON_GEOLOGY).reduce((sum,m)=>sum+m.features.length,0),
  schematic:true,depthScale:'not-to-scale',
  coverage:'selected NASA-documented moons; not all curated Moonverse bodies'};
}
export function validGeologyCatalog(){
 const errors=[];
 for(const [id,data] of Object.entries(MOON_GEOLOGY)){
  if(!data.features.length||!data.layers.length)errors.push(id+': empty profile');
  const ids=new Set();
  for(const feature of data.features){
   if(ids.has(feature.id))errors.push(id+': duplicate '+feature.id);
   ids.add(feature.id);
   if(!SURFACE_EVIDENCE.includes(feature.evidence)||!/^https:\/\/science\.nasa\.gov\//.test(feature.source))errors.push(id+': unverified '+feature.id);
   if(feature.nasaId&&!/^PIA\d{5}$/.test(feature.nasaId))errors.push(id+': malformed NASA image ID');
  }
  for(const layer of data.layers){
   if(!SURFACE_EVIDENCE.includes(layer.evidence)||!/^#[0-9a-f]{6}$/i.test(layer.color))errors.push(id+': invalid interior layer');
  }
 }
 return {valid:errors.length===0,errors};
}
