import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useDashboardDailyMedicationRecords,
  useDashboardMedicationHistoryRecords,
  useDashboardMonthlyMedicationRecords,
} from "../dashboard";

const mockFetchDailyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMonthlyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMedicationHistoryRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/dashboard", () => ({
  fetchDailyMedicationRecords: (params: unknown) => mockFetchDailyMedicationRecords(params),
  fetchMonthlyMedicationRecords: (params: unknown) => mockFetchMonthlyMedicationRecords(params),
  fetchMedicationHistoryRecords: (params: unknown) => mockFetchMedicationHistoryRecords(params),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("일별 기록 쿼리는 토큰이 있을 때 활성화된다", async () => {
    const { result } = renderHook(() => useDashboardDailyMedicationRecords({ date: "2026-05-19" }));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.dashboard.dailyMedicationRecords("2026-05-19"));
    await options.queryFn();
    expect(mockFetchDailyMedicationRecords).toHaveBeenCalledWith({ date: "2026-05-19" });
  });

  it("월별 기록 쿼리는 토큰이 없으면 비활성화된다", () => {
    mockAccessToken = null;
    const { result } = renderHook(() =>
      useDashboardMonthlyMedicationRecords({ date: "2026-05-19" }),
    );
    const options = result.current as unknown as { enabled: boolean; queryKey: unknown };

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(queryKeys.dashboard.monthlyMedicationRecords("2026-05-19"));
  });

  it("복약 이력 쿼리는 날짜가 비어 있으면 비활성화된다", () => {
    const { result } = renderHook(() => useDashboardMedicationHistoryRecords({ date: "" }));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
    };

    expect(options.enabled).toBe(false);
    expect(options.queryKey).toEqual(queryKeys.dashboard.medicationHistoryRecords(""));
  });
});
