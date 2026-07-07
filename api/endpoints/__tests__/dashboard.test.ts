import { apiPaths } from "@/api/paths";
import {
  fetchDailyMedicationRecords,
  fetchMedicationHistoryRecords,
  fetchMedicationStatistics,
  fetchMonthlyMedicationRecords,
  fetchTodayMedicationSchedules,
  updateMedicationRecord,
} from "../dashboard";

const mockApiGet = jest.fn();
const mockApiPatch = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
  },
}));

describe("api/endpoints/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("일별 복약 기록 요청 시 DAILY 파라미터를 사용한다", async () => {
    const wireResponse = {
      type: "DAILY",
      date: "2026-05-20",
      summary: { totalCount: 1, takenCount: 1, fraction: "1/1" },
      records: [],
    };
    const mockJson = jest.fn(async () => wireResponse);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchDailyMedicationRecords({ date: "2026-05-20" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "DAILY", date: "2026-05-20" },
    });
    expect(result).toEqual({
      date: "2026-05-20",
      summary: {
        totalCount: 1,
        takenCount: 1,
        fraction: "1/1",
        complianceRate: 100,
      },
      records: [],
    });
  });

  it("오늘 복약 스케줄 요청 시 today 엔드포인트를 사용한다", async () => {
    const expected = { summary: { completedCount: 1, totalCount: 4 }, schedules: [] };
    const mockJson = jest.fn(async () => expected);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchTodayMedicationSchedules();

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecordsToday);
    expect(result).toEqual(expected);
  });

  it("복약 기록 상태 변경 시 record 엔드포인트에 PATCH 요청한다", async () => {
    const expected = {
      recordId: 57,
      prescriptionId: 8,
      scheduledAt: "2026-06-30T08:00:00",
      takenAt: "2026-06-30T08:03:00",
      status: "SUCCESS",
    };
    const mockJson = jest.fn(async () => expected);
    mockApiPatch.mockReturnValueOnce({ json: mockJson });

    const result = await updateMedicationRecord(57, { status: "SUCCESS" });

    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.medicationRecord(57), {
      json: { status: "SUCCESS" },
    });
    expect(result).toEqual(expected);
  });

  it("월별 복약 기록 요청 시 MONTH 파라미터를 사용한다", async () => {
    const wireResponse = {
      type: "MONTH",
      periodStartDate: "2026-05-01",
      periodEndDate: "2026-05-31",
      summary: { totalCount: 0, takenCount: 0, fraction: "0/0" },
      dailyRecords: [],
    };
    const mockJson = jest.fn(async () => wireResponse);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchMonthlyMedicationRecords({ date: "2026-05-20" });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationRecords, {
      searchParams: { type: "MONTH", date: "2026-05-01" },
    });
    expect(result).toEqual({
      period: "2026-05",
      summary: {
        totalCount: 0,
        takenCount: 0,
        fraction: "0/0",
        complianceRate: 0,
      },
      records: [],
    });
  });

  it("복약 이력은 월별 응답에서 선택 날짜 그룹만 추출한다", async () => {
    const mockMonthly = {
      type: "MONTH",
      periodStartDate: "2026-05-01",
      periodEndDate: "2026-05-31",
      summary: { totalCount: 3, takenCount: 2, fraction: "2/3" },
      dailyRecords: [
        {
          date: "2026-05-19",
          items: [
            {
              recordId: 1,
              prescriptionTitle: "감기약",
              scheduledTime: "08:00",
              status: "SUCCESS",
            },
          ],
        },
        {
          date: "2026-05-20",
          items: [
            {
              recordId: 2,
              prescriptionTitle: "감기약",
              scheduledTime: "08:00",
              status: "SUCCESS",
            },
            {
              recordId: 3,
              prescriptionTitle: "감기약",
              scheduledTime: "13:00",
              status: "PENDING",
            },
          ],
        },
      ],
    };
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => mockMonthly),
    });

    const result = await fetchMedicationHistoryRecords({ date: "2026-05-20" });

    expect(result).toEqual({
      date: "2026-05-20",
      items: [
        {
          recordId: 2,
          prescriptionTitle: "감기약",
          medicationNames: [],
          scheduledTime: "08:00",
          takenTime: null,
          status: "SUCCESS",
        },
        {
          recordId: 3,
          prescriptionTitle: "감기약",
          medicationNames: [],
          scheduledTime: "13:00",
          takenTime: null,
          status: "PENDING",
        },
      ],
    });
  });

  it("복약 이력에서 날짜 그룹이 없으면 빈 배열을 반환한다", async () => {
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => ({
        type: "MONTH",
        periodStartDate: "2026-05-01",
        periodEndDate: "2026-05-31",
        summary: { totalCount: 1, takenCount: 1, fraction: "1/1" },
        dailyRecords: [
          {
            date: "2026-05-19",
            items: [
              {
                recordId: 1,
                prescriptionTitle: "감기약",
                scheduledTime: "08:00",
                status: "SUCCESS",
              },
            ],
          },
        ],
      })),
    });

    const result = await fetchMedicationHistoryRecords({ date: "2026-05-20" });

    expect(result).toEqual({
      date: "2026-05-20",
      items: [],
    });
  });

  it("복약 통계 요청 시 시작일과 종료일 파라미터를 사용한다", async () => {
    const wireResponse = {
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalCount: 10,
      takenCount: 7,
      fraction: "7/10",
      dailyCompliance: [],
    };
    const mockJson = jest.fn(async () => wireResponse);
    mockApiGet.mockReturnValueOnce({ json: mockJson });

    const result = await fetchMedicationStatistics({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
    });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.medicationsStatistics, {
      searchParams: { startDate: "2026-05-14", endDate: "2026-05-20" },
    });
    expect(result).toEqual({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalScheduled: 10,
      totalTaken: 7,
      totalComplianceRate: 70,
      dailyCompliance: [],
    });
  });
});
