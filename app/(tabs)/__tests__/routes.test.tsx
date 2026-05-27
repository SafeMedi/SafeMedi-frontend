import { render } from "@testing-library/react-native";
import DashboardTabRoute from "../dashboard";
import TabTwoScreen from "../manage";
import MapScreen from "../map";
import ProfileTabRoute from "../profile";
import ScanTabRoute from "../scan";

const mockDashboardScreen = jest.fn(() => null);
const mockProfileScreen = jest.fn(() => null);
interface RedirectProps {
  readonly href: string;
}

const mockRedirect = jest.fn<null, [RedirectProps]>(() => null);

jest.mock("expo-router", () => ({
  Redirect: (props: RedirectProps) => mockRedirect(props),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    View: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("@/components/domains/dashboard", () => ({
  DashboardScreen: () => mockDashboardScreen(),
}));

jest.mock("@/components/domains/profile/view", () => ({
  ProfileScreen: () => mockProfileScreen(),
}));

describe("app/(tabs) routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dashboard/profile route가 각 화면을 렌더링한다", () => {
    render(<DashboardTabRoute />);
    render(<ProfileTabRoute />);

    expect(mockDashboardScreen).toHaveBeenCalledTimes(1);
    expect(mockProfileScreen).toHaveBeenCalledTimes(1);
  });

  it("manage/nearby route는 View를 렌더링한다", () => {
    const { toJSON: manageTree } = render(<TabTwoScreen />);
    const { toJSON: mapTree } = render(<MapScreen />);

    expect(manageTree()).toBeTruthy();
    expect(mapTree()).toBeTruthy();
  });

  it("scan route는 detail scan으로 Redirect한다", () => {
    render(<ScanTabRoute />);
    expect(mockRedirect).toHaveBeenCalledWith({ href: "/(detail)/scan/scan" });
  });
});
