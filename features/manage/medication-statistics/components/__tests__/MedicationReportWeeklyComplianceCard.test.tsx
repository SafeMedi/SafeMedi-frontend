import { render } from "@testing-library/react-native";

import { MedicationReportWeeklyComplianceCard } from "../MedicationReportWeeklyComplianceCard";

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

describe("MedicationReportWeeklyComplianceCard", () => {
  it("성공, 주의, 미래 이행률을 표시한다", () => {
    const { getByText } = render(
      <MedicationReportWeeklyComplianceCard
        items={[
          { dayLabel: "월", rate: 100, tone: "success" },
          { dayLabel: "화", rate: 65, tone: "warning" },
          { dayLabel: "수", rate: null, tone: "future" },
        ]}
      />,
    );
    expect(getByText("100%")).toBeTruthy();
    expect(getByText("65%")).toBeTruthy();
    expect(getByText("예정")).toBeTruthy();
  });
});
