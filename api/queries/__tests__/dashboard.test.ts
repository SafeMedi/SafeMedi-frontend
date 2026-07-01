import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import {
  useDashboardDailyMedicationRecords,
  useDashboardMedicationHistoryRecords,
  useDashboardMonthlyMedicationRecords,
  useDashboardTodayMedicationSchedules,
  useMarkMedicationRecordsMutation,
  useMedicationStatistics,
  useUpdateMedicationRecordMutation,
} from "../dashboard";

const mockFetchDailyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMonthlyMedicationRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMedicationHistoryRecords = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchMedicationStatistics = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));
const mockFetchTodayMedicationSchedules = jest.fn<Promise<unknown>, []>(async () => ({}));
const mockUpdateMedicationRecord = jest.fn<Promise<unknown>, [number, unknown]>(async () => ({}));
const mockCancelQueries = jest.fn(async () => undefined);
const mockInvalidateQueries = jest.fn(async () => undefined);
const mockGetQueryData = jest.fn<TodayMedicationSchedulesResponse | undefined, [unknown]>(
  () => undefined,
);
const mockSetQueryData = jest.fn<void, [unknown, unknown]>();

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(() => ({
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
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

const todaySchedulesData: TodayMedicationSchedulesResponse = {
  date: "2026-05-19",
  summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
  schedules: [
    {
      takeTime: "08:00",
      prescriptionId: 1,
      prescriptionTitle: "아침약",
      drugCount: 1,
      recordIds: [1],
      displayStatus: "NEED_TAKE",
    },
    {
      takeTime: "08:00",
      prescriptionId: 1,
      prescriptionTitle: "아침약",
      drugCount: 1,
      recordIds: [2],
      displayStatus: "NEED_TAKE",
    },
  ],
};

describe("api/queries/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockGetQueryData.mockReturnValue(todaySchedulesData);
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

  it("단건 복약 기록 mutation은 onMutate에서 낙관적 업데이트 후 onSettled에서 무효화한다", async () => {
    const { result } = renderHook(() => useUpdateMedicationRecordMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: { recordId: number; body: { status: "SUCCESS" } }) => Promise<unknown>;
      onMutate: (params: { recordId: number; body: { status: "SUCCESS" } }) => Promise<{
        previousData: TodayMedicationSchedulesResponse | undefined;
      }>;
      onError: (
        error: unknown,
        params: { recordId: number; body: { status: "SUCCESS" } },
        context: { previousData: TodayMedicationSchedulesResponse | undefined },
      ) => void;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn({ recordId: 1, body: { status: "SUCCESS" } });
    expect(mockUpdateMedicationRecord).toHaveBeenCalledWith(1, { status: "SUCCESS" });

    const context = await mutation.onMutate({ recordId: 1, body: { status: "SUCCESS" } });
    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      expect.objectContaining({
        summary: expect.objectContaining({ completedCount: 1 }),
      }),
    );

    mutation.onError(new Error("failed"), { recordId: 1, body: { status: "SUCCESS" } }, context);
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      todaySchedulesData,
    );

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
  });

  it("복수 recordId mutation은 onMutate에서 일괄 낙관적 업데이트하고 부분 실패 시 성공분만 유지한다", async () => {
    mockUpdateMedicationRecord
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useMarkMedicationRecordsMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: {
        recordIds: readonly number[];
        body: { status: "SUCCESS" };
      }) => Promise<PromiseSettledResult<unknown>[]>;
      onMutate: (params: {
        recordIds: readonly number[];
        body: { status: "SUCCESS" };
      }) => Promise<{ previousData: TodayMedicationSchedulesResponse | undefined }>;
      onSuccess: (
        results: PromiseSettledResult<unknown>[],
        params: { recordIds: readonly number[]; body: { status: "SUCCESS" } },
        context: { previousData: TodayMedicationSchedulesResponse | undefined },
      ) => void;
      onSettled: () => Promise<void>;
    };

    const results = await mutation.mutationFn({
      recordIds: [1, 2],
      body: { status: "SUCCESS" },
    });
    expect(results).toHaveLength(2);

    const context = await mutation.onMutate({ recordIds: [1, 2], body: { status: "SUCCESS" } });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      expect.objectContaining({
        summary: expect.objectContaining({ completedCount: 2 }),
      }),
    );

    mutation.onSuccess(results, { recordIds: [1, 2], body: { status: "SUCCESS" } }, context);
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      expect.objectContaining({
        summary: expect.objectContaining({ completedCount: 1 }),
      }),
    );

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.todayMedicationSchedules,
    });
  });

  it("복수 recordId mutation은 전부 실패하면 onError에서 롤백한다", async () => {
    mockUpdateMedicationRecord.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMarkMedicationRecordsMutation());
    const mutation = result.current as unknown as {
      mutationFn: (params: {
        recordIds: readonly number[];
        body: { status: "SUCCESS" };
      }) => Promise<unknown>;
      onMutate: (params: {
        recordIds: readonly number[];
        body: { status: "SUCCESS" };
      }) => Promise<{ previousData: TodayMedicationSchedulesResponse | undefined }>;
      onError: (
        error: unknown,
        params: { recordIds: readonly number[]; body: { status: "SUCCESS" } },
        context: { previousData: TodayMedicationSchedulesResponse | undefined },
      ) => void;
    };

    const context = await mutation.onMutate({ recordIds: [1, 2], body: { status: "SUCCESS" } });

    await expect(
      mutation.mutationFn({ recordIds: [1, 2], body: { status: "SUCCESS" } }),
    ).rejects.toThrow("network error");

    mutation.onError(
      new Error("network error"),
      { recordIds: [1, 2], body: { status: "SUCCESS" } },
      context,
    );
    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      queryKeys.dashboard.todayMedicationSchedules,
      todaySchedulesData,
    );
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
