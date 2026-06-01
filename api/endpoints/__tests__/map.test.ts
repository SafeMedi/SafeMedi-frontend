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

  it("네이버 응답이 정상이면 시설 목록을 가공해 반환한다", async () => {
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID = "id";
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET = "secret";

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              title: "<b>강남약국</b>",
              category: "의료,약국",
              address: "서울시 강남구 역삼동",
              roadAddress: "서울시 강남구 테헤란로 1",
              mapx: "1270100000",
              mapy: "375000000",
              telephone: "02-1111-1111",
            },
            {
              title: "중복시설",
              category: "의료,약국",
              address: "서울시 강남구 역삼동",
              roadAddress: "서울시 강남구 테헤란로 2",
              mapx: "127.02",
              mapy: "37.52",
              telephone: "",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              title: "중복시설",
              category: "의료,응급실",
              address: "서울시 강남구 역삼동",
              roadAddress: "서울시 강남구 테헤란로 2",
              mapx: "127.03",
              mapy: "37.53",
              telephone: "02-2222-2222",
            },
            {
              title: "강남응급센터",
              category: "종합병원",
              address: "서울시 강남구 삼성동",
              roadAddress: "서울시 강남구 봉은사로 3",
              mapx: "invalid",
              mapy: "invalid",
              telephone: "02-3333-3333",
            },
          ],
        }),
      });

    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5,
      longitude: 127.01,
      category: "all",
      keyword: "강남",
    });

    expect(result.source).toBe("naver");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain("query=%EA%B0%95%EB%82%A8+%EC%95%BD%EA%B5%AD");
    expect(mockFetch.mock.calls[1][0]).toContain(
      "query=%EA%B0%95%EB%82%A8+%EC%9D%91%EA%B8%89%EC%8B%A4",
    );

    const facilityNames = result.facilities.map((facility) => facility.name);
    expect(facilityNames).toContain("강남약국");
    expect(facilityNames).toContain("강남응급센터");
    expect(result.facilities.filter((facility) => facility.name === "중복시설")).toHaveLength(1);

    const emergencyFacility = result.facilities.find(
      (facility) => facility.name === "강남응급센터",
    );
    expect(emergencyFacility).toEqual(
      expect.objectContaining({
        category: "emergency",
        latitude: 37.5,
        longitude: 127.01,
      }),
    );

    const duplicatedFacility = result.facilities.find((facility) => facility.name === "중복시설");
    expect(duplicatedFacility?.phoneNumber).toBe(null);
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

  it("네이버 결과가 비어있으면 mock 데이터를 반환한다", async () => {
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID = "id";
    process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET = "secret";
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchNearbyMedicalFacilities({
      latitude: 37.5665,
      longitude: 126.978,
      category: "emergency",
      keyword: "",
    });

    expect(result.source).toBe("mock");
    expect(result.facilities.every((facility) => facility.category === "emergency")).toBe(true);
  });
});
