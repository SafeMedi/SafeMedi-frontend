import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

import {
  useDeletePrescriptionMutation,
  usePrescriptionsQuery,
  useUpdatePrescriptionMutation,
} from "@/api/queries/prescriptions";
import { useMedicationManagementViewModel } from "../useMedicationManagementViewModel";

jest.mock("@/api/queries/prescriptions", () => ({
  usePrescriptionsQuery: jest.fn(),
  useUpdatePrescriptionMutation: jest.fn(),
  useDeletePrescriptionMutation: jest.fn(),
}));

const mockUsePrescriptionsQuery = usePrescriptionsQuery as jest.MockedFunction<
  typeof usePrescriptionsQuery
>;
const mockUseUpdatePrescriptionMutation = useUpdatePrescriptionMutation as jest.MockedFunction<
  typeof useUpdatePrescriptionMutation
>;
const mockUseDeletePrescriptionMutation = useDeletePrescriptionMutation as jest.MockedFunction<
  typeof useDeletePrescriptionMutation
>;

const mockRefetch = jest.fn(async () => ({}));
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();

const prescriptions = [
  {
    prescriptionId: 11,
    title: "신장내과 처방전",
    medications: [
      {
        medicationId: 101,
        atcCode: "N02BE01",
        drugName: "타이레놀정 500mg",
        takeTimes: ["08:00", "18:00", "22:00"],
        mainIngredient: "아세트아미노펜",
        hasWarning: false,
      },
      {
        medicationId: 102,
        atcCode: "A02BC01",
        drugName: "오메프라졸캡슐 20mg",
        takeTimes: ["08:00"],
        mainIngredient: "오메프라졸",
        hasWarning: false,
      },
    ],
  },
  {
    prescriptionId: 12,
    title: "심장내과 처방전",
    medications: [
      {
        medicationId: 201,
        atcCode: "C08CA01",
        drugName: "암로디핀정 5mg",
        takeTimes: ["14:00"],
        mainIngredient: "암로디핀베실산염",
        hasWarning: true,
        warningMessage: "주의가 필요합니다.",
      },
    ],
  },
] as const;

type AlertButton = { readonly text?: string; readonly onPress?: () => void };

function getConfirmButton(): AlertButton {
  const buttons = jest.mocked(Alert.alert).mock.calls[0]?.[2] as readonly AlertButton[] | undefined;
  const button = buttons?.find((item) => item.text === "삭제");
  if (!button?.onPress) {
    throw new Error("삭제 확인 버튼을 찾을 수 없습니다.");
  }
  return button;
}

describe("useMedicationManagementViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockUsePrescriptionsQuery.mockReturnValue({
      data: { prescriptions },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);
    mockUseUpdatePrescriptionMutation.mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdatePrescriptionMutation>);
    mockUseDeletePrescriptionMutation.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeletePrescriptionMutation>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("약물명을 수정해도 시간 슬롯을 변경하지 않으면 기존 시간을 저장한다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());

    act(() => {
      result.current.startEditMedication(11, 101);
    });
    act(() => {
      result.current.changeEditDrugName("타이레놀정 650mg");
    });
    act(() => {
      result.current.selectEditDrug({
        atcCode: "N02BE01",
        drugName: "타이레놀정 650mg",
        company: "한미약품",
      });
    });
    act(() => {
      result.current.saveEditMedication();
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        prescriptionId: 11,
        body: expect.objectContaining({
          medications: expect.arrayContaining([
            expect.objectContaining({ takeTimes: ["08:00", "18:00", "22:00"] }),
          ]),
        }),
      }),
      expect.any(Object),
    );
  });

  it("약물 삭제는 남은 약물이 있으면 처방전 수정 요청을 보낸다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());

    act(() => {
      result.current.handleDeleteMedication(11, 101, "타이레놀정 500mg");
      getConfirmButton().onPress?.();
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        prescriptionId: 11,
        body: {
          medications: [
            { atcCode: "A02BC01", drugName: "오메프라졸캡슐 20mg", takeTimes: ["08:00"] },
          ],
        },
      }),
      expect.any(Object),
    );
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("마지막 약물 삭제는 처방전 삭제 요청을 보낸다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());

    act(() => {
      result.current.handleDeleteMedication(12, 201, "암로디핀정 5mg");
      getConfirmButton().onPress?.();
    });

    expect(mockDeleteMutate).toHaveBeenCalledWith(12, expect.any(Object));
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it("조회 상태와 새로고침 함수를 화면 모델에 전달한다", async () => {
    mockUsePrescriptionsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePrescriptionsQuery>);

    const { result } = renderHook(() => useMedicationManagementViewModel());

    expect(result.current.prescriptionGroups).toHaveLength(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(true);
    await result.current.refetch();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("수정 성공 시 편집을 닫고, 유효하지 않은 입력은 안내한다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());
    act(() => result.current.startEditMedication(11, 101));
    act(() => result.current.changeEditDrugName("직접입력"));
    act(() => result.current.saveEditMedication());
    expect(Alert.alert).toHaveBeenCalledWith("입력 확인", expect.any(String));

    act(() =>
      result.current.selectEditDrug({ atcCode: "N02BE01", drugName: "타이레놀", company: "한미" }),
    );
    act(() => result.current.saveEditMedication());
    const options = mockUpdateMutate.mock.calls[0]?.[1] as { onSuccess?: () => void };
    act(() => options.onSuccess?.());
    expect(result.current.editDraft).toBeNull();
  });

  it("처방전 접기와 처방전 삭제 확인을 처리한다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());
    expect(result.current.isPrescriptionExpanded(11)).toBe(true);
    act(() => result.current.togglePrescriptionExpanded(11));
    expect(result.current.isPrescriptionExpanded(11)).toBe(false);
    act(() => result.current.handleDeletePrescription(11, "신장내과 처방전"));
    getConfirmButton().onPress?.();
    expect(mockDeleteMutate).toHaveBeenCalledWith(11, expect.any(Object));
  });

  it("수정 실패 시 편집 상태를 유지하고 오류를 안내한다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());
    act(() => result.current.startEditMedication(11, 101));
    act(() => result.current.saveEditMedication());
    const options = mockUpdateMutate.mock.calls[0]?.[1] as { onError?: () => void };
    act(() => options.onError?.());
    expect(result.current.editDraft).not.toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith("저장 실패", expect.any(String));
  });

  it("존재하지 않는 약물은 편집하지 않고, 편집 중 삭제는 편집을 닫는다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());

    act(() => result.current.startEditMedication(999, 999));
    expect(result.current.editDraft).toBeNull();

    act(() => result.current.startEditMedication(11, 101));
    act(() => result.current.handleDeleteMedication(11, 101, "타이레놀정 500mg"));

    expect(result.current.editDraft).toBeNull();
  });

  it("수정 시간 슬롯을 전환하고 취소하면 편집 상태를 초기화한다", () => {
    const { result } = renderHook(() => useMedicationManagementViewModel());
    act(() => result.current.startEditMedication(11, 101));
    act(() => result.current.toggleEditTakeSlot("MORNING"));
    expect(result.current.editDraft?.takeSlots).not.toContain("MORNING");
    act(() => result.current.cancelEditMedication());
    expect(result.current.editDraft).toBeNull();
    expect(result.current.editingMedicationKey).toBeNull();
  });
});
