import { getHttpStatus, isUnauthorizedError, parseApiError } from "@/api/error";

jest.mock("ky", () => ({
  isHTTPError: (error: unknown) => Boolean((error as { __httpError?: boolean })?.__httpError),
}));

function createHttpErrorMock(
  status: number,
  jsonValue: unknown,
  shouldThrowOnJson = false,
): {
  readonly __httpError: true;
  readonly response: {
    readonly status: number;
    readonly clone: () => { readonly json: () => Promise<unknown> };
  };
} {
  return {
    __httpError: true,
    response: {
      status,
      clone: () => ({
        json: async () => {
          if (shouldThrowOnJson) {
            throw new Error("invalid json");
          }
          return jsonValue;
        },
      }),
    },
  };
}

describe("api/error", () => {
  it("HTTP 에러가 아니면 상태 코드를 반환하지 않는다", () => {
    expect(getHttpStatus(new Error("x"))).toBeUndefined();
    expect(isUnauthorizedError(new Error("x"))).toBe(false);
  });

  it("401 HTTP 에러를 비인가 에러로 판단한다", () => {
    const error = createHttpErrorMock(401, { message: "unauthorized" });
    expect(getHttpStatus(error)).toBe(401);
    expect(isUnauthorizedError(error)).toBe(true);
  });

  it("응답 JSON 메시지가 있으면 해당 메시지를 우선 사용한다", async () => {
    const error = createHttpErrorMock(400, { code: "INVALID", message: "요청이 잘못되었습니다." });
    const parsed = await parseApiError(error);

    expect(parsed).toEqual({
      status: 400,
      code: "INVALID",
      message: "요청이 잘못되었습니다.",
    });
  });

  it("서버 오류(5xx)는 서버 오류 기본 메시지를 사용한다", async () => {
    const error = createHttpErrorMock(500, {});
    const parsed = await parseApiError(error);

    expect(parsed.message).toBe("서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  });

  it("JSON 파싱 실패 시 상태 코드 기반 기본 메시지로 대체한다", async () => {
    const error = createHttpErrorMock(401, null, true);
    const parsed = await parseApiError(error);

    expect(parsed.message).toBe("로그인이 만료되었습니다. 다시 로그인해 주세요.");
  });
});
