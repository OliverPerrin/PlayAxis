export const hasCoordinates = (p) =>
  p?.latitude != null &&
  p.latitude !== "" &&
  p.longitude !== "" &&
  p?.longitude != null &&
  Number.isFinite(Number(p.latitude)) &&
  Number.isFinite(Number(p.longitude)) &&
  Math.abs(Number(p.latitude)) <= 85 &&
  Math.abs(Number(p.longitude)) <= 180;
