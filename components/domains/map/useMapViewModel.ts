import { useNearbyMedicalFacilitiesViewModel } from "./nearby-medical-facilities/useNearbyMedicalFacilitiesViewModel";

export type MapViewModel = ReturnType<typeof useNearbyMedicalFacilitiesViewModel>;

export function useMapViewModel(): MapViewModel {
  return useNearbyMedicalFacilitiesViewModel();
}
