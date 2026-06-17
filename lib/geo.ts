export interface LatLng {
  lat: number;
  lng: number;
}

export interface UserLocation extends LatLng {
  neighborhood: string;
  city: string;
}

// Mocked elder's location — central Abu Dhabi (Khalidiyah area).
// Replace with the elder's actual address when accounts are added.
export const USER_LOCATION: UserLocation = {
  lat: 24.4763,
  lng: 54.3705,
  neighborhood: 'Khalidiyah',
  city: 'Abu Dhabi',
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
