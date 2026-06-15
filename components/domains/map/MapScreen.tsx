import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectChip } from "@/components/ui/SelectChip";
import { palette } from "@/constants/design-tokens";
import { BaseKakaoMap } from "./components/BaseKakaoMap";
import { MedicalFacilityCard } from "./components/MedicalFacilityCard";
import type { MedicalFacility } from "./types";
import { useMapViewModel } from "./useMapViewModel";

const CATEGORY_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "약국", value: "pharmacy" },
  { label: "응급실", value: "emergency" },
] as const;

function toMapSearchUrl(facility: MedicalFacility): string {
  if (facility.placeUrl) {
    return facility.placeUrl;
  }
  return `https://map.kakao.com/link/map/${facility.latitude},${facility.longitude}`;
}

export function MapScreen() {
  const viewModel = useMapViewModel();

  const markers = viewModel.facilities.map((facility) => ({
    id: facility.id,
    latitude: facility.latitude,
    longitude: facility.longitude,
    caption: facility.category === "pharmacy" ? "약" : "응",
    category: facility.category,
  }));

  const handlePressCall = useCallback(async (facility: MedicalFacility) => {
    if (!facility.phoneNumber) {
      return;
    }
    await Linking.openURL(`tel:${facility.phoneNumber}`);
  }, []);

  const handlePressDirections = useCallback(async (facility: MedicalFacility) => {
    await Linking.openURL(toMapSearchUrl(facility));
  }, []);

  if (viewModel.isLoadingLocation) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>현재 위치를 불러오는 중이에요.</Text>
      </View>
    );
  }

  if (!viewModel.initialRegion || !viewModel.currentCoordinate) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {viewModel.locationError ??
            "현재 위치를 확인할 수 없어 주변 의료기관을 표시할 수 없습니다."}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topSection}>
        <Text style={styles.title}>주변 의료기관</Text>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={palette.input_placeholder} />
          <TextInput
            value={viewModel.searchKeyword}
            onChangeText={viewModel.setSearchKeyword}
            placeholder="약국, 병원 검색..."
            placeholderTextColor={palette.input_placeholder}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={viewModel.category === option.value}
              onPress={() => viewModel.setCategory(option.value)}
              flex={1}
              height={34}
            />
          ))}
        </View>
      </View>

      <View style={styles.mapSection}>
        <BaseKakaoMap
          initialRegion={viewModel.initialRegion}
          currentCoordinate={viewModel.currentCoordinate}
          facilities={markers}
          onSelectFacility={viewModel.setSelectedFacilityId}
        />
      </View>

      <ScrollView
        style={styles.listSection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderText}>{viewModel.facilities.length}개 의료기관</Text>
        </View>
        {viewModel.isLoadingFacilities || viewModel.isRefreshingFacilities ? (
          <ActivityIndicator size="small" color={palette.green} />
        ) : null}
        {viewModel.facilitiesError ? (
          <Text style={styles.errorText}>
            목록을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.
          </Text>
        ) : null}
        {viewModel.facilities.map((facility) => (
          <MedicalFacilityCard
            key={facility.id}
            facility={facility}
            onPressCall={handlePressCall}
            onPressDirections={handlePressDirections}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: { marginTop: 8, color: palette.icon },
  errorText: { color: palette.red_strong, fontSize: 14, textAlign: "center" },
  topSection: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: palette.map_search_border,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 8,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: palette.title_emphasis,
    letterSpacing: -0.3,
  },
  searchWrapper: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.overlay_white_25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.title_emphasis },
  categoryRow: { flexDirection: "row", gap: 8 },
  mapSection: { height: 210, overflow: "hidden" },
  listSection: { flex: 1, backgroundColor: "transparent" },
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listHeaderText: { fontSize: 20, fontWeight: "700", color: palette.black },
});
