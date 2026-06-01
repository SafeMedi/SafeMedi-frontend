import {
  type Coord,
  NaverMapMarkerOverlay,
  NaverMapView,
  type Region,
} from "@mj-studio/react-native-naver-map";
import { StyleSheet } from "react-native";
import type { MapFacilityMarker } from "../nearby-medical-facilities/types";

export interface BaseNaverMapProps {
  readonly initialRegion: Region;
  readonly currentCoordinate: Coord;
  readonly facilities: readonly MapFacilityMarker[];
  readonly onSelectFacility: (facilityId: string) => void;
}

const CURRENT_MARKER_SIZE = 24;
const FACILITY_MARKER_SIZE = 24;

export function BaseNaverMap({
  initialRegion,
  currentCoordinate,
  facilities,
  onSelectFacility,
}: BaseNaverMapProps) {
  return (
    <NaverMapView
      initialRegion={initialRegion}
      isExtentBoundedInKorea
      isShowScaleBar={false}
      isShowZoomControls={false}
      style={styles.map}
    >
      <NaverMapMarkerOverlay
        latitude={currentCoordinate.latitude}
        longitude={currentCoordinate.longitude}
        caption={{ text: "현" }}
        width={CURRENT_MARKER_SIZE}
        height={CURRENT_MARKER_SIZE}
      />
      {facilities.map((facility) => (
        <NaverMapMarkerOverlay
          key={facility.id}
          latitude={facility.latitude}
          longitude={facility.longitude}
          caption={{ text: facility.caption }}
          width={FACILITY_MARKER_SIZE}
          height={FACILITY_MARKER_SIZE}
          onTap={() => onSelectFacility(facility.id)}
        />
      ))}
    </NaverMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
