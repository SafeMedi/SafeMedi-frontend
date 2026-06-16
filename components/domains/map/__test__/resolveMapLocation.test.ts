import { Platform } from "react-native";
import { resolveMapLocation } from "../resolveMapLocation";

const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockGetLastKnownPositionAsync = jest.fn();
const mockWatchPositionAsync = jest.fn();
const mockGetProviderStatusAsync = jest.fn();
const mockEnableNetworkProviderAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();

jest.mock("@/constants/api-config", () => ({
  apiConfig: {
    useMock: true,
    baseUrl: "https://api.safemedi.local",
    timeoutMs: 30_000,
  },
}));

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: "balanced", Lowest: "lowest", High: "high" },
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
  getLastKnownPositionAsync: (...args: unknown[]) => mockGetLastKnownPositionAsync(...args),
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...args),
  getProviderStatusAsync: () => mockGetProviderStatusAsync(),
  enableNetworkProviderAsync: () => mockEnableNetworkProviderAsync(),
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
}));

describe("resolveMapLocation", () => {
  const originalPlatformOs = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, "OS", { value: "android" });

    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetLastKnownPositionAsync.mockResolvedValue(null);
    mockGetCurrentPositionAsync.mockRejectedValue(
      new Error("Current location is unavailable. Make sure that location services are enabled"),
    );
    mockWatchPositionAsync.mockRejectedValue(new Error("watch setup failed"));
    mockGetProviderStatusAsync.mockResolvedValue({ locationServicesEnabled: true });
    mockEnableNetworkProviderAsync.mockResolvedValue(undefined);
    mockReverseGeocodeAsync.mockResolvedValue([
      { region: "서울", city: "강남구", district: "역삼동", street: "테헤란로" },
    ]);
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalPlatformOs });
  });

  it("개발 mock 모드에서는 위치 조회 실패 시 기본 좌표를 사용한다", async () => {
    const result = await resolveMapLocation();

    expect(result.currentCoordinate).toEqual({
      latitude: 37.5665,
      longitude: 126.978,
    });
    expect(result.currentAddress).toBe("개발용 기본 위치 (서울)");
    expect(result.usedDevFallback).toBe(true);
  });

  it("마지막 위치가 있으면 개발 fallback 없이 반환한다", async () => {
    mockGetLastKnownPositionAsync.mockResolvedValueOnce({
      coords: { latitude: 37.51, longitude: 127.01 },
    });

    const result = await resolveMapLocation();

    expect(result.currentCoordinate).toEqual({
      latitude: 37.51,
      longitude: 127.01,
    });
    expect(result.usedDevFallback).toBe(false);
    expect(mockGetCurrentPositionAsync).not.toHaveBeenCalled();
  });
});
