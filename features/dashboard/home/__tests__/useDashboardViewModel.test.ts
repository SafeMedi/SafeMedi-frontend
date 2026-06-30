import { renderHook } from "@testing-library/react-native";
import { useDashboardTodayMedicationSchedules } from "@/api/queries/dashboard";
import { usePrescriptionsQuery } from "@/api/queries/prescriptions";
import { useDashboardViewModel } from "../useDashboardViewModel";

const mockUseDashboardTodayMedicationSchedules =
  useDashboardTodayMedicationSchedules as jest.MockedFunction<
    typeof useDashboardTodayMedicationSchedules
  >;
const mockUsePrescriptionsQuery = usePrescriptionsQuery as jest.MockedFunction<
  typeof usePrescriptionsQuery
>;

const mockTodayRefetch = jest.fn(async () => ({}));
const mockPrescriptionsRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardTodayMedicationSchedules: jest.fn(),
}));
jest.mock("@/api/queries/prescriptions", () => ({
  usePrescriptionsQuery: jest.fn(),
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
    mockUsePrescriptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);
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
            drugNames: ["타이레놀", "오메프라졸"],
            recordIds: [1, 2],
            displayStatus: "NEED_TAKE",
          },
          {
            takeTime: "08:00",
            prescriptionTitle: "위장약",
            prescriptionId: 3,
            drugCount: 1,
            drugNames: ["판토프라졸"],
            recordIds: [4],
            displayStatus: "NEED_TAKE",
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
    mockUsePrescriptionsQuery.mockReturnValue({
      data: {
        prescriptions: [
          {
            prescriptionId: 1,
            title: "아침약",
            drugCount: 2,
            hasAllergyConflict: true,
            medications: [
              {
                medicationId: 101,
                atcCode: "N02BE01",
                drugName: "타이레놀",
                takeTimes: ["08:00"],
                mainIngredient: "아세트아미노펜",
                hasWarning: false,
              },
              {
                medicationId: 102,
                atcCode: "A02BC01",
                drugName: "오메프라졸",
                takeTimes: ["08:00"],
                mainIngredient: "오메프라졸",
                hasWarning: false,
              },
            ],
          },
          {
            prescriptionId: 2,
            title: "저녁약",
            drugCount: 1,
            hasAllergyConflict: false,
            medications: [
              {
                medicationId: 201,
                atcCode: "C08CA01",
                drugName: "암로디핀",
                takeTimes: ["20:00"],
                mainIngredient: "암로디핀",
                hasWarning: false,
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.adherenceRate).toBe(70);
    expect(result.current.adherenceSummaryText).toBe("7 / 10 완료");
    expect(result.current.scheduleCards).toHaveLength(2);
    expect(result.current.scheduleCards[0]?.tone).toBe("required");
    expect(result.current.scheduleCards[0]?.scheduledTime).toBe("08:00");
    expect(result.current.scheduleCards[0]?.prescriptionCount).toBe(2);
    expect(result.current.scheduleCards[0]?.prescriptions).toEqual([
      {
        id: "1-08:00-1-2",
        prescriptionId: 1,
        prescriptionTitle: "아침약",
        medicationCount: 2,
        medicationNames: ["타이레놀", "오메프라졸"],
      },
      {
        id: "3-08:00-4",
        prescriptionId: 3,
        prescriptionTitle: "위장약",
        medicationCount: 1,
        medicationNames: ["판토프라졸"],
      },
    ]);
    expect(result.current.scheduleCards[1]?.statusLabel).toBe("완료");
    expect(result.current.scheduleRemainingCount).toBe(1);
    expect(result.current.recentPrescriptions[0]?.prescriptionId).toBe(1);
    expect(result.current.recentPrescriptions[0]?.dateLabel).toBe("아침약");
    expect(result.current.recentPrescriptions[0]?.analysisCount).toBe(2);
    expect(result.current.recentPrescriptions[0]?.hasWarning).toBe(true);
  });

  it("로딩/에러 상태를 반영하고 refetch를 병렬로 호출한다", async () => {
    mockUseDashboardTodayMedicationSchedules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockTodayRefetch,
    } as unknown as ReturnType<typeof useDashboardTodayMedicationSchedules>);
    mockUsePrescriptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockPrescriptionsRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);

    const { result } = renderHook(() => useDashboardViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockTodayRefetch).toHaveBeenCalledTimes(1);
    expect(mockPrescriptionsRefetch).toHaveBeenCalledTimes(1);
  });
});
