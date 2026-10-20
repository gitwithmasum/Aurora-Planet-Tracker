// Curated historical milestones, not a complete spacecraft encounter database.
// dates are ISO calendar dates, planned entries are explicitly marked.
export const MISSION_SOURCES=Object.freeze({
 nasa:'https://science.nasa.gov/solar-system/moons/',
 voyager:'https://science.nasa.gov/mission/voyager/',
 galileo:'https://science.nasa.gov/mission/galileo/',
 cassini:'https://science.nasa.gov/mission/cassini/',
 horizons:'https://science.nasa.gov/mission/new-horizons/',
 clipper:'https://science.nasa.gov/mission/europa-clipper/mission-timeline/',
});
const event=(date,mission,kind,title,detail,source,status='completed')=>({date,mission,kind,title,detail,source,status});
const EVENTS={
 moon:[
 event('1969-07-20','Apollo 11','landing','First crewed lunar landing','Neil Armstrong and Buzz Aldrin landed on the Moon.', 'https://science.nasa.gov/mission/apollo-11/'),
 event('2009-06-18','Lunar Reconnaissance Orbiter','orbiter','LRO launched','Long-term high-resolution lunar mapping began after lunar orbit insertion.', 'https://science.nasa.gov/mission/lro/'),
 event('2023-08-23','Chandrayaan-3','landing','South polar region landing','India achieved a soft landing near the lunar south pole.', 'https://www.isro.gov.in/Chandrayaan3.html')
 ],
 io:[event('1979-03-05','Voyager 1','discovery','Active volcanoes found','Voyager imagery revealed active volcanism on Io.',MISSION_SOURCES.voyager),event('1995-12-07','Galileo','orbiter','Jupiter orbit operations begin','Galileo studied Io and other large Jovian moons during its tour.',MISSION_SOURCES.galileo)],
 europa:[event('1979-07-09','Voyager 2','flyby','Fractured ice terrain','Voyager observations helped characterize Europa’s icy crust.',MISSION_SOURCES.voyager),event('1995-12-07','Galileo','orbiter','Galileo begins Jupiter tour','Repeated observations supported evidence for a subsurface ocean.',MISSION_SOURCES.galileo),event('2024-10-14','Europa Clipper','launch','Europa Clipper launched','Mission began its journey to investigate Europa’s habitability.',MISSION_SOURCES.clipper),event('2031-03-01','Europa Clipper','planned','First Europa flyby (spring 2031)','Approximate season marker; schedule may change. Not a completed flyby.',MISSION_SOURCES.clipper,'planned')],
 ganymede:[event('1979-07-09','Voyager 2','flyby','Detailed icy terrain imaging','Voyager examined grooved and cratered terrain.',MISSION_SOURCES.voyager),event('2021-06-07','Juno','flyby','Close Ganymede flyby','Juno made a close pass with imaging and other observations.','https://science.nasa.gov/mission/juno/')],
 callisto:[event('1979-07-09','Voyager 2','flyby','Ancient crater record','Voyager imagery documented Callisto’s densely cratered surface.',MISSION_SOURCES.voyager),event('1995-12-07','Galileo','orbiter','Galileo Jupiter tour','Galileo observations explored Callisto’s interior and possible ocean.',MISSION_SOURCES.galileo)],
 enceladus:[event('2005-07-14','Cassini','discovery','Active south-polar plumes','Cassini observations revealed jets of ice-rich material.',MISSION_SOURCES.cassini),event('2015-10-28','Cassini','flyby','Plume sampling pass','Cassini passed through the plume to sample its material.',MISSION_SOURCES.cassini)],
 titan:[event('2005-01-14','Huygens','landing','First landing in outer solar system','ESA Huygens probe descended through Titan’s atmosphere and reached its surface.','https://science.nasa.gov/mission/huygens/'),event('2004-07-01','Cassini','orbiter','Saturn system tour begins','Cassini made repeated observations and flybys of Titan.',MISSION_SOURCES.cassini)],
 mimas:[event('1980-11-12','Voyager 1','flyby','Herschel crater imaged','Voyager provided detailed views of this impact-scarred moon.',MISSION_SOURCES.voyager)],
 iapetus:[event('2007-09-10','Cassini','flyby','Iapetus close study','Cassini closely examined its bright/dark hemispheres and equatorial ridge.',MISSION_SOURCES.cassini)],
 phoebe:[event('2004-06-11','Cassini','flyby','Phoebe close encounter','Cassini photographed Phoebe shortly before Saturn orbit insertion.',MISSION_SOURCES.cassini)],
 miranda:[event('1986-01-24','Voyager 2','flyby','Miranda terrain revealed','Voyager 2 observed distinctive coronae and faulted landscapes.',MISSION_SOURCES.voyager)],
 ariel:[event('1986-01-24','Voyager 2','flyby','Uranian moon survey','Voyager 2 imaged Ariel’s tectonic valleys and resurfaced terrain.',MISSION_SOURCES.voyager)],
 titania:[event('1986-01-24','Voyager 2','flyby','Uranian moon survey','Voyager 2 returned imagery of Titania’s canyons and craters.',MISSION_SOURCES.voyager)],
 oberon:[event('1986-01-24','Voyager 2','flyby','Uranian moon survey','Voyager 2 recorded Oberon’s cratered surface.',MISSION_SOURCES.voyager)],
 umbriel:[event('1986-01-24','Voyager 2','flyby','Uranian moon survey','Voyager 2 recorded Umbriel’s dark cratered terrain.',MISSION_SOURCES.voyager)],
 triton:[event('1989-08-25','Voyager 2','flyby','Triton close flyby','Voyager 2 observed active plume-like features and frozen terrain.',MISSION_SOURCES.voyager)],
 charon:[event('2015-07-14','New Horizons','flyby','Pluto–Charon flyby','New Horizons mapped Charon’s canyons and dark polar terrain.',MISSION_SOURCES.horizons)],
 nix:[event('2015-07-14','New Horizons','flyby','Small moon imaging','New Horizons observed Nix during the Pluto system encounter.',MISSION_SOURCES.horizons)],
 hydra:[event('2015-07-14','New Horizons','flyby','Small moon imaging','New Horizons observed Hydra during the Pluto system encounter.',MISSION_SOURCES.horizons)]
};
export function missionArchiveFor(moon){
 if(!moon)return[];
 return (EVENTS[moon.id]||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
}
export function missionArchiveSummary(){return {moons:Object.keys(EVENTS).length,events:Object.values(EVENTS).reduce((n,v)=>n+v.length,0)}}
