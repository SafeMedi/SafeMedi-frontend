import { render } from "@testing-library/react-native";
import RootLayout, { unstable_settings } from "../_layout";

const mockStackScreen = jest.fn(() => null);
const mockProfileSync = jest.fn(() => null);

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, {}, children);
  Stack.Screen = (props: unknown) => {
    mockStackScreen(props);
    return null;
  };
  return { Stack };
});

jest.mock("@/components/ProfileSync", () => ({
  ProfileSync: () => mockProfileSync(),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    TamaguiProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, {}, children),
  };
});

jest.mock("../../tamagui.config", () => ({
  tamaguiConfig: {},
}));

describe("app/_layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("앱 루트 설정(anchor)을 유지한다", () => {
    expect(unstable_settings.anchor).toBe("index");
  });

  it("ProfileSync와 주요 Stack.Screen 구성을 렌더링한다", () => {
    render(<RootLayout />);

    expect(mockProfileSync).toHaveBeenCalledTimes(1);

    const names = mockStackScreen.mock.calls
      .map((call) => (call[0] as { name?: string })?.name)
      .filter(Boolean);
    expect(names).toEqual(["index", "(auth)", "(tabs)", "(detail)"]);
  });
});
