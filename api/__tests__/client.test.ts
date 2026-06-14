class MockHTTPError extends Error {
  response: Response;
  request: Request;

  constructor(response: Response, request: Request) {
    super(`HTTP ${response.status}`);
    this.name = "HTTPError";
    this.response = response;
    this.request = request;
  }
}

class MockTimeoutError extends Error {
  request: Request;

  constructor(request: Request) {
    super("Request timed out");
    this.name = "TimeoutError";
    this.request = request;
  }
}

const mockKyCreate = jest.fn();

type KyHookOptions = Record<string, never>;

type BeforeRequestHookArg = {
  request: Request;
  options: KyHookOptions;
  retryCount: 0;
};

type BeforeErrorHookArg = {
  request: Request;
  options: KyHookOptions;
  error: Error;
  retryCount: number;
};

function createBeforeRequestState(request: Request): BeforeRequestHookArg {
  return { request, options: {}, retryCount: 0 };
}

function createBeforeErrorState(request: Request, error: Error): BeforeErrorHookArg {
  return { request, options: {}, error, retryCount: 0 };
}

jest.mock("ky", () => ({
  __esModule: true,
  HTTPError: MockHTTPError,
  TimeoutError: MockTimeoutError,
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
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test");

    options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

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
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test", {
      headers: { Authorization: "Bearer custom" },
    });

    options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(request.headers.get("Authorization")).toBe("Bearer custom");
  });

  it("토큰이 없어도 dev 모드면 요청 debug 로그를 출력한다", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
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
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => void> };
    };
    const request = new Request("https://api.example.com/api/v1/test");

    options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(request.headers.get("Authorization")).toBeNull();
    expect(logSpy).toHaveBeenCalledWith("[api] → GET https://api.example.com/api/v1/test");
    logSpy.mockRestore();
  });

  it("beforeError 훅이 HTTP가 아닌 네트워크 오류를 readable하게 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;

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
      useSessionStore: { getState: () => ({ accessToken: null }) },
    }));

    jest.isolateModules(() => {
      require("../client");
    });

    const options = mockKyCreate.mock.calls[0]?.[0] as {
      hooks: {
        beforeError: Array<(arg: BeforeErrorHookArg) => Promise<Error>>;
      };
    };
    const request = new Request("https://api.example.com/api/v1/users/me");
    const networkError = new Error();
    Object.assign(networkError, { request });

    await options.hooks.beforeError[0]?.(createBeforeErrorState(request, networkError));

    expect(logSpy).toHaveBeenCalledWith(
      "[api] ✕ Error · GET https://api.example.com/api/v1/users/me",
    );
    logSpy.mockRestore();
  });
});
