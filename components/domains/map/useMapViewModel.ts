import type { Coord, Region } from "@mj-studio/react-native-naver-map";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export interface MapViewModel {
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly initialRegion: Region | null;
  readonly markerCoordinate: Coord | null;
  readonly currentAddress: string | null;
}

interface MapViewModelState {
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly initialRegion: Region | null;
  readonly markerCoordinate: Coord | null;
  readonly currentAddress: string | null;
}

const DEFAULT_REGION_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
} as const;

function formatAddress(address: Location.LocationGeocodedAddress | undefined): string {
  if (!address) {
    return "현재 위치";
  }

  const addressParts = [address.region, address.city, address.district, address.street].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0,
  );

  if (addressParts.length === 0) {
    return "현재 위치";
  }

  return addressParts.join(" ");
}

export function useMapViewModel(): MapViewModel {
  const [state, setState] = useState<MapViewModelState>({
    isLoading: true,
    errorMessage: null,
    initialRegion: null,
    markerCoordinate: null,
    currentAddress: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        console.log("[map] location permission status:", permission.status);
        if (permission.status !== "granted") {
          throw new Error("위치 권한이 허용되지 않았습니다.");
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const markerCoordinate: Coord = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        };
        console.log("[map] current coordinate:", markerCoordinate);
        const reverseGeocodedAddresses = await Location.reverseGeocodeAsync(markerCoordinate);
        const currentAddress = formatAddress(reverseGeocodedAddresses[0]);
        console.log("[map] reverse geocoded address:", reverseGeocodedAddresses[0] ?? null);

        if (!isMounted) {
          return;
        }

        setState({
          isLoading: false,
          errorMessage: null,
          markerCoordinate,
          currentAddress,
          initialRegion: {
            ...markerCoordinate,
            ...DEFAULT_REGION_DELTA,
          },
        });
      } catch (error: unknown) {
        console.log("[map] location load error:", error);
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "현재 위치를 가져오지 못했습니다.";

        setState({
          isLoading: false,
          errorMessage,
          initialRegion: null,
          markerCoordinate: null,
          currentAddress: null,
        });
      }
    };

    void loadCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
