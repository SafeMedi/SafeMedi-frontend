import { renderHook } from "@testing-library/react-native";

import { useNotificationsViewModel } from "../useNotificationsViewModel";

const mockRefetch = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockRouterBack(...args),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock("@/api/queries/notification", () => ({
  useNotifications: () => ({
    data: {
      content: [
        {
          notificationId: 1,
          type: "MEDICATION_REMINDER",
          title: "약 복용 시간입니다",
          message: "테스트 메시지",
          isRead: false,
          targetType: "MEDICATION_RECORD",
          targetId: 100,
          createdAt: "2026-04-07T08:50:00",
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }),
  useUnreadNotificationCount: () => ({
    data: { unreadCount: 1 },
  }),
  useMarkNotificationRead: () => ({
    mutate: mockMarkRead,
  }),
  useMarkAllNotificationsRead: () => ({
    mutate: mockMarkAllRead,
    isPending: false,
  }),
}));

describe("useNotificationsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("알림 목록과 미읽음 개수를 반환한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it("뒤로가기 시 router.back을 호출한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressBack();

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("모두 읽음 시 markAllRead mutation을 호출한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());

    result.current.handlePressMarkAllRead();

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("알림 클릭 시 읽음 처리 후 대상 화면으로 이동한다", () => {
    const { result } = renderHook(() => useNotificationsViewModel());
    const item = result.current.items[0];

    result.current.handlePressNotification(item);

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/(tabs)/dashboard");
  });
});
