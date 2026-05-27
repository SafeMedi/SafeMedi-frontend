import {
  type Coord,
  NaverMapMarkerOverlay,
  NaverMapView,
  type Region,
} from "@mj-studio/react-native-naver-map";
import { StyleSheet } from "react-native";

export interface BaseNaverMapProps {
  readonly initialRegion: Region;
  readonly markerCoordinate: Coord;
  readonly markerCaption: string;
}

export function BaseNaverMap({
  initialRegion,
  markerCoordinate,
  markerCaption,
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
        latitude={markerCoordinate.latitude}
        longitude={markerCoordinate.longitude}
        caption={{ text: markerCaption }}
      />
    </NaverMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
