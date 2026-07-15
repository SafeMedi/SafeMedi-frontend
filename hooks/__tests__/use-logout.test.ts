import { act, renderHook } from "@testing-library/react-native";
import { useLogout } from "@/hooks/use-logout";

const mockRemoveQueries = jest.fn();
const mockClearSession = jest.fn();
const mockClearUser = jest.fn();
const mockClearRegisteredDeviceToken = jest.fn();
const mockLogoutMutateAsync = jest.fn();

let mockRegisteredDeviceToken: string | null = "mock-device-token";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: mockRemoveQueries,
  }),
}));

jest.mock("@/api/queries/auth", () => ({
  useLogoutMutation: () => ({
    mutateAsync: (...args: unknown[]) => mockLogoutMutateAsync(...args),
  }),
}));

jest.mock("@/hooks/push-notification-token-store", () => ({
  getRegisteredDeviceToken: () => mockRegisteredDeviceToken,
  clearRegisteredDeviceToken: (...args: unknown[]) => mockClearRegisteredDeviceToken(...args),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { clearSession: () => void }) => unknown) =>
    selector({ clearSession: mockClearSession }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { clearUser: () => void }) => unknown) =>
    selector({ clearUser: mockClearUser }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisteredDeviceToken = "mock-device-token";
    mockLogoutMutateAsync.mockResolvedValue({ message: "ok" });
  });

  it("로그아웃 API 호출 후 세션, 사용자, 인증 스코프 query cache를 정리한다", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockLogoutMutateAsync).toHaveBeenCalledWith({ deviceToken: "mock-device-token" });
    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["user", "me"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["family"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["prescriptions"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["scan"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["map"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["notification"] });
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
  });

  it("등록된 디바이스 토큰이 없으면 로그아웃 API를 건너뛰고 로컬 상태만 정리한다", async () => {
    mockRegisteredDeviceToken = null;
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockLogoutMutateAsync).not.toHaveBeenCalled();
    expect(mockClearRegisteredDeviceToken).not.toHaveBeenCalled();
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
  });

  it("로그아웃 API가 실패해도 로컬 로그아웃은 완료한다", async () => {
    mockLogoutMutateAsync.mockRejectedValue(new Error("network"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockRemoveQueries).toHaveBeenCalledTimes(8);
    warnSpy.mockRestore();
  });
});
