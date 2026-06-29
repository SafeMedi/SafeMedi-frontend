import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { queryKeys } from "@/api/query-keys";
import ProfileScreen from "@/app/(tabs)/profile";

const mockRemoveQueries = jest.fn();
const mockClearSession = jest.fn();
const mockClearUser = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    push: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: mockRemoveQueries,
  }),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { clearSession: () => void }) => unknown) =>
    selector({
      clearSession: mockClearSession,
    }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { clearUser: () => void }) => unknown) =>
    selector({
      clearUser: mockClearUser,
    }),
  useProfileUser: () => ({ name: "홍길동", role: "주 사용자" }),
  useHealthInfo: () => ({ allergies: ["아스피린"], chronicConditions: ["천식"] }),
}));

jest.mock("@/api/queries/profile", () => ({
  useFamilyProfiles: () => ({ data: [] }),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/features/profile/view/components/ProfilePageHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { ProfilePageHeader: () => React.createElement(Text, null, "헤더") };
});

jest.mock("@/features/profile/view/components/UserHeroCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    UserHeroCard: ({ name, onPress }: { name: string; onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "프로필 수정으로 이동" },
        React.createElement(Text, null, name),
      ),
  };
});

jest.mock("@/features/profile/view/components/FamilyProfileSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { FamilyProfileSection: () => React.createElement(Text, null, "가족 프로필") };
});

jest.mock("@/features/profile/view/components/HealthInfoSection", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    HealthInfoSection: ({ onDetailPress }: { onDetailPress?: () => void }) =>
      React.createElement(
        Pressable,
        {
          onPress: onDetailPress,
          accessibilityRole: "button",
          accessibilityLabel: "건강 정보 상세보기",
        },
        React.createElement(Text, null, "건강 정보"),
      ),
  };
});

jest.mock("@/features/profile/view/components/SettingsSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { SettingsSection: () => React.createElement(Text, null, "설정") };
});

jest.mock("@/features/profile/view/components/AppInfoSection", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { AppInfoSection: () => React.createElement(Text, null, "앱 정보") };
});

jest.mock("@/features/profile/view/components/LogoutButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    LogoutButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: "button", accessibilityLabel: "로그아웃" },
        React.createElement(Text, null, "로그아웃"),
      ),
  };
});

describe("프로필 기본 화면", () => {
  const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("기본 화면 주요 섹션이 렌더링된다", () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText("헤더")).toBeTruthy();
    expect(getByText("가족 프로필")).toBeTruthy();
    expect(getByText("건강 정보")).toBeTruthy();
    expect(getByText("설정")).toBeTruthy();
  });

  it("로그아웃 시 세션/유저를 정리하고 관련 쿼리를 제거한다", () => {
    const { getByLabelText } = render(<ProfileScreen />);

    fireEvent.press(getByLabelText("로그아웃"));

    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: queryKeys.user.me });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["family"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["prescriptions"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["scan"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["map"] });
    expect(mockRemoveQueries).toHaveBeenCalledTimes(7);
  });

  it("건강 정보 상세보기 클릭 시 건강정보 상세 페이지로 이동한다", () => {
    const { getByLabelText } = render(<ProfileScreen />);

    fireEvent.press(getByLabelText("건강 정보 상세보기"));

    expect(mockRouterPush).toHaveBeenCalledWith("/profile/health-info");
  });
});
