import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useDashboardDailyMedicationRecords,
  useDashboardMedicationHistoryRecords,
  useDashboardMonthlyMedicationRecords,
  useDashboardTodayMedicationSchedules,
  useMedicationStatistics,
  useUpdateMedicationRecordMutation,
} from "../dashboard";

const mockFetchDailyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMonthlyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMedicationHistoryRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMedicationStatistics = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchTodayMedicationSchedules = jest.fn<Promise<unknown>, []>(async () => ({}));
const mockUpdateMedicationRecord = jest.fn<Promise<unknown>, [number, unknown]>(async () => ({}));
const mockInvalidateQueries = jest.fn(async () => undefined);

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

jest.mock("@/api/endpoints/dashboard", () => ({
  fetchDailyMedicationRecords: (params: unknown) => mockFetchDailyMedicationRecords(params),
  fetchMonthlyMedicationRecords: (params: unknown) => mockFetchMonthlyMedicationRecords(params),
  fetchMedicationHistoryRecords: (params: unknown) => mockFetchMedicationHistoryRecords(params),
  fetchMedicationStatistics: (params: unknown) => mockFetchMedicationStatistics(params),
  fetchTodayMedicationSchedules: () => mockFetchTodayMedicationSchedules(),
  updateMedicationRecord: (recordId: number, body: unknown) =>
    mockUpdateMedicationRecord(recordId, body),
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

  it("오늘 스케줄 쿼리는 today 엔드포인트 요청 함수를 사용한다", async () => {
    const { result } = renderHook(() => useDashboardTodayMedicationSchedules());
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.dashboard.todayMedicationSchedules);
    await options.queryFn();
    expect(mockFetchTodayMedicationSchedules).toHaveBeenCalledTimes(1);
  });

  it("복약 기록 변경 mutation은 성공 시 오늘 스케줄 쿼리를 무효화한다", async () => {
    const { result } = renderHook(() => useUpdateMedicationRecordMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: { recordId: number; body: { status: "SUCCESS" } }) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await mutation.mutationFn({ recordId: 57, body: { status: "SUCCESS" } });
    expect(mockUpdateMedicationRecord).toHaveBeenCalledWith(57, { status: "SUCCESS" });

    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
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

  it("복약 통계 쿼리는 기간 파라미터로 요청한다", async () => {
    const { result } = renderHook(() =>
      useMedicationStatistics({ startDate: "2026-05-14", endDate: "2026-05-20" }),
    );
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(
      queryKeys.dashboard.medicationStatistics("2026-05-14", "2026-05-20"),
    );
    await options.queryFn();
    expect(mockFetchMedicationStatistics).toHaveBeenCalledWith({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
    });
  });
});
