// Moonverse v5.4 low-power render guardrails.
// This is a preference heuristic, NOT a measured GPU benchmark.
export function moonRenderPolicy({preference='auto',appQuality='high',saveData=false,reducedMotion=false,coarsePointer=false,memoryGb=null,hidden=false,onScreen=true,mode='model',speed=1,playing=true}={}){
 const lowHardware=Number.isFinite(memoryGb)&&memoryGb>0&&memoryGb<=4;
 const systemLow=appQuality==='low'||saveData||reducedMotion||lowHardware||coarsePointer;
 const quality=preference==='eco'?'low':preference==='detail'&&appQuality!=='low'?'high':systemLow?'low':'high';
 const animate=mode!=='horizons'&&playing&&speed>0&&!hidden&&onScreen&&!reducedMotion;
 return {quality,dprMax:quality==='low'?1:1.5,moonCap:12,stars:quality==='low'?300:950,animate,
  explanation:quality==='low'?'ECO: limited DPR, stars and antialiasing':'DETAIL: standard capped DPR and scene objects'};
}
export function frameCadenceEstimate(timestamps){
 if(!Array.isArray(timestamps)||timestamps.length<3||timestamps.length>1000||timestamps.some(x=>!Number.isFinite(x)))return null;
 const elapsed=timestamps.at(-1)-timestamps[0];
 if(elapsed<=0||elapsed>60000)return null;
 for(let i=1;i<timestamps.length;i++)if(timestamps[i]<=timestamps[i-1])return null;
 return Math.round(1000*(timestamps.length-1)/elapsed);
}
