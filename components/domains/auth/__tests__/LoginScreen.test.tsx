import { fireEvent, render } from "@testing-library/react-native";
import { LoginScreen } from "../LoginScreen";

const mockMutate = jest.fn();
const mockRetry = jest.fn();

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "redirect"; href: "/(auth)/login" | "/(tabs)/dashboard" } = {
  kind: "redirect",
  href: "/(auth)/login",
};

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/components/AuthGateView", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    AuthGateView: ({ kind, onRetry }: { kind: string; onRetry?: () => void }) =>
      React.createElement(
        Pressable,
        { accessibilityLabel: `auth-${kind}`, onPress: onRetry },
        React.createElement(Text, null, kind),
      ),
  };
});

jest.mock("@/hooks/use-auth-route-state", () => ({
  useAuthRouteState: () => mockAuthState,
}));

jest.mock("@/api/queries/user", () => ({
  useLoginMutation: () => ({ mutate: mockMutate, isPending: false }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { kind: "redirect", href: "/(auth)/login" };
  });

  it("loading 상태에서는 AuthGateView를 렌더링한다", () => {
    mockAuthState = { kind: "loading" };
    const { getByLabelText } = render(<LoginScreen />);
    expect(getByLabelText("auth-loading")).toBeTruthy();
  });

  it("error 상태에서는 retry를 전달한다", () => {
    mockAuthState = { kind: "error", retry: mockRetry };
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText("auth-error"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("로그인 화면이 아닌 redirect 상태이면 Redirect를 렌더링한다", () => {
    mockAuthState = { kind: "redirect", href: "/(tabs)/dashboard" };
    const { getByText } = render(<LoginScreen />);
    expect(getByText("redirect:/(tabs)/dashboard")).toBeTruthy();
  });

  it("카카오 로그인 버튼 클릭 시 mutate를 호출한다", () => {
    const { getByLabelText } = render(<LoginScreen />);
    fireEvent.press(getByLabelText("카카오 소셜로그인"));
    expect(mockMutate).toHaveBeenCalledWith({
      provider: "kakao",
      accessToken: expect.any(String),
    });
  });
});
