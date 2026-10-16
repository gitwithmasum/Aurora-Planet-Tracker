export function timelineDates(snapshots){
 return [...new Set(snapshots.map(x=>x.date))].sort((a,b)=>a.localeCompare(b));
}
export function comparisonPair(snapshots,before,after){
 const dates=timelineDates(snapshots);
 if(dates.length<2)return null;
 const older=dates.includes(before)?before:dates[0];
 const newer=dates.includes(after)?after:dates[dates.length-1];
 if(older===newer)return null;
 return {before:older,after:newer};
}
export function clampComparison(value){
 return Number.isFinite(Number(value))?Math.min(100,Math.max(0,Number(value))):50;
}
export function nextTimelineDate(snapshots,current){
 const dates=timelineDates(snapshots);
 if(!dates.length)return '';
 return dates[(Math.max(-1,dates.indexOf(current))+1)%dates.length];
}
export function cloudMarkerRadius(percentage){
 if(!Number.isFinite(percentage))return .05;
 return .04+Math.min(100,Math.max(0,percentage))*.001;
}
