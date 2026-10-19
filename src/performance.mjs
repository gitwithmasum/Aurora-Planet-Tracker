// Conservative, capability-based rendering defaults. No UA sniffing or permission prompts.
export function chooseGraphicsQuality({
  viewportWidth = 1280,
  devicePixelRatio = 1,
  hardwareConcurrency = 8,
  deviceMemory = 8,
  coarsePointer = false,
  reducedMotion = false,
  saveData = false,
} = {}) {
  if (reducedMotion || saveData) return 'low';
  if (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 4) return 'low';
  if (Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= 4) return 'low';
  if (coarsePointer && viewportWidth <= 900) return 'low';
  if (viewportWidth <= 750 && devicePixelRatio >= 2) return 'low';
  return 'high';
}

export function resolveGraphicsQuality(preference, automaticQuality) {
  if (preference === 'high' || preference === 'low') return preference;
  return automaticQuality === 'low' ? 'low' : 'high';
}

// v4.5: Scene animation must stop when scrolling it away, pausing, hiding the
// browser tab, or when the OS requests reduced motion. The canvas remains
// interactive because react-three-fiber can still render on demand.
export function shouldAnimateScene({
 pageVisible=true,
 sceneVisible=true,
 paused=false,
 reducedMotion=false
}={}){
 return Boolean(pageVisible&&sceneVisible&&!paused&&!reducedMotion);
}
export function isSolarSceneTab(tab){
 return tab==='Solar System'||tab==='Command Center';
}
export function formatBrowserFrameRate(frames,elapsedMs){
 if(!Number.isFinite(frames)||!Number.isFinite(elapsedMs)||frames<0||elapsedMs<500)return null;
 // Browser requestAnimationFrame timing; this is NOT a measurement of WebGL draw FPS.
 return Math.min(240,Math.max(0,Math.round(frames*1000/elapsedMs)));
}
