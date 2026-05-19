import { useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { queryKeys } from "@/api/query-keys";
import {
  useFamilyProfiles,
  useHealthInfo,
  useNotificationSettings,
  useProfileUser,
  useUpdateNotificationSettings,
} from "../profile";

const mockUseQueryClient = useQueryClient as jest.MockedFunction<typeof useQueryClient>;

const mockFetchFamilies = jest.fn<Promise<Array<{ familyId: number; name: string }>>, []>(
  async () => [{ familyId: 10, name: "가족A" }],
);
const mockFetchNotificationSettings = jest.fn<
  Promise<{ isMyReminderOn: boolean; isFamilyReminderOn: boolean }>,
  []
>(async () => ({ isMyReminderOn: true, isFamilyReminderOn: false }));
const mockPatchNotificationSettings = jest.fn<
  Promise<{ isMyReminderOn: boolean; isFamilyReminderOn: boolean }>,
  [unknown]
>(async () => ({ isMyReminderOn: false, isFamilyReminderOn: true }));

const mockCancelQueries = jest.fn(async () => {});
const mockGetQueryData = jest.fn();
const mockSetQueryData = jest.fn<unknown, [unknown, unknown]>();
const mockInvalidateQueries = jest.fn(async () => {});

let mockAccessToken: string | null = "token";
let mockUser = {
  displayName: "홍길동",
  allergies: ["아스피린"],
  chronicConditions: ["천식"],
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options: unknown) => options),
  useMutation: jest.fn((options: unknown) => options),
  useQueryClient: jest.fn(),
}));

jest.mock("@/api/endpoints/family", () => ({
  fetchFamilies: () => mockFetchFamilies(),
}));

jest.mock("@/api/endpoints/notification", () => ({
  fetchNotificationSettings: () => mockFetchNotificationSettings(),
  patchNotificationSettings: (body: unknown) => mockPatchNotificationSettings(body),
}));

jest.mock("@/stores/sessionStore", () => ({
  useSessionStore: (selector: (state: { accessToken: string | null }) => unknown) =>
    selector({ accessToken: mockAccessToken }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

describe("api/queries/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessToken = "token";
    mockUser = {
      displayName: "홍길동",
      allergies: ["아스피린"],
      chronicConditions: ["천식"],
    };
    mockUseQueryClient.mockReturnValue({
      cancelQueries: mockCancelQueries,
      getQueryData: mockGetQueryData,
      setQueryData: mockSetQueryData,
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
  });

  it("프로필 유저/건강 정보를 userStore에서 파생한다", () => {
    const { result: userResult } = renderHook(() => useProfileUser());
    const { result: healthResult } = renderHook(() => useHealthInfo());

    expect(userResult.current.name).toBe("홍길동");
    expect(userResult.current.role).toBe("주 사용자");
    expect(healthResult.current.allergies).toEqual(["아스피린"]);
  });

  it("가족 목록 쿼리는 본인 + 가족 목록을 조합한다", async () => {
    const { result } = renderHook(() => useFamilyProfiles());
    const query = result.current as unknown as {
      enabled: boolean;
      queryKey: unknown;
      queryFn: () => Promise<Array<{ id: string; isActive: boolean }>>;
    };

    expect(query.enabled).toBe(true);
    expect(query.queryKey).toEqual(queryKeys.profile.families);
    const list = await query.queryFn();
    expect(list[0]).toEqual(expect.objectContaining({ id: "me", isActive: true }));
    expect(list[1]).toEqual(expect.objectContaining({ id: "10", isActive: false }));
  });

  it("알림 설정 조회/수정 훅은 쿼리 키와 mutation 핸들러를 구성한다", async () => {
    const { result: notificationResult } = renderHook(() => useNotificationSettings());
    const query = notificationResult.current as unknown as {
      queryKey: unknown;
      queryFn: () => Promise<unknown>;
    };
    expect(query.queryKey).toEqual(queryKeys.profile.notificationSettings);
    await query.queryFn();
    expect(mockFetchNotificationSettings).toHaveBeenCalledTimes(1);

    mockGetQueryData.mockReturnValue({ isMyReminderOn: true, isFamilyReminderOn: false });
    const { result: mutationResult } = renderHook(() => useUpdateNotificationSettings());
    const mutation = mutationResult.current as unknown as {
      mutationFn: (body: unknown) => Promise<unknown>;
      onMutate: (patch: {
        isMyReminderOn?: boolean;
        isFamilyReminderOn?: boolean;
      }) => Promise<{ previous: unknown }>;
      onError: (_error: unknown, _patch: unknown, context: { previous?: unknown }) => void;
      onSuccess: (updated: unknown) => void;
      onSettled: () => Promise<void>;
    };

    await mutation.mutationFn({ isMyReminderOn: false });
    expect(mockPatchNotificationSettings).toHaveBeenCalledWith({ isMyReminderOn: false });

    const context = await mutation.onMutate({ isMyReminderOn: false });
    expect(context.previous).toEqual({ isMyReminderOn: true, isFamilyReminderOn: false });
    expect(mockSetQueryData).toHaveBeenCalled();

    mutation.onError(new Error("x"), {}, { previous: { isMyReminderOn: true } });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.profile.notificationSettings, {
      isMyReminderOn: true,
    });

    mutation.onSuccess({ isMyReminderOn: false, isFamilyReminderOn: true });
    expect(mockSetQueryData).toHaveBeenCalledWith(queryKeys.profile.notificationSettings, {
      isMyReminderOn: false,
      isFamilyReminderOn: true,
    });

    await mutation.onSettled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.profile.notificationSettings,
    });
  });
});
