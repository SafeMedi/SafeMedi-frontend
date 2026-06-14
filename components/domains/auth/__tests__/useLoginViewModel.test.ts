import { type KakaoOAuthToken, login } from "@react-native-seoul/kakao-login";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

import { parseApiError } from "@/api/error";
import { useLoginMutation } from "@/api/queries/user";

import { useLoginViewModel } from "../useLoginViewModel";

jest.mock("@react-native-seoul/kakao-login", () => ({
  login: jest.fn(),
}));

jest.mock("@/api/error", () => ({
  parseApiError: jest.fn(),
}));

jest.mock("@/api/queries/user", () => ({
  useLoginMutation: jest.fn(),
}));

const mockLogin = login as unknown as jest.MockedFunction<() => Promise<KakaoOAuthToken>>;

const mockKakaoOAuthToken: KakaoOAuthToken = {
  accessToken: "kakao-access-token",
  refreshToken: "refresh",
  idToken: "id",
  accessTokenExpiresAt: new Date(),
  refreshTokenExpiresAt: new Date(),
  scopes: [],
};
const mockParseApiError = parseApiError as jest.MockedFunction<typeof parseApiError>;
const mockUseLoginMutation = useLoginMutation as jest.MockedFunction<typeof useLoginMutation>;

describe("useLoginViewModel", () => {
  const mockMutateAsync = jest.fn();
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLoginMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useLoginMutation>);
  });

  afterAll(() => {
    mockAlert.mockRestore();
  });

  it("카카오 SDK accessToken으로 백엔드 로그인을 호출한다", async () => {
    mockLogin.mockResolvedValue(mockKakaoOAuthToken);
    mockMutateAsync.mockResolvedValue({
      accessToken: "app-access-token",
      profile: { isTutorialCompleted: false },
    });

    const { result } = renderHook(() => useLoginViewModel());

    await act(async () => {
      await result.current.handleKakaoLogin();
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      provider: "kakao",
      accessToken: "kakao-access-token",
    });
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("사용자가 카카오 로그인을 취소하면 Alert를 표시하지 않는다", async () => {
    mockLogin.mockRejectedValue(new Error("User cancelled login"));

    const { result } = renderHook(() => useLoginViewModel());

    await act(async () => {
      await result.current.handleKakaoLogin();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("백엔드 로그인 실패 시 Alert를 표시한다", async () => {
    mockLogin.mockResolvedValue(mockKakaoOAuthToken);
    mockMutateAsync.mockRejectedValue(new Error("network error"));
    mockParseApiError.mockResolvedValue({ message: "서버 오류" });

    const { result } = renderHook(() => useLoginViewModel());

    await act(async () => {
      await result.current.handleKakaoLogin();
    });

    expect(mockAlert).toHaveBeenCalledWith("로그인 실패", "서버 오류");
  });
});
