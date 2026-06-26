export function zoomFromLatitudeDelta(latitudeDelta: number): number {
  const span = Math.max(latitudeDelta, 1e-6);
  const z = Math.log2(360 / span) - 1;
  return Math.min(20, Math.max(2, z));
}

export function clampZoom(z: number): number {
  return Math.min(20, Math.max(2, z));
}

export function latitudeDeltaFromZoom(zoomLevel: number): number {
  return 360 / Math.pow(2, zoomLevel + 1);
}
