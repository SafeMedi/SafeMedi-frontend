import type { MedicalFacility, MedicalFacilityCategory } from "@/api/types/map";

export interface MapFacilityMarker {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly caption: string;
  readonly category: Exclude<MedicalFacilityCategory, "all">;
}

export type { MedicalFacility, MedicalFacilityCategory };
