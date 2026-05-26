export type CommunityLocationPickResult = {
  latitude: number;
  longitude: number;
  locationName?: string;
  locationAddress?: string;
};

let pendingPick: CommunityLocationPickResult | null = null;

export function setCommunityLocationPick(result: CommunityLocationPickResult): void {
  pendingPick = result;
}

export function consumeCommunityLocationPick(): CommunityLocationPickResult | null {
  const value = pendingPick;
  pendingPick = null;
  return value;
}
