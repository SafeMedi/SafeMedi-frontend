import { render } from "@testing-library/react-native";
import { router } from "expo-router";
import { PrescriptionScanResultScreen } from "../PrescriptionScanResultScreen";
import { usePrescriptionOcrResultStore } from "../usePrescriptionOcrResultStore";

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("PrescriptionScanResultScreen", () => {
  const mockRouterReplace = router.replace as jest.MockedFunction<typeof router.replace>;

  beforeEach(() => {
    jest.clearAllMocks();
    usePrescriptionOcrResultStore.setState({ result: null });
  });

  it("OCR 결과가 없으면 스캔 화면으로 리다이렉트한다", () => {
    render(<PrescriptionScanResultScreen />);
    expect(mockRouterReplace).toHaveBeenCalledWith("/(detail)/scan");
  });

  it("OCR 결과가 있으면 추출 원문 텍스트를 노출한다", () => {
    usePrescriptionOcrResultStore.setState({
      result: {
        imageUri: "file://prescription.jpg",
        draft: {
          title: "처방전",
          startDate: "2026-05-14",
          endDate: "2026-05-20",
          takeTimes: ["09:00"],
          medications: [{ atcCode: "UNKNOWN", drugName: "아세트아미노펜정" }],
          rawText: "아세트아미노펜정 500mg",
        },
      },
    });

    const { getByText } = render(<PrescriptionScanResultScreen />);
    expect(getByText("OCR 추출 결과")).toBeTruthy();
    expect(getByText("아세트아미노펜정 500mg")).toBeTruthy();
  });
});
