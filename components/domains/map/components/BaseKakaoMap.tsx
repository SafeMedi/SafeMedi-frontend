import { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { MapCoordinate, MapFacilityMarker, MapRegion } from "../types";
import { buildKakaoMapHtml, regionToKakaoMapLevel } from "./kakaoMapHtml";

function getKakaoMapJsKey(): string {
  return process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY ?? "";
}

export interface BaseKakaoMapProps {
  readonly initialRegion: MapRegion;
  readonly currentCoordinate: MapCoordinate;
  readonly facilities: readonly MapFacilityMarker[];
  readonly onSelectFacility: (facilityId: string) => void;
}

interface KakaoMapWebMessage {
  readonly type: string;
  readonly facilityId?: string;
}

function serializeMarkers(markers: readonly MapFacilityMarker[]): string {
  return JSON.stringify(
    markers.map((marker) => ({
      id: marker.id,
      latitude: marker.latitude,
      longitude: marker.longitude,
      category: marker.category,
    })),
  );
}

export function BaseKakaoMap({
  initialRegion,
  currentCoordinate,
  facilities,
  onSelectFacility,
}: BaseKakaoMapProps) {
  const webViewRef = useRef<WebView>(null);
  const mapJsKey = getKakaoMapJsKey();
  const mapLevel = regionToKakaoMapLevel(initialRegion.latitudeDelta);
  const serializedFacilities = useMemo(() => serializeMarkers(facilities), [facilities]);

  const html = useMemo(
    () =>
      buildKakaoMapHtml({
        mapJsKey,
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        level: mapLevel,
        facilities,
      }),
    [facilities, initialRegion.latitude, initialRegion.longitude, mapJsKey, mapLevel],
  );

  useEffect(() => {
    const command = {
      type: "setCamera",
      latitude: currentCoordinate.latitude,
      longitude: currentCoordinate.longitude,
      level: mapLevel,
    };
    webViewRef.current?.postMessage(JSON.stringify(command));
  }, [currentCoordinate.latitude, currentCoordinate.longitude, mapLevel]);

  useEffect(() => {
    const command = {
      type: "setMarkers",
      markers: JSON.parse(serializedFacilities) as readonly MapFacilityMarker[],
    };
    webViewRef.current?.postMessage(JSON.stringify(command));
  }, [serializedFacilities]);

  const handleMessage = (rawMessage: string) => {
    try {
      const message = JSON.parse(rawMessage) as KakaoMapWebMessage;
      if (message.type === "selectFacility" && message.facilityId) {
        onSelectFacility(message.facilityId);
      }
    } catch {
      // WebView에서 전달된 비정상 메시지는 무시한다.
    }
  };

  if (mapJsKey.length === 0) {
    return null;
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html, baseUrl: "http://localhost" }}
      style={styles.map}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      onMessage={(event) => handleMessage(event.nativeEvent.data)}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
