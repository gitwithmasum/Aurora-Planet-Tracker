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
