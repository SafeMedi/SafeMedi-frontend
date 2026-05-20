import { apiPaths } from "@/api/paths";
import {
  fetchDailyMedicationRecords,
  fetchMedicationHistoryRecords,
  fetchMonthlyMedicationRecords,
} from "../dashboard";

const mockApiGet = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

describe("api/endpoints/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("일별 복약 기록 요청 시 DAILY 파라미터를 사용한다", async () => {
    const expected = { summary: { totalCount: 1 }, records: [] };
    const mockJson = jest.fn(async () => expected);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchDailyMedicationRecords({ date: "2026-05-20" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "DAILY", date: "2026-05-20" },
    });
    expect(result).toEqual(expected);
  });

  it("월별 복약 기록 요청 시 MONTH 파라미터를 사용한다", async () => {
    const expected = { records: [] };
    const mockJson = jest.fn(async () => expected);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchMonthlyMedicationRecords({ date: "2026-05-20" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "MONTH", date: "2026-05-20" },
    });
    expect(result).toEqual(expected);
  });

  it("복약 이력은 월별 응답에서 선택 날짜 그룹만 추출한다", async () => {
    const mockMonthly = {
      records: [
        { date: "2026-05-19", items: [{ id: 1 }] },
        { date: "2026-05-20", items: [{ id: 2 }, { id: 3 }] },
      ],
    };
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => mockMonthly),
    });

    const result = await fetchMedicationHistoryRecords({ date: "2026-05-20" });

    expect(result).toEqual({
      date: "2026-05-20",
      items: [{ id: 2 }, { id: 3 }],
    });
  });

  it("복약 이력에서 날짜 그룹이 없으면 빈 배열을 반환한다", async () => {
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => ({ records: [{ date: "2026-05-19", items: [{ id: 1 }] }] })),
    });

    const result = await fetchMedicationHistoryRecords({ date: "2026-05-20" });

    expect(result).toEqual({
      date: "2026-05-20",
      items: [],
    });
  });
});
