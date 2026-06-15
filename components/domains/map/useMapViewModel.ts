import type { Coord, Region } from "@mj-studio/react-native-naver-map";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNearbyMedicalFacilitiesQuery } from "@/api/queries/map";
import type { MedicalFacility, MedicalFacilityCategory } from "./types";

const DEFAULT_REGION_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

interface MapLocationState {
  readonly isLoadingLocation: boolean;
  readonly locationError: string | null;
  readonly currentAddress: string | null;
  readonly currentCoordinate: Coord | null;
  readonly initialRegion: Region | null;
}

export interface MapViewModel {
  readonly isLoadingLocation: boolean;
  readonly isLoadingFacilities: boolean;
  readonly isRefreshingFacilities: boolean;
  readonly locationError: string | null;
  readonly facilitiesError: string | null;
  readonly source: "naver" | "mock";
  readonly currentAddress: string | null;
  readonly currentCoordinate: Coord | null;
  readonly initialRegion: Region | null;
  readonly category: MedicalFacilityCategory;
  readonly searchKeyword: string;
  readonly selectedFacilityId: string | null;
  readonly facilities: readonly MedicalFacility[];
  readonly setCategory: (category: MedicalFacilityCategory) => void;
  readonly setSearchKeyword: (keyword: string) => void;
  readonly setSelectedFacilityId: (facilityId: string | null) => void;
  readonly refetchFacilities: () => Promise<void>;
}

function formatAddress(address: Location.LocationGeocodedAddress | undefined): string {
  if (!address) {
    return "현재 위치";
  }

  const addressParts = [address.region, address.city, address.district, address.street].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  return addressParts.length > 0 ? addressParts.join(" ") : "현재 위치";
}

export function useMapViewModel(): MapViewModel {
  const [locationState, setLocationState] = useState<MapLocationState>({
    isLoadingLocation: true,
    locationError: null,
    currentAddress: null,
    currentCoordinate: null,
    initialRegion: null,
  });
  const [category, setCategory] = useState<MedicalFacilityCategory>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          throw new Error("위치 권한이 허용되지 않았습니다.");
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const currentCoordinate: Coord = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        };
        const reverseGeocodedAddresses = await Location.reverseGeocodeAsync(currentCoordinate);
        const currentAddress = formatAddress(reverseGeocodedAddresses[0]);

        if (!isMounted) {
          return;
        }

        setLocationState({
          isLoadingLocation: false,
          locationError: null,
          currentCoordinate,
          currentAddress,
          initialRegion: {
            ...currentCoordinate,
            ...DEFAULT_REGION_DELTA,
          },
        });
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }
        setLocationState({
          isLoadingLocation: false,
          locationError:
            error instanceof Error ? error.message : "현재 위치를 가져오지 못했습니다.",
          currentCoordinate: null,
          currentAddress: null,
          initialRegion: null,
        });
      }
    };

    void loadCurrentLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  const nearbyFacilitiesQuery = useNearbyMedicalFacilitiesQuery({
    latitude: locationState.currentCoordinate?.latitude ?? null,
    longitude: locationState.currentCoordinate?.longitude ?? null,
    category,
    keyword: searchKeyword,
  });

  const facilities = useMemo(
    () => nearbyFacilitiesQuery.data?.facilities ?? [],
    [nearbyFacilitiesQuery.data?.facilities],
  );

  useEffect(() => {
    if (facilities.length === 0) {
      setSelectedFacilityId(null);
      return;
    }
    if (!selectedFacilityId || !facilities.some((facility) => facility.id === selectedFacilityId)) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  const refetchFacilities = useCallback(async () => {
    await nearbyFacilitiesQuery.refetch();
  }, [nearbyFacilitiesQuery]);

  return {
    isLoadingLocation: locationState.isLoadingLocation,
    isLoadingFacilities: nearbyFacilitiesQuery.isLoading,
    isRefreshingFacilities: nearbyFacilitiesQuery.isRefetching,
    locationError: locationState.locationError,
    facilitiesError:
      nearbyFacilitiesQuery.error instanceof Error ? nearbyFacilitiesQuery.error.message : null,
    source: nearbyFacilitiesQuery.data?.source ?? "mock",
    currentAddress: locationState.currentAddress,
    currentCoordinate: locationState.currentCoordinate,
    initialRegion: locationState.initialRegion,
    category,
    searchKeyword,
    selectedFacilityId,
    facilities,
    setCategory,
    setSearchKeyword,
    setSelectedFacilityId,
    refetchFacilities,
  };
}
