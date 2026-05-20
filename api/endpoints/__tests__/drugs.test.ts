import { apiPaths } from "@/api/paths";
import { searchDrugs } from "../drugs";

const mockApiGet = jest.fn();

interface DevGlobal {
  __DEV__?: boolean;
}

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

describe("api/endpoints/drugs", () => {
  const globalRef = global as DevGlobal;
  const originalDev = globalRef.__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    globalRef.__DEV__ = true;
  });

  afterAll(() => {
    globalRef.__DEV__ = originalDev;
  });

  it("검색어가 2글자 미만이면 API 호출 없이 빈 배열을 반환한다", async () => {
    const result = await searchDrugs("a");

    expect(result).toEqual([]);
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("정상 검색 시 API 응답을 반환한다", async () => {
    const expected = [{ atcCode: "A", drugName: "타이레놀", company: "한국얀센" }];
    mockApiGet.mockReturnValueOnce({
      json: jest.fn(async () => expected),
    });

    const result = await searchDrugs(" 타이 ");

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.drugsSearch, {
      searchParams: { keyword: "타이" },
    });
    expect(result).toEqual(expected);
  });

  it("__DEV__에서 API 실패 시 fallback mock 목록을 필터링해 반환한다", async () => {
    mockApiGet.mockImplementationOnce(() => {
      throw new Error("network");
    });

    const result = await searchDrugs("아목");

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.drugName.includes("아목"))).toBe(true);
  });

  it("__DEV__가 false면 API 실패를 throw 한다", async () => {
    globalRef.__DEV__ = false;
    mockApiGet.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    await expect(searchDrugs("타이")).rejects.toThrow("network down");
  });
});
