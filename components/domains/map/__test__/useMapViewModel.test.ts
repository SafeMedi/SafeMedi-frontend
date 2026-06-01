import { renderHook } from "@testing-library/react-native";
import type { NearbyMedicalFacilitiesViewModel } from "../nearby-medical-facilities/useNearbyMedicalFacilitiesViewModel";
import { useMapViewModel } from "../useMapViewModel";

const mockUseNearbyMedicalFacilitiesViewModel = jest.fn();

jest.mock("../nearby-medical-facilities/useNearbyMedicalFacilitiesViewModel", () => ({
  useNearbyMedicalFacilitiesViewModel: () => mockUseNearbyMedicalFacilitiesViewModel(),
}));

const mockViewModel: NearbyMedicalFacilitiesViewModel = {
  isLoadingLocation: false,
  isLoadingFacilities: false,
  isRefreshingFacilities: false,
  locationError: null,
  facilitiesError: null,
  source: "mock",
  currentAddress: "서울",
  currentCoordinate: { latitude: 37.5, longitude: 127.01 },
  initialRegion: { latitude: 37.5, longitude: 127.01, latitudeDelta: 0.01, longitudeDelta: 0.01 },
  category: "all",
  searchKeyword: "",
  selectedFacilityId: null,
  facilities: [],
  setCategory: jest.fn(),
  setSearchKeyword: jest.fn(),
  setSelectedFacilityId: jest.fn(),
  refetchFacilities: jest.fn(async () => {}),
};

describe("useMapViewModel", () => {
  it("주변 의료기관 view model을 그대로 위임한다", () => {
    mockUseNearbyMedicalFacilitiesViewModel.mockReturnValue(mockViewModel);

    const { result } = renderHook(() => useMapViewModel());

    expect(result.current).toBe(mockViewModel);
  });
});
