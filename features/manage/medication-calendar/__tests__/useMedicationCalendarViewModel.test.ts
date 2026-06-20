import { act, renderHook } from "@testing-library/react-native";

import { useDashboardMonthlyMedicationRecords } from "@/api/queries/dashboard";
import {
  buildMedicationCalendarWeeks,
  countMedicationCalendarDayBuckets,
  resolveDefaultSelectedDate,
  useMedicationCalendarViewModel,
} from "../useMedicationCalendarViewModel";

const mockUseDashboardMonthlyMedicationRecords =
  useDashboardMonthlyMedicationRecords as jest.MockedFunction<
    typeof useDashboardMonthlyMedicationRecords
  >;
const mockRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardMonthlyMedicationRecords: jest.fn(),
}));

const mockRecords = [
  {
    date: "2026-04-06",
    items: [
      {
        recordId: 500,
        prescriptionTitle: "신장내과 처방전",
        medicationNames: ["타이레놀정 500mg"],
        scheduledTime: "08:00",
        takenTime: "08:05",
        status: "SUCCESS" as const,
      },
      {
        recordId: 501,
        prescriptionTitle: "신장내과 처방전",
        medicationNames: ["오메프라졸캡슐 20mg"],
        scheduledTime: "08:00",
        takenTime: "08:10",
        status: "SUCCESS" as const,
      },
      {
        recordId: 502,
        prescriptionTitle: "심장내과 처방전",
        medicationNames: ["암로디핀정 5mg"],
        scheduledTime: "14:00",
        takenTime: null,
        status: "OVERDUE" as const,
      },
    ],
  },
  {
    date: "2026-04-07",
    items: [
      {
        recordId: 503,
        prescriptionTitle: "감기약",
        medicationNames: ["타이레놀 500mg"],
        scheduledTime: "08:00",
        takenTime: "08:01",
        status: "SUCCESS" as const,
      },
      {
        recordId: 504,
        prescriptionTitle: "감기약",
        medicationNames: ["플루티카손"],
        scheduledTime: "20:00",
        takenTime: null,
        status: "UPCOMING" as const,
      },
    ],
  },
];

describe("useMedicationCalendarViewModel helpers", () => {
  it("캘린더 주간 그리드를 생성한다", () => {
    const recordsByDate = new Map(mockRecords.map((record) => [record.date, record]));
    const weeks = buildMedicationCalendarWeeks({
      monthDate: new Date("2026-04-01T00:00:00"),
      today: new Date("2026-04-10T00:00:00"),
      recordsByDate,
    });

    const aprilSix = weeks.flat().find((day) => day.date === "2026-04-06");
    const aprilSeven = weeks.flat().find((day) => day.date === "2026-04-07");

    expect(aprilSix).toEqual(
      expect.objectContaining({ day: 6, fraction: "2/3", rate: 67, tone: "red" }),
    );
    expect(aprilSeven).toEqual(
      expect.objectContaining({ day: 7, fraction: "1/2", rate: 50, tone: "red" }),
    );
  });

  it("완벽한 날과 주의 필요 일수를 계산한다", () => {
    expect(countMedicationCalendarDayBuckets(mockRecords)).toEqual({
      perfectDaysCount: 0,
      attentionDaysCount: 2,
    });
  });

  it("기본 선택 날짜를 오늘 또는 최근 기록일로 결정한다", () => {
    expect(resolveDefaultSelectedDate(mockRecords, new Date("2026-04-06T00:00:00"))).toBe(
      "2026-04-06",
    );
    expect(resolveDefaultSelectedDate(mockRecords, new Date("2026-04-08T00:00:00"))).toBe(
      "2026-04-07",
    );
  });
});

describe("useMedicationCalendarViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);
  });

  it("월간 복약 데이터를 캘린더 화면 모델로 변환한다", () => {
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: {
        period: "2026-04",
        summary: {
          totalCount: 9,
          takenCount: 8,
          fraction: "8/9",
          successRate: 89,
        },
        records: mockRecords,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-06T00:00:00")),
    );

    expect(result.current.complianceRate).toBe(89);
    expect(result.current.perfectDaysCount).toBe(0);
    expect(result.current.attentionDaysCount).toBe(2);
    expect(result.current.selectedDate).toBe("2026-04-06");
    expect(result.current.selectedDateTitle).toBe("2026-04-06 복약 기록");
    expect(result.current.selectedDaySummary).toBe("2/3 완료 (67%)");
    expect(result.current.prescriptionGroups).toHaveLength(2);
    expect(result.current.prescriptionGroups[0]?.prescriptionTitle).toBe("신장내과 처방전");
  });

  it("기록이 없는 과거 날짜도 선택 상태와 빈 기록 화면 모델을 유지한다", () => {
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: {
        period: "2026-04",
        summary: {
          totalCount: 9,
          takenCount: 8,
          fraction: "8/9",
          successRate: 89,
        },
        records: mockRecords,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-10T00:00:00")),
    );

    act(() => {
      result.current.setSelectedDate("2026-04-08");
    });

    expect(result.current.selectedDate).toBe("2026-04-08");
    expect(result.current.selectedDateTitle).toBe("2026-04-08 복약 기록");
    expect(result.current.selectedDaySummary).toBe("0/0 완료 (0%)");
    expect(result.current.prescriptionGroups).toHaveLength(0);
  });

  it("예정 상태는 미복용이 아닌 대기 상태로 표시한다", () => {
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: {
        period: "2026-04",
        summary: {
          totalCount: 9,
          takenCount: 8,
          fraction: "8/9",
          successRate: 89,
        },
        records: mockRecords,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

    const { result } = renderHook(() =>
      useMedicationCalendarViewModel(new Date("2026-04-07T00:00:00")),
    );

    expect(result.current.prescriptionGroups[0]?.items[1]).toEqual(
      expect.objectContaining({
        status: "UPCOMING",
        statusLabel: "대기중",
        statusTone: "upcoming",
        isTaken: false,
      }),
    );
  });

  it("로딩과 에러 상태를 전달하고 refetch를 호출한다", async () => {
    mockUseDashboardMonthlyMedicationRecords.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMonthlyMedicationRecords>);

    const { result } = renderHook(() => useMedicationCalendarViewModel());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
