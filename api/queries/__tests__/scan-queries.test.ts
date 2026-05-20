import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import { useSearchDrugsQuery } from "../drugs";
import { useCreatePrescriptionByScanMutation } from "../prescription-scan";

const mockSearchDrugs = jest.fn<Promise<unknown>, [string]>(async () => []);
const mockCreatePrescriptionByScan = jest.fn<Promise<unknown>, [unknown]>(async () => ({}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
  useMutation: jest.fn((options: unknown) => options),
}));

jest.mock("@/api/endpoints/drugs", () => ({
  searchDrugs: (keyword: string) => mockSearchDrugs(keyword),
}));

jest.mock("@/api/endpoints/prescription-scan", () => ({
  createPrescriptionByScan: (body: unknown) => mockCreatePrescriptionByScan(body),
}));

describe("api/queries scan modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drug 검색 쿼리 옵션을 올바르게 구성한다", async () => {
    const { result } = renderHook(() => useSearchDrugsQuery("타이", true));
    const query = result.current as unknown as {
      queryKey: unknown;
      enabled: boolean;
      staleTime: number;
      queryFn: () => Promise<unknown>;
    };

    expect(query.queryKey).toEqual(queryKeys.scan.searchDrugs("타이"));
    expect(query.enabled).toBe(true);
    expect(query.staleTime).toBe(60_000);
    await query.queryFn();
    expect(mockSearchDrugs).toHaveBeenCalledWith("타이");
  });

  it("처방전 생성 mutation 옵션을 올바르게 구성한다", async () => {
    const { result } = renderHook(() => useCreatePrescriptionByScanMutation());
    const mutation = result.current as unknown as {
      mutationKey: unknown;
      mutationFn: (body: unknown) => Promise<unknown>;
    };

    expect(mutation.mutationKey).toEqual(queryKeys.scan.createPrescription);
    await mutation.mutationFn({ title: "처방전" });
    expect(mockCreatePrescriptionByScan).toHaveBeenCalledWith({ title: "처방전" });
  });
});
