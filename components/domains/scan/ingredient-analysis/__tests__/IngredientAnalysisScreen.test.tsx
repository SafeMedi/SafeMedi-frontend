import { fireEvent, render } from "@testing-library/react-native";
import type { AnalyzeIngredientsRequest, AnalyzeIngredientsResponse } from "@/api/types";
import { IngredientAnalysisScreen } from "../IngredientAnalysisScreen";
import type { IngredientAnalysisViewModel } from "../types";
import { useIngredientAnalysisViewModel } from "../useIngredientAnalysisViewModel";

const mockHandlePressRetryAnalysis = jest.fn();
const mockHandlePressCancel = jest.fn();
const mockHandlePressClose = jest.fn();
const mockHandlePressConfirm = jest.fn();

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ atcCode: "A01", drugName: "타이레놀", dosage: "1정", takeTimes: ["08:00"] }],
};

const BASE_RESULT: AnalyzeIngredientsResponse = {
  title: "스캔 처방전",
  analyzedMedicationCount: 1,
  summary: {
    safeCount: 1,
    cautionCount: 0,
    dangerCount: 0,
  },
  medications: [
    {
      atcCode: "A01",
      drugName: "타이레놀",
      riskLevel: "SAFE",
      efficacy: ["효능"],
      precautions: ["주의사항"],
      warnings: [],
    },
  ],
  shouldConsultDoctor: false,
  doctorConsultationMessage: null,
};

let mockViewModel: IngredientAnalysisViewModel = {
  request: BASE_REQUEST,
  result: BASE_RESULT,
  isAnalyzing: false,
  isSubmitting: false,
  errorMessage: null,
  handlePressClose: mockHandlePressClose,
  handlePressCancel: mockHandlePressCancel,
  handlePressRetryAnalysis: mockHandlePressRetryAnalysis,
  handlePressConfirm: mockHandlePressConfirm,
};

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

jest.mock("../useIngredientAnalysisViewModel", () => ({
  useIngredientAnalysisViewModel: jest.fn(),
}));

jest.mock("../components/AnalysisSummaryCard", () => ({
  AnalysisSummaryCard: () => null,
}));

jest.mock("../components/DoctorConsultationCard", () => ({
  DoctorConsultationCard: ({ message }: { message: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, {}, message);
  },
}));

jest.mock("../components/MedicationAnalysisCard", () => ({
  MedicationAnalysisCard: () => null,
}));

jest.mock("../../prescription-scan/components/PrescriptionScanHeader", () => ({
  PrescriptionScanHeader: () => null,
}));

describe("IngredientAnalysisScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      useIngredientAnalysisViewModel as jest.MockedFunction<typeof useIngredientAnalysisViewModel>
    ).mockImplementation(() => mockViewModel);
  });

  it("분석 실패 상태에서 다시 시도 버튼을 누르면 재시도 핸들러를 호출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      errorMessage: "네트워크 오류",
      isAnalyzing: false,
    };

    const { getByText } = render(<IngredientAnalysisScreen />);

    fireEvent.press(getByText("다시 시도"));

    expect(mockHandlePressRetryAnalysis).toHaveBeenCalledTimes(1);
  });

  it("등록 진행 중이면 하단 CTA가 로딩 문구를 노출한다", () => {
    mockViewModel = {
      ...mockViewModel,
      errorMessage: null,
      isSubmitting: true,
    };

    const { getByText } = render(<IngredientAnalysisScreen />);

    expect(getByText("등록 중...")).toBeTruthy();
  });
});
