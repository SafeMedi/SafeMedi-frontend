import { renderHook } from "@testing-library/react-native";

import { useMedicationStatistics as useMedicationStatisticsQuery } from "@/api/queries/dashboard";
import {
  buildMedicationReportWeeklyCompliance,
  getMedicationReportMonthRange,
  getMedicationReportWeekRange,
  mapMedicationReportCautionIngredients,
  mapMedicationReportMonthlyAchievements,
  resolveMedicationReportConsultationMessage,
} from "../medicationReportStatistics";
import { useMedicationStatisticsViewModel } from "../useMedicationStatisticsViewModel";

describe("medicationReportStatistics", () => {
  it("현재 주의 월요일부터 오늘까지 범위를 계산한다", () => {
    expect(getMedicationReportWeekRange(new Date("2026-04-08T00:00:00"))).toEqual({
      startDate: "2026-04-06",
      endDate: "2026-04-08",
      weekStart: new Date("2026-04-06T00:00:00"),
    });
  });

  it("월간 통계 조회 범위를 계산한다", () => {
    expect(getMedicationReportMonthRange(new Date("2026-04-08T00:00:00"))).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-08",
    });
  });

  it("주간 복약 이행률 행을 요일 순서로 변환한다", () => {
    const weekRange = getMedicationReportWeekRange(new Date("2026-04-08T00:00:00"));

    const rows = buildMedicationReportWeeklyCompliance(
      [
        { date: "2026-04-06", takenCount: 17, totalCount: 20, fraction: "17/20" },
        { date: "2026-04-07", takenCount: 9, totalCount: 10, fraction: "9/10" },
      ],
      weekRange.weekStart,
      new Date("2026-04-08T00:00:00"),
    );

    expect(rows[0]).toEqual({
      dayLabel: "월요일",
      rate: 85,
      tone: "warning",
    });
    expect(rows[1]).toEqual({
      dayLabel: "화요일",
      rate: 90,
      tone: "success",
    });
    expect(rows[2]).toEqual({
      dayLabel: "수요일",
      rate: 0,
      tone: "warning",
    });
    expect(rows[3]).toEqual({
      dayLabel: "목요일",
      rate: null,
      tone: "future",
    });
  });

  it("주의 성분과 상담/성과 메시지를 화면 모델로 변환한다", () => {
    const statistics = {
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      totalScheduled: 10,
      totalTaken: 8,
      totalComplianceRate: 80,
      dailyCompliance: [],
      cautionIngredients: [
        {
          ingredientName: "아세트아미노펜",
          monthlyIntakeCount: 12,
          riskLevel: "CAUTION" as const,
        },
      ],
      consultationMessage: "의사 상담이 필요합니다.",
      monthlyAchievements: [{ message: "연속 7일 완벽한 복약 달성!" }],
    };

    expect(mapMedicationReportCautionIngredients(statistics.cautionIngredients)).toEqual([
      {
        id: "아세트아미노펜-CAUTION-12",
        name: "아세트아미노펜",
        monthlyIntakeCount: 12,
        riskLevel: "CAUTION",
        riskLabel: "주의",
      },
    ]);
    expect(resolveMedicationReportConsultationMessage(statistics)).toBe("의사 상담이 필요합니다.");
    expect(mapMedicationReportMonthlyAchievements(statistics)).toEqual([
      "연속 7일 완벽한 복약 달성!",
    ]);
  });
});

const mockUseMedicationStatisticsQuery = useMedicationStatisticsQuery as jest.MockedFunction<
  typeof useMedicationStatisticsQuery
>;
const mockRefetchStatistics = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useMedicationStatistics: jest.fn(),
}));

describe("useMedicationStatisticsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatisticsQuery>);
  });

  it("통계 탭 데이터를 API 응답에서 변환한다", () => {
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: {
        startDate: "2026-04-06",
        endDate: "2026-04-12",
        totalScheduled: 74,
        totalTaken: 66,
        totalComplianceRate: 89.2,
        dailyCompliance: [
          { date: "2026-04-06", takenCount: 17, totalCount: 20, fraction: "17/20" },
          { date: "2026-04-07", takenCount: 9, totalCount: 10, fraction: "9/10" },
        ],
        cautionIngredients: [
          {
            ingredientName: "이부프로펜",
            monthlyIntakeCount: 8,
            riskLevel: "DANGER",
          },
        ],
        consultationMessage: "정기 검진 시 복용 중인 약물 목록을 의사에게 알려주세요.",
        monthlyAchievements: [{ message: "이번 달 평균 이행률 목표(80%) 초과" }],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatisticsQuery>);

    const { result } = renderHook(() =>
      useMedicationStatisticsViewModel(new Date("2026-04-08T00:00:00")),
    );

    expect(result.current.weeklyCompliance[0]).toEqual({
      dayLabel: "월요일",
      rate: 85,
      tone: "warning",
    });
    expect(result.current.cautionIngredients[0]).toEqual(
      expect.objectContaining({
        name: "이부프로펜",
        monthlyIntakeCount: 8,
        riskLabel: "위험",
      }),
    );
    expect(result.current.consultationMessage).toBe(
      "정기 검진 시 복용 중인 약물 목록을 의사에게 알려주세요.",
    );
    expect(result.current.monthlyAchievements).toEqual(["이번 달 평균 이행률 목표(80%) 초과"]);
  });

  it("로딩과 에러 상태를 전달하고 refetch를 호출한다", async () => {
    mockUseMedicationStatisticsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockRefetchStatistics,
    } as unknown as ReturnType<typeof useMedicationStatisticsQuery>);

    const { result } = renderHook(() => useMedicationStatisticsViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockRefetchStatistics).toHaveBeenCalledTimes(2);
  });
});
