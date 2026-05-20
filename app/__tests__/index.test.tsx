import { render } from "@testing-library/react-native";
import IndexRedirect from "../index";

let mockAuthState:
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | { kind: "ready"; href: string };

const mockRedirect = jest.fn(() => null);
const mockAuthGateView = jest.fn(() => null);

jest.mock("expo-router", () => ({
  Redirect: (props: { href: string }) => mockRedirect(props),
}));

jest.mock("@/hooks/use-auth-route-state", () => ({
  useAuthRouteState: () => mockAuthState,
}));

jest.mock("@/components/AuthGateView", () => ({
  AuthGateView: (props: { kind: "loading" | "error"; onRetry?: () => void }) =>
    mockAuthGateView(props),
}));

describe("app/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loading 상태면 AuthGateView loading을 렌더링한다", () => {
    mockAuthState = { kind: "loading" };
    render(<IndexRedirect />);

    expect(mockAuthGateView).toHaveBeenCalledWith({ kind: "loading" });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("error 상태면 AuthGateView error를 렌더링한다", () => {
    const retry = jest.fn();
    mockAuthState = { kind: "error", retry };
    render(<IndexRedirect />);

    expect(mockAuthGateView).toHaveBeenCalledWith({ kind: "error", onRetry: retry });
  });

  it("ready 상태면 href로 Redirect한다", () => {
    mockAuthState = { kind: "ready", href: "/(tabs)/dashboard" };
    render(<IndexRedirect />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/(tabs)/dashboard" });
  });
});
