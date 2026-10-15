export const AXIAL_TILT={Mercury:0.034,Venus:177.36,Earth:23.44,Mars:25.19,Jupiter:3.13,Saturn:26.73,Uranus:97.77,Neptune:28.32};
export const SPIN_HOURS={Mercury:1407.6,Venus:-5832.5,Earth:23.934,Mars:24.623,Jupiter:9.925,Saturn:10.656,Uranus:-17.24,Neptune:16.11};
export const SEMIMAJOR_AU={Mercury:.387,Venus:.723,Earth:1,Mars:1.524,Jupiter:5.203,Saturn:9.58,Uranus:19.2,Neptune:30.05};
// Distance mode uses AU-proportional spacing but retains a readable size floor.
export function solarOrbitRadius(name,mode,illustrativeOrbit){
 const au=SEMIMAJOR_AU[name];
 if(mode==='distance'&&Number.isFinite(au))return 2.7+au*1.75;
 return illustrativeOrbit;
}
export function solarPlanetRadius(name,mode,illustrativeSize){
 const ratios={Mercury:.383,Venus:.949,Earth:1,Mars:.532,Jupiter:11.21,Saturn:9.45,Uranus:4.01,Neptune:3.88};
 if(mode==='distance')return Math.max(.18,Math.min(1.2,ratios[name]*.12));
 return illustrativeSize;
}
export function spinRate(name){const hours=SPIN_HOURS[name];return hours?24/hours*.17:0}
