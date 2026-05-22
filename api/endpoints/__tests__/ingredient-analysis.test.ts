import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { AnalyzeIngredientsRequest } from "@/api/types";
import { analyzePrescriptionIngredients } from "../ingredient-analysis";

const mockApiPost = jest.fn();

const BASE_REQUEST: AnalyzeIngredientsRequest = {
  title: "스캔 처방전",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["08:00"],
  medications: [{ atcCode: "A01", drugName: "타이레놀", takeTimes: ["08:00"] }],
};

interface DevGlobal {
  __DEV__?: boolean;
}

jest.mock("@/api/client", () => ({
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

describe("api/endpoints/ingredient-analysis", () => {
  const globalRef = global as DevGlobal;
  const originalDev = globalRef.__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    globalRef.__DEV__ = true;
  });

  afterAll(() => {
    globalRef.__DEV__ = originalDev;
  });

  it("API 성공 시 서버 응답을 반환한다", async () => {
    const expected = {
      title: "성분 분석",
      analyzedMedicationCount: 1,
      summary: { safeCount: 1, cautionCount: 0, dangerCount: 0 },
      medications: [],
      shouldConsultDoctor: false,
      doctorConsultationMessage: null,
    };
    const mockJson = jest.fn(async () => expected);
    mockApiPost.mockReturnValue({ json: mockJson });

    const result = await analyzePrescriptionIngredients(BASE_REQUEST);

    expect(api.post).toBeDefined();
    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.prescriptionsAnalysis, {
      json: BASE_REQUEST,
    });
    expect(result).toEqual(expected);
  });

  it("__DEV__에서 API 실패 시 mock 응답을 생성한다", async () => {
    mockApiPost.mockImplementation(() => {
      throw new Error("network");
    });

    const result = await analyzePrescriptionIngredients(BASE_REQUEST);

    expect(result.title).toBe("스캔 처방전");
    expect(result.analyzedMedicationCount).toBe(1);
    expect(
      result.summary.safeCount + result.summary.cautionCount + result.summary.dangerCount,
    ).toBe(1);
    expect(result.medications[0]?.drugName).toBe("타이레놀");
  });

  it("__DEV__가 false면 API 실패를 그대로 throw 한다", async () => {
    globalRef.__DEV__ = false;
    const expectedError = new Error("network down");
    mockApiPost.mockImplementation(() => {
      throw expectedError;
    });

    await expect(analyzePrescriptionIngredients(BASE_REQUEST)).rejects.toThrow("network down");
  });
});
