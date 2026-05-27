export type DirectionsProfile = 'driving' | 'walking';

export type RouteCoordinate = [longitude: number, latitude: number];

export interface DirectionsRoute {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  profile: DirectionsProfile;
}
