import { fireEvent, render } from "@testing-library/react-native";
import { MedicationReportScreen } from "../MedicationReportScreen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});
jest.mock("../components/MedicationReportHeader", () => ({ MedicationReportHeader: () => null }));
jest.mock("../medication-calendar", () => ({ MedicationCalendarTab: () => null }));
jest.mock("../medication-statistics", () => ({ MedicationStatisticsTab: () => null }));
jest.mock("../medication-management", () => ({ MedicationManagementTab: () => null }));
jest.mock("../components/MedicationReportTabBar", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    MedicationReportTabBar: ({
      onChangeTab,
    }: {
      onChangeTab: (tab: "calendar" | "statistics" | "management") => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        ["calendar", "statistics", "management"].map((tab) =>
          React.createElement(Pressable, {
            key: tab,
            accessibilityLabel: tab,
            onPress: () => onChangeTab(tab as "calendar" | "statistics" | "management"),
          }),
        ),
      ),
  };
});

describe("MedicationReportScreen", () => {
  it("세 리포트 탭을 전환한다", () => {
    const { getByLabelText } = render(<MedicationReportScreen />);
    fireEvent.press(getByLabelText("statistics"));
    fireEvent.press(getByLabelText("management"));
    fireEvent.press(getByLabelText("calendar"));
  });
});
