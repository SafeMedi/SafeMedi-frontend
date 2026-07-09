import { act, renderHook } from "@testing-library/react-native";
import { useLogout } from "@/hooks/use-logout";

const mockRemoveQueries = jest.fn();
const mockClearSession = jest.fn();
const mockClearUser = jest.fn();
const mockDeleteDeviceToken = jest.fn();
const mockClearRegisteredDeviceToken = jest.fn();

let mockAccessToken: string | null = "mock-access-token";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    removeQueries: mockRemoveQueries,
  }),
}));

jest.mock("@/api/endpoints/device-token", () => ({
  deleteDeviceToken: (...args: unknown[]) => mockDeleteDeviceToken(...args),
}));

jest.mock("@/hooks/push-notification-token-store", () => ({
  getRegisteredDeviceToken: () => "mock-device-token",
  clearRegisteredDeviceToken: (...args: unknown[]) => mockClearRegisteredDeviceToken(...args),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: Object.assign(
    (selector: (state: { clearSession: () => void }) => unknown) =>
      selector({ clearSession: mockClearSession }),
    {
      getState: () => ({ accessToken: mockAccessToken }),
    },
  ),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { clearUser: () => void }) => unknown) =>
    selector({ clearUser: mockClearUser }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "mock-access-token";
    mockDeleteDeviceToken.mockResolvedValue({ message: "ok" });
  });

  it("세션, 사용자, 인증 스코프 query cache를 정리한다", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockDeleteDeviceToken).toHaveBeenCalledWith({ deviceToken: "mock-device-token" });
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

  it("accessToken이 없으면 디바이스 토큰 해제 API를 호출하지 않는다", async () => {
    mockAccessToken = null;

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current();
    });

    expect(mockDeleteDeviceToken).not.toHaveBeenCalled();
    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });

  it("skipDeviceTokenDeletion이면 디바이스 토큰 해제 API를 호출하지 않는다", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current({ skipDeviceTokenDeletion: true });
    });

    expect(mockDeleteDeviceToken).not.toHaveBeenCalled();
    expect(mockClearRegisteredDeviceToken).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });
});
