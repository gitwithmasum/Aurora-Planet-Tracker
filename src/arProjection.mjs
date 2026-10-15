// Perspective sky projection for a manually aligned camera view.
// Coordinate convention: azimuth clockwise from north, altitude above horizon.
// Heading and pitch describe optical axis; roll rotates the screen overlay.
const RAD=Math.PI/180;
export const wrapDegrees=x=>((x%360)+360)%360;
export const signedDegrees=x=>((x+540)%360)-180;
export function skyVector(azimuth,altitude){
 const a=azimuth*RAD,h=altitude*RAD;
 return [Math.cos(h)*Math.sin(a),Math.cos(h)*Math.cos(a),Math.sin(h)]; // East, North, Up
}
export function projectSkyPoint({azimuth,altitude,heading,pitch,roll=0,hfov=60,aspect=1}){
 if(![azimuth,altitude,heading,pitch,roll,hfov,aspect].every(Number.isFinite)||hfov<=0||hfov>=170||aspect<=0)return null;
 const v=skyVector(azimuth,altitude),a=heading*RAD,h=pitch*RAD;
 const forward=[Math.cos(h)*Math.sin(a),Math.cos(h)*Math.cos(a),Math.sin(h)];
 const right=[Math.cos(a),-Math.sin(a),0];
 const up=[-Math.sin(h)*Math.sin(a),-Math.sin(h)*Math.cos(a),Math.cos(h)];
 const dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
 const z=dot(v,forward);
 if(z<=0.001)return null;
 const tangent=Math.tan(hfov*RAD/2);
 let nx=dot(v,right)/(z*tangent),ny=dot(v,up)/(z*tangent)*aspect;
 const r=roll*RAD;
 const rx=nx*Math.cos(r)-ny*Math.sin(r),ry=nx*Math.sin(r)+ny*Math.cos(r);
 return {x:50+50*rx,y:50-50*ry,inFrame:Math.abs(rx)<=1&&Math.abs(ry)<=1,depth:z};
}
export function validateCalibration(value){
 if(!value||typeof value!=='object')return null;
 const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:null;
 const hfov=number(value.hfov,35,90),roll=number(value.roll,-180,180);
 return hfov===null||roll===null?null:{hfov,roll};
}
