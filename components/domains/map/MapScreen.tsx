import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { BaseNaverMap } from "./components/BaseNaverMap";
import { useMapViewModel } from "./useMapViewModel";

export function MapScreen() {
  const { currentAddress, errorMessage, initialRegion, isLoading, markerCoordinate } =
    useMapViewModel();

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>현재 위치를 불러오는 중이에요.</Text>
      </View>
    );
  }

  if (!initialRegion || !markerCoordinate) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {errorMessage ?? "현재 위치를 확인할 수 없어서 지도를 준비하지 못했습니다."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <BaseNaverMap
        initialRegion={initialRegion}
        markerCaption={currentAddress ?? "현재 위치"}
        markerCoordinate={markerCoordinate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
  },
});
