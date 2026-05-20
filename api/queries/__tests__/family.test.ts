import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { useFamilyDetail, useFamilyManageOverview } from "../family";

const mockFetchFamilyManageOverview = jest.fn<Promise<unknown>, []>(async () => ({}));
const mockFetchFamilyDetail = jest.fn<Promise<unknown>, [number]>(async () => ({}));

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/family", () => ({
  fetchFamilyManageOverview: () => mockFetchFamilyManageOverview(),
  fetchFamilyDetail: (familyId: number) => mockFetchFamilyDetail(familyId),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/family", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("가족 관리 overview 쿼리는 토큰이 있을 때 활성화된다", async () => {
    const { result } = renderHook(() => useFamilyManageOverview());
    const options = result.current as unknown as {
      enabled: boolean;
      staleTime: number;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBe(5 * 60 * 1000);
    expect(options.queryKey).toEqual(queryKeys.family.manageOverview);

    await options.queryFn();
    expect(mockFetchFamilyManageOverview).toHaveBeenCalledTimes(1);
  });

  it("가족 상세 쿼리는 familyId가 null이면 비활성화된다", async () => {
    const { result } = renderHook(() => useFamilyDetail(null));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(queryKeys.family.detail(-1));
    await expect(options.queryFn()).rejects.toThrow("가족 ID가 필요합니다.");
  });

  it("가족 상세 쿼리는 familyId가 있으면 조회 함수를 호출한다", async () => {
    const { result } = renderHook(() => useFamilyDetail(7));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.family.detail(7));

    await options.queryFn();
    expect(mockFetchFamilyDetail).toHaveBeenCalledWith(7);
  });

  it("토큰이 없으면 쿼리를 비활성화한다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() => useFamilyManageOverview());
    const options = result.current as unknown as { enabled: boolean };

    expect(options.enabled).toBe(false);
  });
});
