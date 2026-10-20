// v5.0 Moonverse — carefully curated MAJOR natural satellites, not a complete
// survey of all 461 recognized planetary satellites (NASA/JPL, Oct 2026).
// Approximate rounded values are for education, never live ephemerides.
// Null represents unknown/unverified values; do NOT manufacture measurements.
// Sources: https://science.nasa.gov/solar-system/moons/facts/
// https://ssd.jpl.nasa.gov/sats/phys_par/
// https://ssd.jpl.nasa.gov/sats/elem/
export const MOON_SOURCE={
 nasa:'https://science.nasa.gov/solar-system/moons/facts/',
 jpl:'https://ssd.jpl.nasa.gov/sats/phys_par/',
 orbits:'https://ssd.jpl.nasa.gov/sats/elem/'
};
export const MOON_PLANETS=[
 {name:'Mercury',kind:'Planet',color:'#ada9a4',radiusKm:2440,hasKnownMoons:false},
 {name:'Venus',kind:'Planet',color:'#e4bc8b',radiusKm:6052,hasKnownMoons:false},
 {name:'Earth',kind:'Planet',color:'#4a9ed5',radiusKm:6371,hasKnownMoons:true},
 {name:'Mars',kind:'Planet',color:'#cc704d',radiusKm:3390,hasKnownMoons:true},
 {name:'Jupiter',kind:'Planet',color:'#d6ad8d',radiusKm:69911,hasKnownMoons:true},
 {name:'Saturn',kind:'Planet',color:'#d6c49e',radiusKm:58232,hasKnownMoons:true},
 {name:'Uranus',kind:'Planet',color:'#8bd7de',radiusKm:25362,hasKnownMoons:true},
 {name:'Neptune',kind:'Planet',color:'#4b7bcf',radiusKm:24622,hasKnownMoons:true},
 {name:'Pluto',kind:'Dwarf planet',color:'#c0a999',radiusKm:1188,hasKnownMoons:true}
];
// Record layout: [id, parent, name, mean radius km, mean semi-major orbital
// distance km, sidereal period Earth days, approximate eccentricity,
// discovery (year / historic), simplified class, defining fact, mission(s),
// surface description]. Some small moons have irregular or retrograde paths;
// v5.0 ellipse positions remain illustrative even for these cases.
const ROWS=[
 ['moon','Earth','Moon',1737.4,384400,27.322,.055,'Prehistoric','rocky','Tidally locked world with vast basaltic maria and impact highlands','Apollo;Lunar Reconnaissance Orbiter;Artemis','Cratered silicate crust and dark lava plains'],
 ['phobos','Mars','Phobos',11.27,9376,0.319,.015,'1877 · Asaph Hall','rocky','Orbit is decaying; a possible future ring or impact','Mars Express;Mars Reconnaissance Orbiter','Irregular body with Stickney crater'],
 ['deimos','Mars','Deimos',6.2,23463,1.263,.0003,'1877 · Asaph Hall','rocky','Small outer Martian moon with a dust-covered regolith','Mars Express','Small smooth-appearing, heavily cratered body'],
 ['io','Jupiter','Io',1821.6,421700,1.769,.004,'1610 · Galileo Galilei','volcanic','Most volcanically active world known in the Solar System','Voyager;Galileo;Juno','Sulfur-rich deposits, lava lakes and active plumes'],
 ['europa','Jupiter','Europa',1560.8,671100,3.551,.009,'1610 · Galileo Galilei','ocean candidate','Strong evidence of a salty subsurface ocean; not evidence of life','Voyager;Galileo;Juno;Europa Clipper','Fractured water-ice shell and lineae'],
 ['ganymede','Jupiter','Ganymede',2634.1,1070400,7.155,.001,'1610 · Galileo Galilei','icy','Largest moon, with its own intrinsic magnetic field','Galileo;Juno;JUICE','Dark cratered areas and bright grooved terrains'],
 ['callisto','Jupiter','Callisto',2410.3,1882700,16.689,.007,'1610 · Galileo Galilei','icy','Ancient heavily cratered surface; possible buried ocean','Voyager;Galileo;JUICE','Deeply cratered ice-rock mixture'],
 ['amalthea','Jupiter','Amalthea',83.5,181400,.498,.003,'1892 · E. E. Barnard','irregular','Small reddish inner moon orbiting close to Jupiter','Voyager;Galileo','Irregular elongated rocky surface'],
 ['himalia','Jupiter','Himalia',85,11461000,250.56,.162,'1904 · C. D. Perrine','irregular','Outer irregular satellite with inclined orbit','Earth-based surveys','Dark low-reflectance small moon'],
 ['metis','Jupiter','Metis',21.5,128000,.295,.0002,'1979 · Voyager 1','irregular','One of Jupiter’s innermost moons near the main ring','Voyager','Small irregular inner satellite'],
 ['adrastea','Jupiter','Adrastea',8.2,129000,.298,.001,'1979 · Voyager 2','irregular','Inner ring-associated moon','Voyager','Small irregular satellite'],
 ['mimas','Saturn','Mimas',198.2,185540,.942,.020,'1789 · William Herschel','icy','Herschel crater dominates one hemisphere','Voyager;Cassini','Heavily cratered icy surface'],
 ['enceladus','Saturn','Enceladus',252.1,238040,1.370,.005,'1789 · William Herschel','ocean','Global subsurface ocean and water-ice plumes','Cassini','Bright icy terrain with south-polar tiger stripes'],
 ['tethys','Saturn','Tethys',531.1,294670,1.888,.0001,'1684 · Giovanni Cassini','icy','Odysseus impact crater and Ithaca Chasma canyon','Cassini','Bright cratered ice-rich landscape'],
 ['dione','Saturn','Dione',561.4,377400,2.737,.002,'1684 · Giovanni Cassini','icy','Icy moon with bright cliffs and wispy fractures','Cassini','Cratered terrain and tectonic troughs'],
 ['rhea','Saturn','Rhea',763.8,527100,4.518,.001,'1672 · Giovanni Cassini','icy','Saturn’s second-largest moon, heavily cratered','Cassini','Bright ice with numerous craters'],
 ['titan','Saturn','Titan',2574.7,1221870,15.945,.029,'1655 · Christiaan Huygens','atmosphere','Dense nitrogen atmosphere, hydrocarbon lakes and buried ocean','Cassini-Huygens;Dragonfly','Methane lakes, dunes and river channels'],
 ['hyperion','Saturn','Hyperion',135,1481000,21.277,.104,'1848 · Bond and Lassell','irregular','Porous-looking, irregular moon with chaotic rotation','Cassini','Sponge-like cratered landscape'],
 ['iapetus','Saturn','Iapetus',734.5,3560800,79.321,.028,'1671 · Giovanni Cassini','icy','Dramatic two-tone surface and equatorial ridge','Cassini','Bright and dark hemispheres'],
 ['phoebe','Saturn','Phoebe',106.5,12952000,-550.3,.163,'1899 · William Pickering','retrograde','Dark irregular retrograde satellite','Cassini','Dark rocky and icy cratered terrain'],
 ['miranda','Uranus','Miranda',235.8,129900,1.413,.001,'1948 · Gerard Kuiper','icy','Exceptional tectonic cliffs and patchwork terrain','Voyager 2','Coronae and dramatic scarps'],
 ['ariel','Uranus','Ariel',578.9,191020,2.520,.001,'1851 · William Lassell','icy','Fault valleys and resurfaced bright terrain','Voyager 2','Grooves, rifts and impact scars'],
 ['umbriel','Uranus','Umbriel',584.7,266300,4.144,.004,'1851 · William Lassell','icy','Dark cratered Uranian moon','Voyager 2','Dark ancient ice-rich surface'],
 ['titania','Uranus','Titania',788.9,435910,8.706,.001,'1787 · William Herschel','icy','Largest Uranian moon, with canyons and faults','Voyager 2','Large rift valleys and cratered plains'],
 ['oberon','Uranus','Oberon',761.4,583520,13.463,.001,'1787 · William Herschel','icy','Outer major moon with ancient cratered surface','Voyager 2','Heavily cratered rocky ice surface'],
 ['puck','Uranus','Puck',81,86000,.762,.0001,'1985 · Voyager 2','irregular','Small inner moon discovered in Voyager imagery','Voyager 2','Dark cratered small body'],
 ['triton','Neptune','Triton',1353.4,354760,-5.877,.00002,'1846 · William Lassell','retrograde','Retrograde orbit and active nitrogen geyser-like plumes','Voyager 2','Frozen nitrogen terrain and cryovolcanic features'],
 ['nereid','Neptune','Nereid',170,5513818,360.14,.751,'1949 · Gerard Kuiper','irregular','Very eccentric distant Neptune orbit','Voyager 2','Distant irregular icy world'],
 ['proteus','Neptune','Proteus',210,117650,1.122,.0005,'1989 · Voyager 2','irregular','Large irregular inner moon','Voyager 2','Dark heavily cratered irregular surface'],
 ['larissa','Neptune','Larissa',97,73550,.555,.001,'1981 · stellar occultation','irregular','Small dark inner moon','Voyager 2','Dark cratered terrain'],
 ['galatea','Neptune','Galatea',88,62000,.429,.0002,'1989 · Voyager 2','irregular','Nearby shepherd satellite interacting with Neptune ring arcs','Voyager 2','Small irregular icy body'],
 ['charon','Pluto','Charon',606,19596,6.387,.0002,'1978 · James Christy','icy','Tidally locked binary-like Pluto–Charon system','New Horizons','Dark north polar cap, huge tectonic chasms'],
 ['nix','Pluto','Nix',20,48694,24.855,.002,'2005 · Hubble Space Telescope','irregular','Small irregular Pluto moon with chaotic rotation','New Horizons','Bright icy surface and impact crater'],
 ['hydra','Pluto','Hydra',25.5,64738,38.202,.005,'2005 · Hubble Space Telescope','irregular','Outermost named moon of Pluto','New Horizons','Irregular bright icy body'],
 ['kerberos','Pluto','Kerberos',6,57783,32.167,.003,'2011 · Hubble Space Telescope','irregular','Tiny irregular Pluto-system satellite','New Horizons','Bilobed/irregular small body'],
 ['styx','Pluto','Styx',5.2,42656,20.162,.005,'2012 · Hubble Space Telescope','irregular','Small inner member of Pluto’s satellite family','New Horizons','Small irregular ice-rich body']
];
const toMoon=([id,planet,name,radiusKm,orbitKm,periodDays,eccentricity,discovery,category,science,missions,surface])=>Object.freeze({
 id,planet,name,radiusKm,orbitKm,periodDays,eccentricity,discovery,category,science,surface,
 missions:missions.split(';'),source:MOON_SOURCE.nasa,
 dataSource:MOON_SOURCE.jpl,orbitSource:MOON_SOURCE.orbits,
 confidence:'approximate rounded values; not live ephemerides',
 simulated:true
});
export const MOONS=Object.freeze(ROWS.map(toMoon));
export function moonsForPlanet(planet){return MOONS.filter(m=>m.planet===planet)}
export function moonById(id){return MOONS.find(m=>m.id===id)||null}
export function moonPlanet(planet){return MOON_PLANETS.find(p=>p.name===planet)||null}
export function moonCatalogSummary(){
 return {curated:MOONS.length,systems:MOON_PLANETS.filter(p=>p.hasKnownMoons).length,
  planetSystems:MOON_PLANETS.filter(p=>p.kind==='Planet'&&p.hasKnownMoons).length,
  complete:false,lastReviewed:'2026-10-20',scope:'Named major/selected moons only'};
}
export function moonValid(row){
 return !!row&&typeof row.name==='string'&&row.name.length>0&&
 Number.isFinite(row.radiusKm)&&row.radiusKm>0&&Number.isFinite(row.orbitKm)&&row.orbitKm>0&&
 Number.isFinite(row.periodDays)&&Math.abs(row.periodDays)>0&&
 Number.isFinite(row.eccentricity)&&row.eccentricity>=0&&row.eccentricity<1&&
 MOON_PLANETS.some(p=>p.name===row.planet);
}
