import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { FamilyDetailScreen } from "../FamilyDetailScreen";

type MockFamilyDetail = {
  familyId: number;
  name: string;
  relation: string;
  birthDate: string;
  gender: "M" | "F";
  height: number;
  weight: number;
  bloodType: string;
  diseases: string[];
  allergies: { code: string; name: string }[];
  isAlertConsent: boolean;
  todayMedicationSummary: {
    completedCount: number;
    totalCount: number;
    completionRate: number;
    remainingCount: number;
  };
  todayMedicationSchedules: {
    id: string;
    medicineName: string;
    scheduledTime: string;
    status: "COMPLETED" | "PENDING";
  }[];
};

type MockUseFamilyDetailResult = {
  data?: MockFamilyDetail;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
};

const mockUseFamilyDetail = jest.fn<MockUseFamilyDetailResult, [number | null]>();

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/api/queries/family", () => ({
  useFamilyDetail: (familyId: number | null) => mockUseFamilyDetail(familyId),
}));

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

jest.mock("../components/FamilyScreenHeader", () => ({
  FamilyScreenHeader: ({ title }: { title: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, `헤더:${title}`);
  },
}));

jest.mock("../components/FamilyMedicationScheduleCard", () => ({
  FamilyMedicationScheduleCard: ({
    schedule,
  }: {
    schedule: { medicineName: string; scheduledTime: string; status: string };
  }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(
      Text,
      null,
      `복약:${schedule.medicineName}:${schedule.scheduledTime}:${schedule.status}`,
    );
  },
}));

describe("FamilyDetailScreen", () => {
  const mockRefetch = jest.fn();
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilyDetail.mockReturnValue({
      data: {
        familyId: 1,
        name: "김영희",
        relation: "MOTHER",
        birthDate: "1965-05-15",
        gender: "F",
        height: 160,
        weight: 55,
        bloodType: "A",
        diseases: ["고혈압"],
        allergies: [{ code: "J01CA", name: "페니실린계 항생제" }],
        isAlertConsent: true,
        todayMedicationSummary: {
          completedCount: 2,
          totalCount: 3,
          completionRate: 67,
          remainingCount: 1,
        },
        todayMedicationSchedules: [
          { id: "s-1", medicineName: "혈압약", scheduledTime: "08:00", status: "COMPLETED" },
          { id: "s-2", medicineName: "당뇨약", scheduledTime: "08:00", status: "COMPLETED" },
          { id: "s-3", medicineName: "혈압약", scheduledTime: "20:00", status: "PENDING" },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it("가족 상세 데이터가 화면에 렌더링된다", () => {
    const { getByText } = render(<FamilyDetailScreen familyId={1} />);

    expect(getByText("헤더:어머니 님")).toBeTruthy();
    expect(getByText("오늘의 복약 이행률")).toBeTruthy();
    expect(getByText("2 / 3 완료")).toBeTruthy();
    expect(getByText("67%")).toBeTruthy();
    expect(getByText("1개 남음")).toBeTruthy();
    expect(getByText("복약:혈압약:08:00:COMPLETED")).toBeTruthy();
    expect(getByText("복약:당뇨약:08:00:COMPLETED")).toBeTruthy();
    expect(getByText("복약:혈압약:20:00:PENDING")).toBeTruthy();
  });

  it("건강정보 상세보기 클릭 시 상세 페이지로 이동한다", () => {
    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);

    fireEvent.press(getByLabelText("건강정보 상세보기"));

    expect(mockRouterPush).toHaveBeenCalledWith("/profile/health-info");
  });

  it("가족 구성원 삭제 클릭 시 삭제 안내 알림을 띄운다", () => {
    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);

    fireEvent.press(getByLabelText("가족 구성원 삭제"));

    expect(mockAlert).toHaveBeenCalledWith(
      "가족 구성원 삭제",
      "삭제 기능은 다음 단계에서 API와 연결할 예정입니다.",
    );
  });

  it("조회 에러 상태에서 다시 시도 클릭 시 refetch를 호출한다", () => {
    mockUseFamilyDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);
    fireEvent.press(getByLabelText("가족 정보 다시 시도"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("familyId가 null이면 잘못된 경로 메시지를 보여준다", () => {
    const { getByText, queryByLabelText } = render(<FamilyDetailScreen familyId={null} />);

    expect(getByText("잘못된 가족 프로필 경로입니다.")).toBeTruthy();
    expect(queryByLabelText("가족 정보 다시 시도")).toBeNull();
  });
});
