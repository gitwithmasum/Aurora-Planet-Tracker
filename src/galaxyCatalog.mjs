import * as Astronomy from 'astronomy-engine';
// Approximate J2000 ICRS catalog coordinates (RA hours, Dec degrees).
// Celestial directions are an observing aid, not real-time intergalactic physical movement.
export const GALAXIES=[
{id:'m31',name:'Andromeda Galaxy',other:'Messier 31',ra:0+42/60+44.3/3600,dec:41+16/60+9/3600,ly:2537000,type:'Spiral',constellation:'Andromeda',mag:3.44,color:'#95cfff',description:'The nearest large spiral galaxy to the Milky Way; visible as a faint haze under a dark sky.'},
{id:'m33',name:'Triangulum Galaxy',other:'Messier 33',ra:1+33/60+50.9/3600,dec:30+39/60+37/3600,ly:2730000,type:'Spiral',constellation:'Triangulum',mag:5.72,color:'#76ecde',description:'A face-on spiral in our Local Group, best seen from dark, clear skies.'},
{id:'m51',name:'Whirlpool Galaxy',other:'Messier 51',ra:13+29/60+52.7/3600,dec:47+11/60+43/3600,ly:23000000,type:'Spiral',constellation:'Canes Venatici',mag:8.4,color:'#a29eff',description:'A famous interacting spiral and companion; generally requires a telescope.'},
{id:'m104',name:'Sombrero Galaxy',other:'Messier 104',ra:12+39/60+59.4/3600,dec:-(11+37/60+23/3600),ly:31100000,type:'Spiral',constellation:'Virgo',mag:8.0,color:'#ffcb98',description:'An edge-on galaxy with a distinctive dust lane; telescope target.'},
{id:'m101',name:'Pinwheel Galaxy',other:'Messier 101',ra:14+3/60+12.6/3600,dec:54+20/60+57/3600,ly:21000000,type:'Spiral',constellation:'Ursa Major',mag:7.9,color:'#b5b4ff',description:'Large low-surface-brightness spiral; dark skies and optics recommended.'},
{id:'m64',name:'Black Eye Galaxy',other:'Messier 64',ra:12+56/60+43.7/3600,dec:21+40/60+58/3600,ly:17000000,type:'Spiral',constellation:'Coma Berenices',mag:8.5,color:'#d8b0ff',description:'A spiral featuring a dark dust band across its bright nucleus.'},
{id:'m81',name:"Bode's Galaxy",other:'Messier 81',ra:9+55/60+33.2/3600,dec:69+3/60+55/3600,ly:11800000,type:'Spiral',constellation:'Ursa Major',mag:6.94,color:'#90baff',description:'A bright spiral in the nearby M81 group.'},
{id:'m82',name:'Cigar Galaxy',other:'Messier 82',ra:9+55/60+52.7/3600,dec:69+40/60+46/3600,ly:12000000,type:'Starburst',constellation:'Ursa Major',mag:8.4,color:'#fc9cbe',description:'A compact starburst galaxy known for intense star formation.'},
{id:'lmc',name:'Large Magellanic Cloud',other:'LMC',ra:5+23/60+34/3600,dec:-(69+45/60+22/3600),ly:163000,type:'Irregular',constellation:'Dorado / Mensa',mag:.9,color:'#98e3ff',description:'Satellite galaxy of the Milky Way, prominent from southern latitudes.'},
{id:'smc',name:'Small Magellanic Cloud',other:'SMC',ra:0+52/60+44.8/3600,dec:-(72+49/60+43/3600),ly:200000,type:'Irregular',constellation:'Tucana',mag:2.7,color:'#9bdaca',description:'Nearby Milky Way satellite galaxy, primarily a southern-sky target.'}
];
export function galaxyHorizontal(galaxy,date,lat,lon){
 try{
  const obs=new Astronomy.Observer(lat,lon,0);
  const result=Astronomy.Horizon(date,obs,galaxy.ra,galaxy.dec,'normal');
  return {...galaxy,az:result.azimuth,alt:result.altitude,above:result.altitude>0};
 }catch{return {...galaxy,az:NaN,alt:NaN,above:false}}
}
export function compassDirection(az){if(!Number.isFinite(az))return '—';return ['N','NE','E','SE','S','SW','W','NW'][Math.round(((az%360)+360)%360/45)%8]}
export function skyProjection(az,alt,heading=0){
 const bearing=(az-heading)*Math.PI/180,r=165*(90-Math.min(90,Math.max(0,alt)))/90;
 return {x:210+r*Math.sin(bearing),y:210-r*Math.cos(bearing)};
}
export function millionLightYears(value){return value>=1000000?(value/1e6).toFixed(2)+' Mly':Math.round(value/1000)+' kly'}
