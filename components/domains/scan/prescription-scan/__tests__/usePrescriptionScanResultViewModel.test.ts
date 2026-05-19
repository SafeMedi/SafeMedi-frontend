import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { DrugSearchItem } from "@/api/types";
import type { PrescriptionOcrResult } from "../usePrescriptionOcrResultStore";
import { usePrescriptionScanResultViewModel } from "../usePrescriptionScanResultViewModel";

const mockClearResult = jest.fn();
const mockMutateAsync = jest.fn();

let mockResult: PrescriptionOcrResult | null = {
  imageUri: "file://image.png",
  draft: {
    title: "스캔 처방전",
    startDate: "2026-05-01",
    endDate: "2026-05-07",
    takeTimes: ["08:00"],
    medications: [{ atcCode: "A01", drugName: "타이레놀" }],
    rawText: "타이레놀",
  },
};

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("@/api/error", () => ({
  parseApiError: jest.fn(),
}));

jest.mock("@/api/queries/prescription-scan", () => ({
  useCreatePrescriptionByScanMutation: jest.fn(),
}));

jest.mock("../usePrescriptionOcrResultStore", () => ({
  usePrescriptionOcrResultStore: (
    selector: (state: { result: PrescriptionOcrResult | null; clearResult: () => void }) => unknown,
  ) =>
    selector({
      result: mockResult,
      clearResult: mockClearResult,
    }),
}));

describe("usePrescriptionScanResultViewModel", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockResult = {
      imageUri: "file://image.png",
      draft: {
        title: "스캔 처방전",
        startDate: "2026-05-01",
        endDate: "2026-05-07",
        takeTimes: ["08:00"],
        medications: [{ atcCode: "A01", drugName: "타이레놀" }],
        rawText: "타이레놀",
      },
    };
    (
      useCreatePrescriptionByScanMutation as jest.MockedFunction<
        typeof useCreatePrescriptionByScanMutation
      >
    ).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePrescriptionByScanMutation>);
    (parseApiError as jest.MockedFunction<typeof parseApiError>).mockResolvedValue({
      message: "등록 실패",
    });
  });

  afterAll(() => {
    mockAlert.mockRestore();
  });

  it("결과가 없으면 스캔 화면으로 이동 알림을 노출한다", () => {
    mockResult = null;

    renderHook(() => usePrescriptionScanResultViewModel());

    expect(mockAlert).toHaveBeenCalledWith(
      "스캔 결과 없음",
      "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.",
      expect.any(Array),
    );
  });

  it("약물 추가/수정 관련 핸들러가 폼 상태를 갱신한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handlePressAddMedication();
    });
    expect(result.current.fields).toHaveLength(2);
    expect(result.current.editingMedicationIndex).toBe(1);

    const selectedDrug: DrugSearchItem = {
      atcCode: "N02BE01",
      drugName: "아세트아미노펜",
      company: "SAFE",
    };
    await act(async () => {
      result.current.handleSelectMedicationDrug(1, selectedDrug);
      result.current.handleChangeMedicationDosage(1, "1정");
      result.current.handleToggleMedicationTakeSlot(1, "DINNER");
      result.current.handlePressCompleteMedicationEdit();
    });

    expect(result.current.editingMedicationIndex).toBeNull();
  });

  it("약물명을 직접 변경하면 ATC 코드가 초기화되어 분석 시 안내 알림을 띄운다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleChangeMedicationName(0, "직접입력약");
      result.current.handleChangeMedicationDosage(0, "1정");
      await result.current.handlePressAnalyze();
    });

    expect(mockAlert).toHaveBeenCalledWith("입력 확인", "약물명은 검색 결과에서 선택해야 합니다.");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("유효한 입력이면 복약 등록 API를 호출한다", async () => {
    mockMutateAsync.mockResolvedValue({
      message: "등록 완료",
      hasAllergyConflict: false,
      allergyWarnings: [],
    });

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleChangeMedicationDosage(0, "1정");
      await result.current.handlePressAnalyze();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      title: "스캔 처방전",
      startDate: "2026-05-01",
      endDate: "2026-05-07",
      takeTimes: ["08:00"],
      medications: [
        {
          atcCode: "A01",
          drugName: "타이레놀",
          dosage: "1정",
          takeTimes: ["08:00"],
        },
      ],
    });
    expect(mockAlert).toHaveBeenCalledWith("복약 등록 완료", "등록 완료", expect.any(Array));
  });

  it("복약 등록 실패 시 파싱된 에러 메시지를 안내한다", async () => {
    mockMutateAsync.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handleChangeMedicationDosage(0, "1정");
      await result.current.handlePressAnalyze();
    });

    expect(parseApiError).toHaveBeenCalledTimes(1);
    expect(mockAlert).toHaveBeenCalledWith("복약 등록 실패", "등록 실패");
  });

  it("다시 스캔하기를 누르면 결과를 비우고 스캔 화면으로 이동한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanResultViewModel());

    await act(async () => {
      result.current.handlePressRetryScan();
    });

    expect(mockClearResult).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/scan/scan");
  });
});
