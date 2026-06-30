import { fireEvent, render } from "@testing-library/react-native";
import type { DashboardScheduleCardItem } from "../../useDashboardViewModel";
import { TodayScheduleCard } from "../TodayScheduleCard";

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

const BASE_ITEM: DashboardScheduleCardItem = {
  id: "1",
  scheduledTime: "08:00",
  prescriptionCount: 2,
  prescriptions: [
    {
      id: "1-08:00-1",
      prescriptionId: 1,
      prescriptionTitle: "아침 복약",
      medicationCount: 3,
      medicationNames: ["타이레놀", "타이레놀", "아목시실린"],
      recordIds: [1, 2, 3],
      canMarkAsTaken: true,
    },
    {
      id: "2-08:00-2",
      prescriptionId: 2,
      prescriptionTitle: "비타민 종합",
      medicationCount: 1,
      medicationNames: ["비타민C"],
      recordIds: [4],
      canMarkAsTaken: false,
    },
  ],
  statusLabel: "복용 필요",
  tone: "required",
};

describe("TodayScheduleCard", () => {
  const mockOnPressTake = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("기본 정보와 상태 배지를 렌더링한다", () => {
    const { getByText } = render(
      <TodayScheduleCard
        item={BASE_ITEM}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    expect(getByText("08:00")).toBeTruthy();
    expect(getByText("2개 처방전")).toBeTruthy();
    expect(getByText("📋 아침 복약")).toBeTruthy();
    expect(getByText("3개 약물")).toBeTruthy();
    expect(getByText("📋 비타민 종합")).toBeTruthy();
    expect(getByText("1개 약물")).toBeTruthy();
    expect(getByText("복용 필요")).toBeTruthy();
  });

  it("상세 보기 버튼을 누르면 약물 목록을 펼친다", () => {
    const { getByLabelText, getAllByText, getByText } = render(
      <TodayScheduleCard
        item={BASE_ITEM}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    fireEvent.press(getByLabelText("아침 복약 복약 상세 보기"));

    expect(getAllByText("타이레놀")).toHaveLength(2);
    expect(getByText("아목시실린")).toBeTruthy();
  });

  it("약물 목록이 없으면 빈 상태 문구를 표시한다", () => {
    const { getByLabelText, getByText } = render(
      <TodayScheduleCard
        item={{
          ...BASE_ITEM,
          prescriptions: [{ ...BASE_ITEM.prescriptions[0], medicationNames: [] }],
        }}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    fireEvent.press(getByLabelText("아침 복약 복약 상세 보기"));
    expect(getByText("약물 정보가 없습니다.")).toBeTruthy();
  });

  it("복약 가능 처방에만 완료 버튼을 표시하고 이벤트를 전달한다", () => {
    const { getByLabelText, queryByLabelText } = render(
      <TodayScheduleCard
        item={BASE_ITEM}
        takingPrescriptionId={null}
        onPressTake={mockOnPressTake}
      />,
    );

    fireEvent.press(getByLabelText("아침 복약 복약 완료"));

    expect(mockOnPressTake).toHaveBeenCalledWith(BASE_ITEM.prescriptions[0]);
    expect(queryByLabelText("비타민 종합 복약 완료")).toBeNull();
  });
});
