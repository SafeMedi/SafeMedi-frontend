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

const mockCaptureException = jest.fn();

jest.mock("@sentry/react-native", () => ({
  __esModule: true,
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

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

  function loadClient(options?: { readonly token?: string | null; readonly baseUrl?: string }) {
    jest.doMock("@/api/mock", () => ({
      mockRegistry: {},
      resolveFetchImplementation: () => jest.fn(),
    }));
    jest.doMock("@/constants/api-config", () => ({
      apiConfig: {
        baseUrl: options?.baseUrl ?? "https://api.example.com/",
        timeoutMs: 8000,
        useMock: false,
      },
    }));
    jest.doMock("@/stores/sessionStore", () => ({
      useSessionStore: { getState: () => ({ accessToken: options?.token ?? null }) },
    }));
    jest.isolateModules(() => {
      require("../client");
    });
    return mockKyCreate.mock.calls[0]?.[0] as {
      hooks: {
        afterResponse: Array<(arg: { request: Request; response: Response }) => Promise<Response>>;
        beforeError: Array<(arg: BeforeErrorHookArg) => Promise<Error>>;
      };
    };
  }

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

  it("토큰이 없어도 dev 모드면 요청 debug 로그를 출력한다", async () => {
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
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => Promise<void> | void> };
    };
    const request = new Request("https://api.example.com/api/v1/test");

    await options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

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

  it("개발 모드 성공 응답의 JSON, 텍스트, 빈 본문을 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient();
    const request = new Request("https://api.example.com/users");

    await options.hooks.afterResponse[0]?.({
      request,
      response: new Response('{"id":1}', { status: 200 }),
    });
    await options.hooks.afterResponse[0]?.({
      request,
      response: new Response("plain", { status: 200 }),
    });
    await options.hooks.afterResponse[0]?.({
      request,
      response: new Response(null, { status: 204 }),
    });

    expect(logSpy).toHaveBeenCalledWith("[api] ← 200 GET https://api.example.com/users", { id: 1 });
    expect(logSpy).toHaveBeenCalledWith("[api] ← 200 GET https://api.example.com/users", "plain");
    expect(logSpy).toHaveBeenCalledWith("[api] ← 204 GET https://api.example.com/users", "(empty)");
    logSpy.mockRestore();
  });

  it("실패 응답과 비개발 응답은 성공 본문 로그를 남기지 않는다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const options = loadClient();
    const request = new Request("https://api.example.com/users");
    (global as { __DEV__?: boolean }).__DEV__ = false;

    await options.hooks.afterResponse[0]?.({
      request,
      response: new Response("no", { status: 500 }),
    });
    await options.hooks.afterResponse[0]?.({
      request,
      response: new Response("yes", { status: 200 }),
    });

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("HTTP, timeout, 요청 없는 오류를 유형별로 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient();
    const request = new Request("https://api.example.com/users");

    await options.hooks.beforeError[0]?.(
      createBeforeErrorState(
        request,
        new MockHTTPError(new Response("bad", { status: 400 }), request),
      ),
    );
    await options.hooks.beforeError[0]?.(
      createBeforeErrorState(request, new MockTimeoutError(request)),
    );
    await options.hooks.beforeError[0]?.(
      createBeforeErrorState(request, Object.assign(new Error("boom"), { request: undefined })),
    );

    expect(logSpy).toHaveBeenCalledWith("[api] ✕ 400 GET https://api.example.com/users", "bad");
    expect(logSpy).toHaveBeenCalledWith("[api] ✕ timeout · GET https://api.example.com/users");
    expect(logSpy).toHaveBeenCalledWith("[api] ✕ boom · unknown request");
    logSpy.mockRestore();
  });

  it("beforeError 훅이 5xx 에러를 Sentry로 전송한다", async () => {
    const options = loadClient();
    const request = new Request("https://api.example.com/users/me");
    const error = new MockHTTPError(new Response("server error", { status: 500 }), request);

    await options.hooks.beforeError[0]?.(createBeforeErrorState(request, error));

    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { http_status: "500" },
      extra: { method: "GET", url: "https://api.example.com/users/me" },
    });
  });

  it("beforeError 훅이 4xx 에러는 Sentry로 전송하지 않는다", async () => {
    const options = loadClient();
    const request = new Request("https://api.example.com/users/me");
    const error = new MockHTTPError(new Response("bad request", { status: 400 }), request);

    await options.hooks.beforeError[0]?.(createBeforeErrorState(request, error));

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("POST 요청은 JSON 바디를 debug 로그로 남긴다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient() as unknown as {
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => Promise<void>> };
    };
    const request = new Request("https://api.example.com/users", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    await options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(logSpy).toHaveBeenCalledWith("[api] → POST https://api.example.com/users", {
      name: "test",
    });
    logSpy.mockRestore();
  });

  it("POST 바디가 JSON이 아니면 텍스트 그대로 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient() as unknown as {
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => Promise<void>> };
    };
    const request = new Request("https://api.example.com/users", {
      method: "POST",
      body: "plain text",
    });

    await options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(logSpy).toHaveBeenCalledWith("[api] → POST https://api.example.com/users", "plain text");
    logSpy.mockRestore();
  });

  it("비개발 모드에서는 요청 debug 로그를 남기지 않는다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const options = loadClient() as unknown as {
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => Promise<void>> };
    };
    const request = new Request("https://api.example.com/users", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    await options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("beforeError 훅이 객체가 아닌 오류도 readable하게 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient();
    const request = new Request("https://api.example.com/users");

    await options.hooks.beforeError[0]?.(
      createBeforeErrorState(request, "network down" as unknown as Error),
    );

    expect(logSpy).toHaveBeenCalledWith("[api] ✕ network down · unknown request");
    logSpy.mockRestore();
  });

  it("beforeError 훅이 cause가 있는 오류는 cause와 함께 로그한다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient();
    const request = new Request("https://api.example.com/users");
    const cause = { reason: "network" };
    const error = Object.assign(new Error("boom"), { request, cause });

    await options.hooks.beforeError[0]?.(createBeforeErrorState(request, error));

    expect(logSpy).toHaveBeenCalledWith("[api] ✕ boom · GET https://api.example.com/users", cause);
    logSpy.mockRestore();
  });

  it("바디 없는 POST 요청은 바디 없이 debug 로그를 남긴다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const options = loadClient() as unknown as {
      hooks: { beforeRequest: Array<(arg: BeforeRequestHookArg) => Promise<void>> };
    };
    const request = new Request("https://api.example.com/users", { method: "POST" });

    await options.hooks.beforeRequest[0]?.(createBeforeRequestState(request));

    expect(logSpy).toHaveBeenCalledWith("[api] → POST https://api.example.com/users");
    logSpy.mockRestore();
  });

  it("비개발 모드에서는 5xx를 Sentry로 보내되 debug 로그는 남기지 않는다", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const options = loadClient();
    const request = new Request("https://api.example.com/users/me");
    const error = new MockHTTPError(new Response("server error", { status: 500 }), request);

    await options.hooks.beforeError[0]?.(createBeforeErrorState(request, error));

    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { http_status: "500" },
      extra: { method: "GET", url: "https://api.example.com/users/me" },
    });
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
