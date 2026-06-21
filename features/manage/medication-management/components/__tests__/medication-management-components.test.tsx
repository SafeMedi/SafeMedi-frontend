import { fireEvent, render } from "@testing-library/react-native";

import { useSearchDrugsQuery } from "@/api/queries/drugs";
import { MedicationManagementInlineEditor } from "../MedicationManagementInlineEditor";
import { MedicationManagementItemCard } from "../MedicationManagementItemCard";
import { MedicationPrescriptionGroupCard } from "../MedicationPrescriptionGroupCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("@/api/queries/drugs", () => ({
  useSearchDrugsQuery: jest.fn(),
}));

const mockUseSearchDrugsQuery = useSearchDrugsQuery as jest.MockedFunction<
  typeof useSearchDrugsQuery
>;

const medication = {
  id: "101",
  medicationId: 101,
  drugName: "타이레놀정 500mg",
  takeTimesLabel: "08:00, 18:00 복용",
  mainIngredient: "아세트아미노펜",
  hasWarning: false,
  warningMessage: null,
} as const;

const draft = {
  drugName: "타이레놀",
  atcCode: "N02BE01",
  takeSlots: ["MORNING"] as const,
  originalTakeTimes: ["08:00"],
  hasChangedTakeSlots: false,
} as const;

describe("MedicationManagementInlineEditor", () => {
  const onChangeDrugName = jest.fn();
  const onSelectDrug = jest.fn();
  const onToggleTakeSlot = jest.fn();
  const onCancel = jest.fn();
  const onSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchDrugsQuery.mockReturnValue({
      data: [
        {
          atcCode: "N02BE01",
          drugName: "타이레놀정 650mg",
          company: "한미약품",
        },
      ],
      isFetching: false,
    } as unknown as ReturnType<typeof useSearchDrugsQuery>);
  });

  it("검색 결과 선택, 복약 시간, 저장 및 취소 이벤트를 전달한다", () => {
    const { getByLabelText, getByPlaceholderText, getByText } = render(
      <MedicationManagementInlineEditor
        draft={draft}
        isSaveEnabled
        isSaving={false}
        onChangeDrugName={onChangeDrugName}
        onSelectDrug={onSelectDrug}
        onToggleTakeSlot={onToggleTakeSlot}
        onCancel={onCancel}
        onSave={onSave}
      />,
    );

    const input = getByPlaceholderText("약물명을 한글로 입력 후 목록에서 선택");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "타이레놀정");
    fireEvent(getByText("타이레놀정 650mg"), "pressIn");
    fireEvent.press(getByText("☀ 점심"));
    fireEvent.press(getByLabelText("수정 저장"));
    fireEvent.press(getByLabelText("수정 취소"));

    expect(onChangeDrugName).toHaveBeenCalledWith("타이레놀정");
    expect(onSelectDrug).toHaveBeenCalledWith(
      expect.objectContaining({ drugName: "타이레놀정 650mg" }),
    );
    expect(onToggleTakeSlot).toHaveBeenCalledWith("LUNCH");
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("검색 결과 없음, 필수 시간 미선택, 저장 중 상태를 표시한다", () => {
    mockUseSearchDrugsQuery.mockReturnValue({
      data: [],
      isFetching: false,
    } as unknown as ReturnType<typeof useSearchDrugsQuery>);
    const { getByPlaceholderText, getByText, rerender } = render(
      <MedicationManagementInlineEditor
        draft={{ ...draft, takeSlots: [] }}
        isSaveEnabled={false}
        isSaving={false}
        onChangeDrugName={onChangeDrugName}
        onSelectDrug={onSelectDrug}
        onToggleTakeSlot={onToggleTakeSlot}
        onCancel={onCancel}
        onSave={onSave}
      />,
    );

    fireEvent(getByPlaceholderText("약물명을 한글로 입력 후 목록에서 선택"), "focus");
    expect(getByText("검색 결과가 없습니다.")).toBeTruthy();
    expect(getByText("최소 1개 이상의 복약 시간을 선택해주세요.")).toBeTruthy();

    rerender(
      <MedicationManagementInlineEditor
        draft={{ ...draft, takeSlots: [] }}
        isSaveEnabled={false}
        isSaving
        onChangeDrugName={onChangeDrugName}
        onSelectDrug={onSelectDrug}
        onToggleTakeSlot={onToggleTakeSlot}
        onCancel={onCancel}
        onSave={onSave}
      />,
    );
    expect(getByText("저장 중...")).toBeTruthy();
  });
});

describe("MedicationManagementItemCard 및 MedicationPrescriptionGroupCard", () => {
  const callbacks = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCancelEdit: jest.fn(),
    onSaveEdit: jest.fn(),
    onChangeDrugName: jest.fn(),
    onSelectDrug: jest.fn(),
    onToggleTakeSlot: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("약물 카드의 수정·삭제와 경고 표시를 처리한다", () => {
    const { getByLabelText, getByText, rerender } = render(
      <MedicationManagementItemCard
        medication={medication}
        isEditing={false}
        editDraft={null}
        isSaveEnabled={false}
        isSaving={false}
        {...callbacks}
      />,
    );

    fireEvent.press(getByLabelText("타이레놀정 500mg 수정"));
    fireEvent.press(getByLabelText("타이레놀정 500mg 삭제"));
    expect(callbacks.onEdit).toHaveBeenCalledTimes(1);
    expect(callbacks.onDelete).toHaveBeenCalledTimes(1);

    rerender(
      <MedicationManagementItemCard
        medication={{ ...medication, hasWarning: true, warningMessage: "병용 주의가 필요합니다." }}
        isEditing={false}
        editDraft={null}
        isSaveEnabled={false}
        isSaving={false}
        {...callbacks}
      />,
    );
    expect(getByText("경고 사항")).toBeTruthy();
    expect(getByText("병용 주의가 필요합니다.")).toBeTruthy();
  });

  it("처방전 그룹을 확장할 때 약물 카드와 이벤트를 표시한다", () => {
    const onToggleExpanded = jest.fn();
    const onDeletePrescription = jest.fn();
    const onStartEditMedication = jest.fn();
    const onDeleteMedication = jest.fn();
    const props = {
      title: "신장내과 처방전",
      medicationCountLabel: "1개",
      medications: [medication],
      isMedicationEditing: () => false,
      editDraft: null,
      isSaveEditEnabled: false,
      isSaving: false,
      onToggleExpanded,
      onDeletePrescription,
      onStartEditMedication,
      onCancelEditMedication: jest.fn(),
      onSaveEditMedication: jest.fn(),
      onChangeEditDrugName: jest.fn(),
      onSelectEditDrug: jest.fn(),
      onToggleEditTakeSlot: jest.fn(),
      onDeleteMedication,
    };
    const { getAllByLabelText, getByLabelText, getByText, rerender } = render(
      <MedicationPrescriptionGroupCard {...props} isExpanded={false} />,
    );

    expect(getByText("📋 신장내과 처방전")).toBeTruthy();
    fireEvent.press(getAllByLabelText("신장내과 처방전 펼치기")[0]);
    fireEvent.press(getByLabelText("신장내과 처방전 처방전 삭제"));
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    expect(onDeletePrescription).toHaveBeenCalledTimes(1);

    rerender(<MedicationPrescriptionGroupCard {...props} isExpanded />);
    fireEvent.press(getByLabelText("타이레놀정 500mg 수정"));
    fireEvent.press(getByLabelText("타이레놀정 500mg 삭제"));
    expect(onStartEditMedication).toHaveBeenCalledWith(101);
    expect(onDeleteMedication).toHaveBeenCalledWith(101, "타이레놀정 500mg");
  });
});
