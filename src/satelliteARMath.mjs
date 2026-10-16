export function wrapAzimuth(deg){return ((deg%360)+360)%360}
export function signedAngle(deg){return ((deg+540)%360+360)%360-180}
export function guidingOffset(targetAz,targetAlt,heading,pitch){
 if(![targetAz,targetAlt,heading,pitch].every(Number.isFinite))return null;
 const horizontal=signedAngle(targetAz-heading);
 const vertical=targetAlt-pitch;
 return {horizontal,vertical,turn:Math.abs(horizontal)<4?'Aligned horizontally':horizontal>0?'Turn right':'Turn left',tilt:Math.abs(vertical)<4?'Elevation aligned':vertical>0?'Tilt up':'Tilt down',aligned:Math.abs(horizontal)<4&&Math.abs(vertical)<4};
}
export function projectSatellite(targetAz,targetAlt,heading,pitch,hfov=65,aspect=16/9){
 const offset=guidingOffset(targetAz,targetAlt,heading,pitch);
 if(!offset||!Number.isFinite(hfov)||!Number.isFinite(aspect)||aspect<=0)return null;
 const vfov=2*Math.atan(Math.tan(hfov*Math.PI/360)/aspect)*180/Math.PI;
 const x=50+50*Math.tan(offset.horizontal*Math.PI/180)/Math.tan(hfov*Math.PI/360);
 const y=50-50*Math.tan(offset.vertical*Math.PI/180)/Math.tan(vfov*Math.PI/360);
 return {...offset,x,y,inFrame:Math.abs(offset.horizontal)<hfov/2&&Math.abs(offset.vertical)<vfov/2&&targetAlt>=0};
}
