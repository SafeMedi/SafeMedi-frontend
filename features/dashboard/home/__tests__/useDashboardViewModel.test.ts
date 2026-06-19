import { renderHook } from "@testing-library/react-native";
import {
  useDashboardDailyMedicationRecords,
  useDashboardMonthlyMedicationRecords,
} from "@/api/queries/dashboard";
import { useDashboardViewModel } from "../useDashboardViewModel";

const mockUseDashboardDailyMedicationRecords =
  useDashboardDailyMedicationRecords as jest.MockedFunction<
    typeof useDashboardDailyMedicationRecords
  >;
const mockUseDashboardMonthlyMedicationRecords =
  useDashboardMonthlyMedicationRecords as jest.MockedFunction<
    typeof useDashboardMonthlyMedicationRecords
  >;

const mockDailyRefetch = jest.fn(async () => ({}));
const mockMonthlyRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardDailyMedicationRecords: jest.fn(),
  useDashboardMonthlyMedicationRecords: jest.fn(),
}));

describe("useDashboardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardDailyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockDailyRefetch,
    } as unknown as ReturnType<typeof useDashboardDailyMedicationRecords>);
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockMonthlyRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);
  });

  it("데이터가 없으면 기본값을 반환한다", () => {
    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(0);
    expect(result.current.adherenceSummaryText).toBe("0 / 0 완료");
    expect(result.current.scheduleCards).toEqual([]);
    expect(result.current.recentPrescriptions).toEqual([]);
    expect(result.current.scheduleRemainingCount).toBe(0);
  });

  it("일별/월별 데이터가 있으면 카드와 최근 처방 정보를 계산한다", () => {
    mockUseDashboardDailyMedicationRecords.mockReturnValue({
      data: {
        summary: { totalCount: 10, takenCount: 7, fraction: "7 / 10 완료" },
        records: [
          {
            recordId: 1,
            scheduledTime: "08:00",
            prescriptionTitle: "아침약",
            medicationNames: ["A", "B"],
            status: "DUE",
          },
          {
            recordId: 2,
            scheduledTime: "20:00",
            prescriptionTitle: "저녁약",
            medicationNames: ["C"],
            status: "SUCCESS",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockDailyRefetch,
    } as unknown as ReturnType<typeof useDashboardDailyMedicationRecords>);
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: {
        records: [
          {
            date: "2026-05-19",
            items: [
              { medicationNames: ["A"], status: "DUE" },
              { medicationNames: ["B", "C"], status: "SUCCESS" },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockMonthlyRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

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
    mockUseDashboardDailyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockDailyRefetch,
    } as unknown as ReturnType<typeof useDashboardDailyMedicationRecords>);
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockMonthlyRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockDailyRefetch).toHaveBeenCalledTimes(1);
    expect(mockMonthlyRefetch).toHaveBeenCalledTimes(1);
  });
});
