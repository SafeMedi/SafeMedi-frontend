import { renderHook } from "@testing-library/react-native";
import { useDashboardTodayMedicationSchedules } from "@/api/queries/dashboard";
import { useDashboardViewModel } from "../useDashboardViewModel";

const mockUseDashboardTodayMedicationSchedules =
  useDashboardTodayMedicationSchedules as jest.MockedFunction<
    typeof useDashboardTodayMedicationSchedules
  >;

const mockTodayRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardTodayMedicationSchedules: jest.fn(),
}));

describe("useDashboardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);
  });

  it("데이터가 없으면 기본값을 반환한다", () => {
    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(0);
    expect(result.current.adherenceSummaryText).toBe("0 / 0 완료");
    expect(result.current.scheduleCards).toEqual([]);
    expect(result.current.recentPrescriptions).toEqual([]);
    expect(result.current.scheduleRemainingCount).toBe(0);
  });

  it("오늘 스케줄 데이터가 있으면 카드와 최근 처방 정보를 계산한다", () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: {
        date: "2026-05-19",
        summary: { totalCount: 10, completedCount: 7, completionRate: 70 },
        schedules: [
          {
            takeTime: "08:00",
            prescriptionTitle: "아침약",
            prescriptionId: 1,
            drugCount: 2,
            recordIds: [1, 2],
            status: "NEED_TAKE",
          },
          {
            takeTime: "20:00",
            prescriptionTitle: "저녁약",
            prescriptionId: 2,
            drugCount: 1,
            recordIds: [3],
            status: "SUCCESS",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(70);
    expect(result.current.adherenceSummaryText).toBe("7 / 10 완료");
    expect(result.current.scheduleCards[0]?.tone).toBe("required");
    expect(result.current.scheduleCards[1]?.statusLabel).toBe("완료");
    expect(result.current.scheduleRemainingCount).toBe(1);
    expect(result.current.recentPrescriptions[0]?.analysisCount).toBe(3);
    expect(result.current.recentPrescriptions[0]?.hasWarning).toBe(true);
  });

  it("로딩/에러 상태를 반영하고 refetch를 병렬로 호출한다", async () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockTodayRefetch).toHaveBeenCalledTimes(1);
  });
});
