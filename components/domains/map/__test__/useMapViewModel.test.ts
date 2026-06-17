import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useMapViewModel } from "../useMapViewModel";

const mockResolveMapLocation = jest.fn();
const mockUseNearbyMedicalFacilitiesQuery = jest.fn();

jest.mock("../resolveMapLocation", () => ({
  resolveMapLocation: () => mockResolveMapLocation(),
}));

jest.mock("@/api/queries/map", () => ({
  useNearbyMedicalFacilitiesQuery: (params: unknown) => mockUseNearbyMedicalFacilitiesQuery(params),
}));

describe("useMapViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveMapLocation.mockResolvedValue({
      currentCoordinate: { latitude: 37.5, longitude: 127.0 },
      currentAddress: "서울 강남구 역삼동 테헤란로",
      initialRegion: {
        latitude: 37.5,
        longitude: 127.0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      usedDevFallback: false,
    });
    mockUseNearbyMedicalFacilitiesQuery.mockReturnValue({
      data: { source: "mock", facilities: [] },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(async () => ({})),
    });
  });

  it("현재 위치와 주소를 초기화하고 목록 쿼리를 호출한다", async () => {
    const { result } = renderHook(() => useMapViewModel());

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

  it("위치 조회 실패 시 에러 상태를 세팅한다", async () => {
    mockResolveMapLocation.mockRejectedValueOnce(new Error("위치 권한이 허용되지 않았습니다."));

    const { result } = renderHook(() => useMapViewModel());

    await waitFor(() => {
      expect(result.current.isLoadingLocation).toBe(false);
    });

    expect(result.current.locationError).toBe("위치 권한이 허용되지 않았습니다.");
    expect(result.current.initialRegion).toBeNull();
  });

  it("retryLocation 호출 시 위치 조회를 다시 시도한다", async () => {
    const { result } = renderHook(() => useMapViewModel());

    await waitFor(() => {
      expect(result.current.isLoadingLocation).toBe(false);
    });

    await act(async () => {
      result.current.retryLocation();
    });

    await waitFor(() => {
      expect(mockResolveMapLocation).toHaveBeenCalledTimes(2);
    });
  });
});
