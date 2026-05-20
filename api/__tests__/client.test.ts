const mockKyCreate = jest.fn();

jest.mock("ky", () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => mockKyCreate(...args),
  },
}));

describe("api/client", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("baseUrl 끝에 슬래시가 없으면 자동으로 붙여서 ky.create를 호출한다", () => {
    const mockFetch = jest.fn();
    jest.doMock("@/api/mock", () => ({
      mockRegistry: {},
      resolveFetchImplementation: () => mockFetch,
    }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: "https://api.example.com",
        timeoutMs: 8000,
        useMock: false,
      },
    }));
    jest.doMock("@/stores/sessionStore", () => ({
      useSessionStore: { getState: () => ({ accessToken: "token-123" }) },
    }));

    jest.isolateModules(() => {
      require("../client");
    });

    expect(mockKyCreate).toHaveBeenCalledTimes(1);
    const options = mockKyCreate.mock.calls[0]?.[0] as {
      baseUrl: string;
      timeout: number;
      fetch: unknown;
    };

    expect(options.baseUrl).toBe("https://api.example.com/");
    expect(options.timeout).toBe(8000);
    expect(options.fetch).toBe(mockFetch);
  });

  it("beforeRequest 훅이 Authorization 헤더를 세팅한다", () => {
    jest.doMock("@/api/mock", () => ({
      mockRegistry: {},
      resolveFetchImplementation: () => jest.fn(),
    }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: "https://api.example.com/",
        timeoutMs: 8000,
        useMock: false,
      },
    }));
    jest.doMock("@/stores/sessionStore", () => ({
      useSessionStore: { getState: () => ({ accessToken: "token-123" }) },
    }));

    jest.isolateModules(() => {
      require("../client");
    });

    const options = mockKyCreate.mock.calls[0]?.[0] as {
      hooks: { beforeRequest: Array<(arg: { request: Request }) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test");

    options.hooks.beforeRequest[0]?.({ request });

    expect(request.headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("이미 Authorization 헤더가 있으면 값을 덮어쓰지 않는다", () => {
    jest.doMock("@/api/mock", () => ({
      mockRegistry: {},
      resolveFetchImplementation: () => jest.fn(),
    }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: "https://api.example.com/",
        timeoutMs: 8000,
        useMock: false,
      },
    }));
    jest.doMock("@/stores/sessionStore", () => ({
      useSessionStore: { getState: () => ({ accessToken: "token-123" }) },
    }));

    jest.isolateModules(() => {
      require("../client");
    });

    const options = mockKyCreate.mock.calls[0]?.[0] as {
      hooks: { beforeRequest: Array<(arg: { request: Request }) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test", {
      headers: { Authorization: "Bearer custom" },
    });

    options.hooks.beforeRequest[0]?.({ request });

    expect(request.headers.get("Authorization")).toBe("Bearer custom");
  });

  it("토큰이 없고 mock 모드면 Authorization 없이 debug 로그만 출력한다", () => {
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;

    jest.doMock("@/api/mock", () => ({
      mockRegistry: {},
      resolveFetchImplementation: () => jest.fn(),
    }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: "https://api.example.com/",
        timeoutMs: 8000,
        useMock: true,
      },
    }));
    jest.doMock("@/stores/sessionStore", () => ({
      useSessionStore: { getState: () => ({ accessToken: null }) },
    }));

    jest.isolateModules(() => {
      require("../client");
    });

    const options = mockKyCreate.mock.calls[0]?.[0] as {
      hooks: { beforeRequest: Array<(arg: { request: Request }) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test");

    options.hooks.beforeRequest[0]?.({ request });

    expect(request.headers.get("Authorization")).toBeNull();
    expect(debugSpy).toHaveBeenCalledWith(
      "[api mock]",
      "GET",
      "https://api.example.com/api/v1/test",
    );
    debugSpy.mockRestore();
  });
});
