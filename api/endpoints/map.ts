import type {
  FetchNearbyMedicalFacilitiesParams,
  MedicalFacility,
  MedicalFacilityCategory,
  NearbyMedicalFacilitiesResponse,
} from "@/api/types/map";

const NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";
const NAVER_DEFAULT_DISPLAY = 10;
const NAVER_REQUEST_TIMEOUT_MS = 7_000;
const COORDINATE_SCALE = 10_000_000;

interface NaverLocalSearchItem {
  readonly title: string;
  readonly category: string;
  readonly address: string;
  readonly roadAddress: string;
  readonly mapx: string;
  readonly mapy: string;
  readonly telephone: string;
}

interface NaverLocalSearchResponse {
  readonly items: readonly NaverLocalSearchItem[];
}

function getNaverSearchClientId(): string {
  return process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID ?? "";
}

function getNaverSearchClientSecret(): string {
  return process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET ?? "";
}

function sanitizeTitle(title: string): string {
  return title.replace(/<[^>]*>/g, "").trim();
}

function resolveSearchKeywords(
  category: MedicalFacilityCategory,
  keyword: string,
): readonly [string, ...string[]] {
  const normalizedKeyword = keyword.trim();
  if (category === "pharmacy") {
    return [normalizedKeyword.length > 0 ? `${normalizedKeyword} 약국` : "약국"];
  }

  if (category === "emergency") {
    return [normalizedKeyword.length > 0 ? `${normalizedKeyword} 응급실` : "응급실"];
  }

  if (normalizedKeyword.length > 0) {
    return [`${normalizedKeyword} 약국`, `${normalizedKeyword} 응급실`];
  }

  return ["약국", "응급실"];
}

function resolveFacilityCategory(
  categoryText: string,
  fallbackCategory: Exclude<MedicalFacilityCategory, "all">,
): Exclude<MedicalFacilityCategory, "all"> {
  if (categoryText.includes("약국")) {
    return "pharmacy";
  }
  if (categoryText.includes("응급") || categoryText.includes("병원")) {
    return "emergency";
  }
  return fallbackCategory;
}

function is24HoursFacility(name: string, categoryText: string): boolean {
  return name.includes("24") || categoryText.includes("24");
}

function toCoordinate(value: string, fallbackValue: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallbackValue;
  }
  if (Math.abs(parsed) > 1_000) {
    return parsed / COORDINATE_SCALE;
  }
  return parsed;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const EARTH_RADIUS_METERS = 6_371_000;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const latitude1 = toRadians(fromLatitude);
  const latitude2 = toRadians(toLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(EARTH_RADIUS_METERS * centralAngle);
}

function resolveFallbackStatus(is24Hours: boolean): "open" | "unknown" {
  return is24Hours ? "open" : "unknown";
}

function toMedicalFacility(
  item: NaverLocalSearchItem,
  index: number,
  params: FetchNearbyMedicalFacilitiesParams,
  fallbackCategory: Exclude<MedicalFacilityCategory, "all">,
): MedicalFacility {
  const latitude = toCoordinate(item.mapy, params.latitude);
  const longitude = toCoordinate(item.mapx, params.longitude);
  const name = sanitizeTitle(item.title);
  const category = resolveFacilityCategory(item.category, fallbackCategory);
  const is24Hours = is24HoursFacility(name, item.category);

  return {
    id: `${category}-${name}-${index}-${latitude}-${longitude}`,
    name,
    category,
    address: item.address,
    roadAddress: item.roadAddress,
    latitude,
    longitude,
    distanceMeters: getDistanceMeters(params.latitude, params.longitude, latitude, longitude),
    phoneNumber: item.telephone.trim().length > 0 ? item.telephone : null,
    is24Hours,
    status: resolveFallbackStatus(is24Hours),
  };
}

function createMockFacilities(
  params: FetchNearbyMedicalFacilitiesParams,
): readonly MedicalFacility[] {
  const baseFacilities: readonly MedicalFacility[] = [
    {
      id: "mock-pharmacy-1",
      name: "24시 서울약국",
      category: "pharmacy",
      address: "서울시 강남구 테헤란로 123",
      roadAddress: "서울시 강남구 테헤란로 123",
      latitude: params.latitude + 0.0012,
      longitude: params.longitude - 0.0009,
      distanceMeters: 250,
      phoneNumber: "02-1234-5678",
      is24Hours: true,
      status: "open",
    },
    {
      id: "mock-emergency-1",
      name: "강남세브란스병원 응급실",
      category: "emergency",
      address: "서울시 강남구 언주로 211",
      roadAddress: "서울시 강남구 언주로 211",
      latitude: params.latitude + 0.0031,
      longitude: params.longitude + 0.001,
      distanceMeters: 1_200,
      phoneNumber: "02-2019-2114",
      is24Hours: true,
      status: "open",
    },
    {
      id: "mock-pharmacy-2",
      name: "온누리약국",
      category: "pharmacy",
      address: "서울시 강남구 역삼동 456",
      roadAddress: "서울시 강남구 역삼동 456",
      latitude: params.latitude - 0.0013,
      longitude: params.longitude + 0.0012,
      distanceMeters: 450,
      phoneNumber: "02-6789-1000",
      is24Hours: false,
      status: "open",
    },
    {
      id: "mock-emergency-2",
      name: "삼성서울병원 응급의료센터",
      category: "emergency",
      address: "서울시 강남구 일원로 81",
      roadAddress: "서울시 강남구 일원로 81",
      latitude: params.latitude + 0.0053,
      longitude: params.longitude + 0.0023,
      distanceMeters: 2_100,
      phoneNumber: "02-3410-2114",
      is24Hours: true,
      status: "open",
    },
    {
      id: "mock-pharmacy-3",
      name: "중앙약국",
      category: "pharmacy",
      address: "서울시 강남구 선릉로 234",
      roadAddress: "서울시 강남구 선릉로 234",
      latitude: params.latitude - 0.0021,
      longitude: params.longitude - 0.0014,
      distanceMeters: 680,
      phoneNumber: null,
      is24Hours: false,
      status: "closed",
    },
  ];

  return baseFacilities.filter((facility) => {
    if (params.category === "all") {
      return true;
    }
    if (facility.category !== params.category) {
      return false;
    }
    const keyword = params.keyword.trim();
    if (keyword.length === 0) {
      return true;
    }
    return facility.name.includes(keyword) || facility.roadAddress.includes(keyword);
  });
}

async function fetchNaverLocalItems(
  keyword: string,
  params: FetchNearbyMedicalFacilitiesParams,
): Promise<readonly NaverLocalSearchItem[]> {
  const clientId = getNaverSearchClientId();
  const clientSecret = getNaverSearchClientSecret();
  const searchParams = new URLSearchParams({
    query: keyword,
    display: String(NAVER_DEFAULT_DISPLAY),
    start: "1",
    coordinate: `${params.longitude},${params.latitude}`,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, NAVER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${NAVER_LOCAL_SEARCH_URL}?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Naver local search failed with status ${response.status}`);
    }

    const body = (await response.json()) as NaverLocalSearchResponse;
    return body.items;
  } finally {
    clearTimeout(timeout);
  }
}

function deduplicateFacilities(facilities: readonly MedicalFacility[]): readonly MedicalFacility[] {
  const deduplicatedByName = new Map<string, MedicalFacility>();

  for (const facility of facilities) {
    const key = `${facility.name}-${facility.roadAddress}`;
    const previous = deduplicatedByName.get(key);
    if (!previous || facility.distanceMeters < previous.distanceMeters) {
      deduplicatedByName.set(key, facility);
    }
  }

  return [...deduplicatedByName.values()].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function fetchNearbyMedicalFacilities(
  params: FetchNearbyMedicalFacilitiesParams,
): Promise<NearbyMedicalFacilitiesResponse> {
  const clientId = getNaverSearchClientId();
  const clientSecret = getNaverSearchClientSecret();
  if (clientId.length === 0 || clientSecret.length === 0) {
    return {
      source: "mock",
      facilities: createMockFacilities(params),
    };
  }

  const keywords = resolveSearchKeywords(params.category, params.keyword);

  try {
    const results = await Promise.all(
      keywords.map(async (keyword, index) => {
        const items = await fetchNaverLocalItems(keyword, params);
        const fallbackCategory = index === 0 ? "pharmacy" : "emergency";
        return items.map((item, itemIndex) =>
          toMedicalFacility(
            item,
            index * NAVER_DEFAULT_DISPLAY + itemIndex,
            params,
            fallbackCategory,
          ),
        );
      }),
    );

    const facilities = deduplicateFacilities(results.flat());
    if (facilities.length === 0) {
      return {
        source: "mock",
        facilities: createMockFacilities(params),
      };
    }

    return {
      source: "naver",
      facilities,
    };
  } catch {
    return {
      source: "mock",
      facilities: createMockFacilities(params),
    };
  }
}
