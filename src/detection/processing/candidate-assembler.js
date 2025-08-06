function assembleCandidate(detection, validation) {
  // FIXED: Input validation prevents crashes
  if (!detection || !validation) return null;
  
  // FIXED: Safe property access with fallbacks
  const signature = detection.signature || 'unknown';
  const dex = detection.dex || 'unknown';
  const confidence = (typeof validation.confidence === 'number') 
    ? validation.confidence 
    : 0.5;
  
  return {
    id: `${dex}_${signature.slice(0,8)}_${Date.now()}`,
    dex,
    token: detection.baseToken || null,
    confidence,
    detectedAt: detection.detectedAt || Date.now(),
    trading: { 
      risk: confidence > 0.8 ? 'LOW' : 'HIGH' 
    }
  };
}