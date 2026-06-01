import { renderHook, waitFor } from "@testing-library/react-native";
import { useNearbyMedicalFacilitiesViewModel } from "../useNearbyMedicalFacilitiesViewModel";

const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();
const mockUseNearbyMedicalFacilitiesQuery = jest.fn();

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: "balanced" },
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
}));

jest.mock("@/api/queries/map", () => ({
  useNearbyMedicalFacilitiesQuery: (params: unknown) => mockUseNearbyMedicalFacilitiesQuery(params),
}));

describe("useNearbyMedicalFacilitiesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 37.5, longitude: 127.0 },
    });
    mockReverseGeocodeAsync.mockResolvedValue([
      { region: "서울", city: "강남구", district: "역삼동", street: "테헤란로" },
    ]);
    mockUseNearbyMedicalFacilitiesQuery.mockReturnValue({
      data: { source: "mock", facilities: [] },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(async () => ({})),
    });
  });

  it("현재 위치와 주소를 초기화하고 목록 쿼리를 호출한다", async () => {
    const { result } = renderHook(() => useNearbyMedicalFacilitiesViewModel());

    await waitFor(() => {
      expect(result.current.isLoadingLocation).toBe(false);
    });

    expect(result.current.currentCoordinate).toEqual({
      latitude: 37.5,
      longitude: 127,
    });
    expect(result.current.currentAddress).toBe("서울 강남구 역삼동 테헤란로");
    expect(mockUseNearbyMedicalFacilitiesQuery).toHaveBeenCalledWith({
      latitude: 37.5,
      longitude: 127,
      category: "all",
      keyword: "",
    });
  });

  it("위치 권한 거부 시 에러 상태를 세팅한다", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValueOnce({ status: "denied" });

    const { result } = renderHook(() => useNearbyMedicalFacilitiesViewModel());

    await waitFor(() => {
      expect(result.current.isLoadingLocation).toBe(false);
    });

    expect(result.current.locationError).toBe("위치 권한이 허용되지 않았습니다.");
    expect(result.current.initialRegion).toBeNull();
  });
});
