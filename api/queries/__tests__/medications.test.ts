import { renderHook } from "@testing-library/react-native";

import { fetchMedicationRecords } from "@/api/endpoints/medications";
import { queryKeys } from "@/api/query-keys";
import { useMedicationRecords } from "../medications";

const mockFetchMedicationRecords = fetchMedicationRecords as jest.MockedFunction<
  typeof fetchMedicationRecords
>;

let mockAccessToken: string | null = "token";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/medications", () => ({
  fetchMedicationRecords: jest.fn(async () => ({
    period: "2026-05",
    summary: { totalCount: 0, takenCount: 0, fraction: "0/0", complianceRate: 0 },
    records: [],
  })),
  fetchMedicationStatistics: jest.fn(),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

describe("api/queries/medications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
  });

  it("주간 복약 기록 쿼리는 WEEK 타입을 그대로 전달한다", async () => {
    const { result } = renderHook(() => useMedicationRecords({ type: "WEEK", date: "2026-05-18" }));
    const options = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };

    expect(options.enabled).toBe(true);
    expect(options.queryKey).toEqual(queryKeys.medications.records("WEEK", "2026-05-18"));

    await options.queryFn();
    expect(mockFetchMedicationRecords).toHaveBeenCalledWith({
      type: "WEEK",
      date: "2026-05-18",
      familyId: undefined,
    });
  });
});
