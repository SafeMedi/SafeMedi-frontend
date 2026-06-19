import { renderHook } from "@testing-library/react-native";
import { useDashboardMedicationHistoryRecords } from "@/api/queries/dashboard";
import { useMedicationHistoryViewModel } from "../useMedicationHistoryViewModel";

const mockUseDashboardMedicationHistoryRecords =
  useDashboardMedicationHistoryRecords as jest.MockedFunction<
    typeof useDashboardMedicationHistoryRecords
  >;
const mockRefetch = jest.fn(async () => ({}));

jest.mock("@/api/queries/dashboard", () => ({
  useDashboardMedicationHistoryRecords: jest.fn(),
}));

describe("useMedicationHistoryViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardMedicationHistoryRecords.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMedicationHistoryRecords>);
  });

  it("기본 상태에서 빈 데이터와 기본 날짜 라벨을 제공한다", () => {
    const { result } = renderHook(() => useMedicationHistoryViewModel(undefined));

    expect(result.current.displayDate).toBe("-");
    expect(result.current.warningSummary).toBeNull();
    expect(result.current.medications).toEqual([]);
  });

  it("기록 데이터를 가공해 medication 아이템과 경고 요약을 만든다", () => {
    mockUseDashboardMedicationHistoryRecords.mockReturnValue({
      data: {
        items: [
          {
            recordId: 1,
            scheduledTime: "09:00",
            medicationNames: ["A", "B", "A"],
            prescriptionTitle: "아침약",
            status: "OVERDUE",
            warningMessages: ["주의 필요"],
          },
          {
            recordId: 2,
            scheduledTime: "20:00",
            medicationNames: ["C"],
            prescriptionTitle: "저녁약",
            status: "SUCCESS",
            warningMessages: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMedicationHistoryRecords>);

    const { result } = renderHook(() => useMedicationHistoryViewModel("2026-05-19"));

    expect(result.current.displayDate).not.toBe("-");
    expect(result.current.warningSummary).toContain("경고");
    expect(result.current.medications[0]?.tone).toBe("warning");
    expect(result.current.medications[0]?.activeIngredients).toEqual(["A", "B"]);
    expect(result.current.medications[1]?.tone).toBe("safe");
  });

  it("경고 메시지가 없는 DUE 상태에는 기본 경고 문구를 생성한다", () => {
    mockUseDashboardMedicationHistoryRecords.mockReturnValue({
      data: {
        items: [
          {
            recordId: 5,
            scheduledTime: "13:00",
            medicationNames: ["A"],
            prescriptionTitle: "점심약",
            status: "DUE",
            warningMessages: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useDashboardMedicationHistoryRecords>);

    const { result } = renderHook(() => useMedicationHistoryViewModel("2026-05-18"));

    expect(result.current.medications[0]?.warningItems[0]?.message).toContain("복용 필요 상태");
  });
});
