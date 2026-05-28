import { fetchNearbyMedicalFacilities } from "../map";

const originalClientId = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID;
const originalClientSecret = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET;

describe("api/endpoints/map", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID = originalClientId;
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET = originalClientSecret;
  });

  it("네이버 키가 없으면 mock 데이터를 반환한다", async () => {
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID = "";
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET = "";

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "all",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.length).toBeGreaterThan(0);
  });

  it("네이버 응답이 비정상이면 mock 데이터로 fallback 한다", async () => {
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID = "id";
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET = "secret";
    const mockFetch = jest.fn(async () => ({ ok: false, status: 500 }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "pharmacy",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.every((facility) => facility.category === "pharmacy")).toBe(true);
  });
});
