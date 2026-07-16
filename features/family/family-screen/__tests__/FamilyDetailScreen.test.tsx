import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { FamilyDetailScreen } from "../FamilyDetailScreen";

const mockUseFamilyMember = jest.fn();
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/api/error", () => ({
  getApiErrorMessage: jest.fn(async (_error: unknown, fallback: string) => fallback),
}));

jest.mock("@/api/queries/family", () => ({
  useDeleteFamily: () => ({ isPending: false, mutate: mockDeleteMutate }),
  useFamilyMember: (familyId: number | null) => mockUseFamilyMember(familyId),
  useUpdateFamilyRelation: () => ({ isPending: false, mutate: mockUpdateMutate }),
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

describe("FamilyDetailScreen", () => {
  const mockRefetch = jest.fn();
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilyMember.mockReturnValue({
      data: {
        familyId: 1,
        name: "김영희",
        relation: "어머니",
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it("가족 목록에서 찾은 구성원 정보가 화면에 렌더링된다", () => {
    const { getByText, getByDisplayValue } = render(<FamilyDetailScreen familyId={1} />);

    expect(getByText("헤더:어머니 님")).toBeTruthy();
    expect(getByText("김영희")).toBeTruthy();
    expect(getByDisplayValue("어머니")).toBeTruthy();
  });

  it("호칭을 변경하고 저장하면 수정 mutation을 호출한다", () => {
    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);

    fireEvent.changeText(getByLabelText("가족 호칭 입력"), "엄마");
    fireEvent.press(getByLabelText("가족 호칭 저장"));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { familyId: 1, body: { relation: "엄마" } },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("가족 연동 해제 버튼 클릭 시 확인 알림을 띄우고 확인하면 삭제한다", () => {
    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);

    fireEvent.press(getByLabelText("가족 연동 해제"));

    const destructiveButton = mockAlert.mock.calls[0]?.[2]?.[1];
    destructiveButton?.onPress?.();

    expect(mockAlert).toHaveBeenCalledWith(
      "가족 연동 해제",
      "이 가족과의 연동을 해제하시겠습니까?",
      expect.any(Array),
    );
    expect(mockDeleteMutate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("삭제 성공 시 뒤로 이동한다", () => {
    mockDeleteMutate.mockImplementation((_familyId, options) => options.onSuccess());
    const { getByLabelText } = render(<FamilyDetailScreen familyId={1} />);

    fireEvent.press(getByLabelText("가족 연동 해제"));
    mockAlert.mock.calls[0]?.[2]?.[1]?.onPress?.();

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("조회 에러 상태에서 다시 시도 클릭 시 refetch를 호출한다", () => {
    mockUseFamilyMember.mockReturnValue({
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
